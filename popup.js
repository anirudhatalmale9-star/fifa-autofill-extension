/**
 * FIFA AUTOFILL - Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const csvInput = document.getElementById('csvInput');
  const loadBtn = document.getElementById('loadBtn');
  const accountSelect = document.getElementById('accountSelect');
  const statusDiv = document.getElementById('status');
  const accountPreview = document.getElementById('accountPreview');
  const previewEmail = document.getElementById('previewEmail');
  const previewName = document.getElementById('previewName');
  const previewPhone = document.getElementById('previewPhone');

  // Load saved data on popup open
  browser.storage.local.get(['accounts', 'selectedRow', 'csvData']).then((result) => {
    if (result.csvData) {
      csvInput.value = result.csvData;
    }
    if (result.accounts && result.accounts.length > 0) {
      populateAccountSelect(result.accounts, result.selectedRow || 0);
    }
  });

  // Parse CSV string to array of objects
  function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header - handle various column name formats
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));

    // Map common variations to standard names
    const headerMap = {
      'email': 'email',
      'password': 'password',
      'last name': 'last_name',
      'last_name': 'last_name',
      'lastname': 'last_name',
      'first name': 'first_name',
      'first_name': 'first_name',
      'firstname': 'first_name',
      'full name': 'full_name',
      'full_name': 'full_name',
      'fullname': 'full_name',
      'country': 'country',
      'address': 'address',
      'city': 'city',
      'zip code': 'zip_code',
      'zip_code': 'zip_code',
      'zipcode': 'zip_code',
      'zip': 'zip_code',
      'province': 'province',
      'state': 'province',
      'phone': 'phone',
      'phone #': 'phone',
      'phone_number': 'phone',
      'phonenumber': 'phone',
      'card_number': 'card_number',
      'card number': 'card_number',
      'cardnumber': 'card_number',
      'cc': 'card_number',
      'cvc': 'cvc',
      'cvv': 'cvc',
      'card_expiry': 'card_expiry',
      'card expiry': 'card_expiry',
      'expiry': 'card_expiry',
      'exp': 'card_expiry',
      'expiry_date': 'card_expiry',
      'card_name': 'card_name',
      'card name': 'card_name',
      'cardholder': 'card_name',
      'cardholder_name': 'card_name'
    };

    const normalizedHeaders = headers.map(h => headerMap[h] || h);

    const accounts = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with quoted values
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const account = {};
      normalizedHeaders.forEach((header, index) => {
        account[header] = values[index] || '';
      });
      accounts.push(account);
    }
    return accounts;
  }

  // Populate account dropdown
  function populateAccountSelect(accounts, selectedRow) {
    accountSelect.innerHTML = '';
    accounts.forEach((account, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${index + 1}. ${account.email || 'No email'} - ${account.full_name || account.first_name || 'Unknown'}`;
      accountSelect.appendChild(option);
    });
    accountSelect.value = selectedRow;
    updatePreview(accounts[selectedRow]);
  }

  // Update account preview
  function updatePreview(account) {
    if (account) {
      accountPreview.style.display = 'block';
      previewEmail.textContent = account.email || '-';
      previewName.textContent = account.full_name || `${account.first_name} ${account.last_name}` || '-';
      previewPhone.textContent = account.phone || '-';
    } else {
      accountPreview.style.display = 'none';
    }
  }

  // Show status message
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (isError ? 'error' : 'success');
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
  }

  // Load CSV button click
  loadBtn.addEventListener('click', () => {
    const csv = csvInput.value.trim();
    if (!csv) {
      showStatus('Please paste CSV data first', true);
      return;
    }

    const accounts = parseCSV(csv);
    if (accounts.length === 0) {
      showStatus('No valid accounts found in CSV', true);
      return;
    }

    browser.storage.local.set({
      accounts: accounts,
      selectedRow: 0,
      csvData: csv
    }).then(() => {
      populateAccountSelect(accounts, 0);
      showStatus(`Loaded ${accounts.length} accounts!`);
    });
  });

  // Account select change
  accountSelect.addEventListener('change', () => {
    const selectedRow = parseInt(accountSelect.value);
    browser.storage.local.get(['accounts']).then((result) => {
      browser.storage.local.set({ selectedRow: selectedRow });
      updatePreview(result.accounts[selectedRow]);
    });
  });
});
