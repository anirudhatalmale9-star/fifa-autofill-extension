/**
 * FIFA AUTOFILL - Popup Script
 * Chrome/Mimic compatible - Auto-loads from accounts.csv
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

  // Use chrome.storage for Chrome/Mimic compatibility
  const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local :
                  (typeof browser !== 'undefined' && browser.storage) ? browser.storage.local : null;

  if (!storage) {
    console.error('No storage API available');
    return;
  }

  // Load accounts from embedded CSV file
  async function loadEmbeddedCSV() {
    try {
      const response = await fetch(chrome.runtime.getURL('accounts.csv'));
      const csvText = await response.text();
      return parseCSV(csvText);
    } catch (err) {
      console.error('[FIFA Autofill] Error loading accounts.csv:', err);
      return [];
    }
  }

  // Initialize - check storage first, then load from CSV if needed
  async function init() {
    storage.get(['accounts', 'selectedRow', 'csvData'], async (result) => {
      if (result.accounts && result.accounts.length > 0) {
        // Use saved accounts
        if (result.csvData) {
          csvInput.value = result.csvData;
        }
        populateAccountSelect(result.accounts, result.selectedRow || 0);
      } else {
        // Load from embedded CSV file
        const embeddedAccounts = await loadEmbeddedCSV();
        if (embeddedAccounts.length > 0) {
          console.log('[FIFA Autofill] Auto-loading', embeddedAccounts.length, 'accounts from CSV file');
          storage.set({
            accounts: embeddedAccounts,
            selectedRow: 0
          }, () => {
            populateAccountSelect(embeddedAccounts, 0);
            showStatus(`Auto-loaded ${embeddedAccounts.length} accounts from CSV!`);
          });
        }
      }
    });
  }

  // Start initialization
  init();

  // Parse CSV string to array of objects
  function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header
    let headerLine = lines[0].toLowerCase();
    if (headerLine.endsWith(',')) headerLine = headerLine.slice(0, -1);
    let headers = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));

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

    // Normalize headers
    let normalizedHeaders = headers.map(h => headerMap[h] || h);

    // Check if we have data with more columns than headers
    const firstDataLine = lines[1].trim();
    const firstDataValues = parseCSVLine(firstDataLine);

    if (firstDataValues.length > normalizedHeaders.length) {
      const diff = firstDataValues.length - normalizedHeaders.length;
      for (let i = 0; i < diff; i++) {
        if (!normalizedHeaders.includes('card_expiry')) {
          normalizedHeaders.push('card_expiry');
        } else {
          normalizedHeaders.push('extra_' + i);
        }
      }
    }

    const accounts = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const account = {};

      normalizedHeaders.forEach((header, index) => {
        if (header && header.trim()) {
          account[header] = values[index] || '';
        }
      });

      // Auto-generate full_name if missing
      if (!account.full_name && account.first_name && account.last_name) {
        account.full_name = account.first_name + ' ' + account.last_name;
      }

      // Use full_name as card_name if missing
      if (!account.card_name && account.full_name) {
        account.card_name = account.full_name;
      }

      accounts.push(account);
    }
    return accounts;
  }

  // Parse a single CSV line, handling quotes
  function parseCSVLine(line) {
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
    return values;
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

    storage.set({
      accounts: accounts,
      selectedRow: 0,
      csvData: csv
    }, () => {
      populateAccountSelect(accounts, 0);
      showStatus(`Loaded ${accounts.length} accounts!`);
    });
  });

  // Account select change
  accountSelect.addEventListener('change', () => {
    const selectedRow = parseInt(accountSelect.value);
    storage.get(['accounts'], (result) => {
      storage.set({ selectedRow: selectedRow });
      updatePreview(result.accounts[selectedRow]);
    });
  });
});
