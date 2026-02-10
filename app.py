from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy
import pytesseract
from PIL import Image, ImageOps, ImageEnhance
import re
import pandas as pd
import io

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = Flask(__name__)

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///payments.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database model
class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.String(100))
    upi_id = db.Column(db.String(200))
    date = db.Column(db.String(100))
    raw_text = db.Column(db.Text)

# Create DB
with app.app_context():
    db.create_all()

def clean_amount_str(val):
    """
    Cleans a number string: "3, 400" -> "3400", "77.00" -> "77"
    """
    if not isinstance(val, str): return ""
    # Remove spaces and commas
    clean = val.replace(' ', '').replace(',', '')
    # Remove surrounding non-digits (currency symbols, etc)
    clean = re.sub(r'[^\d.]', '', clean)
    
    # Handle decimals
    if '.' in clean:
        try:
            f = float(clean)
            if f.is_integer():
                return str(int(f))
            return str(f)
        except:
            return clean
    return clean

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["image"]
    
    if not file:
        return "No file uploaded", 400

    image = Image.open(file)
    
    # Basic Preprocessing for better structure
    # We DON'T want high contrast here as it might mess up font size detection
    # But grayscale helps Tesseract.
    image = image.convert('L') 
    
    # --- Universal Extraction Logic (Font Size Heuristic) ---
    
    # Get detailed data including box coordinates and height (font size)
    # output_type='dict' gives us lists of values
    data = pytesseract.image_to_data(image, config='--psm 6', output_type=pytesseract.Output.DICT)
    
    # Convert to DataFrame for easier analysis
    df = pd.DataFrame(data)
    
    # Filter out empty text
    df = df[df['text'].str.strip() != '']
    
    # Convert text to string (incase of numeric interference)
    df['text'] = df['text'].astype(str)
    
    amount = "Not Found"
    upi_id = "Not Found"
    date = "Not Found"
    
    full_text = " ".join(df['text'].tolist())

    # --- 1. Amount Extraction (Largest Font Strategy) ---
    # The amount is almost always the largest text on the receipt.
    
    # Filter for candidate lines that look like numbers
    # We want text blocks that contain digits
    
    def is_potential_amount(text):
        # Must contain at least one digit
        if not re.search(r'\d', text): return False
        # Ignore obvious non-amounts
        if re.search(r'(failed|success|transaction|id|ref|date|time|pm|am|202\d)', text.lower()): return False
        return True

    # Get max height (font size)
    if not df.empty:
        # Sort by height descending
        df_sorted = df.sort_values(by='height', ascending=False)
        
        candidates = []
        for index, row in df_sorted.iterrows():
            text_val = row['text']
            height = row['height']
            
            # Combine neighbors? Tesseract splits "77" and ".00" sometimes.
            # For now, let's look at individual blocks and strict regex
            
            # Check if this block contains a currency symbol
            if re.search(r'(₹|Rs|INR)', text_val, re.IGNORECASE):
                # If the symbol is found, the number is likely in the same block or next
                candidates.append((text_val, height + 10)) # Boost priority
                
            # Check if it's a number
            if is_potential_amount(text_val):
                candidates.append((text_val, height))

        # Process candidates from largest to smallest
        for cand_text, _ in candidates:
            # Try to parse number
            # Valid: "77", "3,400", "500.00"
            clean = clean_amount_str(cand_text)
            if clean:
                # Validate it's not a year or phone
                try:
                    val = float(clean)
                    if 2000 <= val <= 2035: continue # Year
                    if len(clean.replace('.','')) > 8: continue # Too long
                    
                    amount = clean
                    break # Found the largest valid number!
                except:
                    pass
    
    # Fallback to Regex if Heuristic failed
    if amount == "Not Found":
         amount_match = re.search(r'(?:₹|Rs\.?|INR)\s*([\d, ]+(?:\.\d{1,2})?)', full_text, re.IGNORECASE)
         if amount_match:
             amount = clean_amount_str(amount_match.group(1))

    # --- 2. UPI ID Extraction ---
    # Regex for standard UPI IDs
    upi_match = re.search(r'[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}', full_text)
    if upi_match:
        upi_id = upi_match.group(0)

    # --- 3. Date Extraction ---
    date_regex = r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
    date_match = re.search(date_regex, full_text, re.IGNORECASE)
    if date_match:
         date = date_match.group(1) if date_match.group(1) else date_match.group(2)

    # Save to DB
    new_payment = Payment(
        amount=amount,
        upi_id=upi_id,
        date=date,
        raw_text=full_text
    )

    db.session.add(new_payment)
    db.session.commit()

    return render_template("result.html", amount=amount, upi_id=upi_id, date=date, raw_text=full_text)

@app.route("/history")
def history():
    payments = Payment.query.all()
    return render_template("history.html", payments=payments)

if __name__ == "__main__":
    app.run(debug=True)
