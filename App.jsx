import React, { useState, useEffect } from 'react';
import { Upload, History as HistoryIcon, ArrowLeft, CheckCircle, AlertCircle, Calendar, CreditCard } from 'lucide-react';

function App() {
    const [currentView, setCurrentView] = useState('upload'); // 'upload', 'result', 'history'
    const [isLoading, setIsLoading] = useState(false);
    const [extractionResult, setExtractionResult] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [error, setError] = useState(null);

    // Navigation handlers
    const navigateTo = (view) => {
        setCurrentView(view);
        setError(null);
        if (view === 'history') {
            fetchHistory();
        }
    };

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            // Mock data for now, or fetch from backend if available
            // const response = await fetch('/api/history');
            // const data = await response.json();

            // Simulating API call for demonstration since backend might not send JSON for history yet
            // Based on history.html, it expects a list of payments

            // For now, we'll try to fetch from the actual backend if it supports JSON
            // If not, we'll start with an empty list or some mock data
            try {
                const res = await fetch('/history', { headers: { 'Accept': 'application/json' } });
                if (res.headers.get('content-type')?.includes('application/json')) {
                    const data = await res.json();
                    setHistoryData(data.payments || []);
                } else {
                    console.log("Backend does not return JSON for history yet.");
                }
            } catch (e) {
                console.error("Failed to fetch history", e);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json' // Request JSON response
                }
            });

            if (!response.ok) {
                // Check if response is HTML (error page)
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Upload failed');
                } else {
                    throw new Error('Server returned an error. Please check the image and try again.');
                }
            }

            const data = await response.json();

            // Adapt the response to our state
            setExtractionResult({
                amount: data.amount,
                upi_id: data.upi_id,
                date: data.date
            });
            setCurrentView('result');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to extract details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Navigation */}
            <nav className="navbar">
                <div className="nav-content">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('upload'); }} className="nav-logo">
                        <span className="logo-text">UPI Extractor</span>
                        <span className="logo-dot"></span>
                    </a>
                    <div className="nav-links">
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); navigateTo('upload'); }}
                            className={`nav-link ${currentView === 'upload' || currentView === 'result' ? 'active' : ''}`}
                        >
                            Upload
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); navigateTo('history'); }}
                            className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
                        >
                            History
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container">
                <div className="glass-card fade-in">

                    {error && (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                            <p style={{ color: '#fca5a5', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={18} /> {error}
                            </p>
                        </div>
                    )}

                    {currentView === 'upload' && (
                        <UploadView onUpload={handleUpload} />
                    )}

                    {currentView === 'result' && extractionResult && (
                        <ResultView
                            data={extractionResult}
                            onReset={() => navigateTo('upload')}
                            onHistory={() => navigateTo('history')}
                        />
                    )}

                    {currentView === 'history' && (
                        <HistoryView history={historyData} onBack={() => navigateTo('upload')} />
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>Built for Accuracy & Speed</p>
            </footer>

            {/* Loading Overlay */}
            {isLoading && (
                <div id="loader" className="loader-overlay">
                    <div className="spinner"></div>
                    <p> Analyzing Receipt...</p>
                </div>
            )}
        </>
    );
}

// Sub-components

function UploadView({ onUpload }) {
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="fade-in">
            <h2>Upload Receipt</h2>
            <p>Upload a screenshot from GPay, PhonePe, or Paytm.</p>

            <div
                className="file-drop-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input
                    type="file"
                    name="image"
                    accept="image/*"
                    required
                    title="Click to select image"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Upload size={32} />
                    <span>Click or Drag & Drop</span>
                </div>
            </div>

            <button onClick={() => fileInputRef.current?.click()}>
                <span>Extract Details</span>
            </button>
        </div>
    );
}

function ResultView({ data, onReset, onHistory }) {
    return (
        <div className="fade-in">
            <h2>Extracted Details</h2>
            <p>Here's what we found in your receipt.</p>

            <div className="result-group">
                <div className="result-row">
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> Amount Paid</span>
                    <span className="value value-highlight" style={{ color: '#4ade80' }}>₹{data.amount}</span>
                </div>

                <div className="result-row">
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={16} /> UPI ID</span>
                    <span className="value" style={{ fontSize: '0.9rem' }}>{data.upi_id}</span>
                </div>

                <div className="result-row">
                    <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Date</span>
                    <span className="value">{data.date}</span>
                </div>
            </div>

            <div className="actions" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
                <span onClick={onReset} className="btn-link">Upload Another</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span onClick={onHistory} className="btn-link">View History</span>
            </div>
        </div>
    );
}

function HistoryView({ history, onBack }) {
    return (
        <div className="fade-in">
            <h2>Payment History</h2>

            <div className="history-list" style={{ marginTop: '2rem' }}>
                {history && history.length > 0 ? (
                    (() => {
                        // Reverse copy of history to show newest first
                        const reversedHistory = [...history].reverse();
                        return reversedHistory.map((p, index) => (
                            <div className="history-card" key={index}>
                                <div className="history-info">
                                    <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>{p.upi_id}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.date}</p>
                                </div>
                                <div className="history-amount">
                                    ₹{p.amount}
                                </div>
                            </div>
                        ));
                    })()
                ) : (
                    <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                        <p>No history found.</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Home
                </a>
            </div>
        </div>
    );
}

export default App;
