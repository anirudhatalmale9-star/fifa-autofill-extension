FIFA AUTOFILL EXTENSION
=======================
Auto-fill FIFA forms from CSV data using Alt+A hotkey.

INSTALLATION (StealthFox/Firefox):
1. Extract this folder
2. Go to about:debugging in browser
3. Click "This Firefox" on the left
4. Click "Load Temporary Add-on"
5. Select the manifest.json file

HOW TO USE:
1. Click the extension icon in toolbar
2. Paste your CSV data (with headers) into the text area
3. Click "Load CSV Data"
4. Select which account/row to use from the dropdown
5. Go to any FIFA page (login, registration, profile, payment)
6. Press Alt+A to autofill the form

CSV FORMAT:
Your CSV should have these column headers (order doesn't matter):
- email
- password
- first_name (or "first name")
- last_name (or "last name")
- full_name (or "full name")
- country
- address
- city
- zip_code (or "zip code" or "zip")
- province (or "state")
- phone (or "phone #")
- card_number (or "card number")
- cvc (or "cvv")
- card_expiry (or "expiry")
- card_name (or "cardholder")

EXAMPLE CSV:
email,password,last_name,first_name,full_name,country,address,city,zip_code,province,phone,card_number,cvc,card_expiry,card_name
john@email.com,pass123,Doe,John,John Doe,USA,123 Main St,New York,10001,New York,1234567890,4111111111111111,123,12/25,John Doe

SUPPORTED PAGES:
- FIFA Login (auth.fifa.com)
- FIFA Registration/Signup
- FIFA Profile Edit
- FIFA Ticket Payment
- Any fifa.com page with forms

HOTKEY:
Alt+A - Autofill current page with selected account

NOTES:
- Data is stored locally in your browser
- Export your Google Sheet as CSV and paste it
- Re-paste CSV when you update your spreadsheet
- Select different accounts from the dropdown for multi-account use
