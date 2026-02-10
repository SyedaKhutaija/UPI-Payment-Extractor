# UPI-Payment-Extractor
# Universal UPI Payment Extractor

A robust Flask application that extracts payment details (Amount, UPI ID, Date) from payment screenshots using Tesseract OCR. It features a "Deep Space Glass" premium UI and uses smart font-size heuristics to work universally across Google Pay, PhonePe, and Paytm.

![Review](backend/static/screenshot.png) <!-- Conceptual placeholder -->

## Features

-   **Universal Extraction**: Works on GPay, PhonePe, and Paytm receipts.
-   **Smart Logic**: Uses font-size analysis to identify the transaction amount (largest text) instead of fragile regex positions.
-   **Premium UI**: A "Deep Space Glass" theme with glassmorphism, gradients, and animations.
-   **History Tracking**: Saves all extracted payments to a local database.
-   **Responsive Design**: Works on desktop and mobile.

## Tech Stack

-   **Backend**: Python, Flask, SQLAlchemy
-   **OCR**: Tesseract 5, pytesseract, Pandas (for layout analysis)
-   **Frontend**: HTML5, CSS3 (Variables, Flexbox, Glassmorphism)
-   **Database**: SQLite

## Installation

1.  **Install Python 3.8+**
2.  **Install Tesseract OCR**:
    -   Download and install from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
    -   Ensure the path in `app.py` matches your installation:
        ```python
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        ```
3.  **Install Dependencies**:
    ```bash
    pip install flask flask_sqlalchemy pytesseract pillow pandas
    ```

## Usage

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Run the application:
    ```bash
    python app.py
    ```
3.  Open your browser at `http://127.0.0.1:5000`.
4.  Upload a payment screenshot to extract details.

## How it Works

1.  **Image Preprocessing**: The image is converted to grayscale to aid text recognition.
2.  **Layout Analysis**: `pytesseract` analyzes the image to find text blocks and their **font heights**.
3.  **Heuristic Extraction**:
    -   **Amount**: The logic identifies the *largest number* on the screen as the Amount.
    -   **UPI ID**: Regex searches for patterns like `name@bank`.
    -   **Date**: Regex searches for formats like `09 Feb 2026` or `09/02/2026`.
4.  **Display**: The data is presented in a styled result card and saved to the history.

## Troubleshooting

-   **"Tesseract Not Found"**: Verify the path in `app.py`.
-   **Wrong Amount**: Ensure the image is clear. The app looks for the largest text; if the screenshot is cropped weirdly, it might fail.

###Screenshots

<img width="1765" height="909" alt="image" src="https://github.com/user-attachments/assets/31404a66-90bb-4d63-8119-1b7cfaae7c8e" />

<img width="1858" height="884" alt="image" src="https://github.com/user-attachments/assets/9fd1871b-056d-4730-a129-256c7bc866f8" />
<img width="1509" height="756" alt="image" src="https://github.com/user-attachments/assets/6a017d54-a985-43ef-8801-c4ed3218e4b1" />

