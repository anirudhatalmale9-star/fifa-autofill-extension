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

  // Autofill button click - inject script into current tab
  const autofillBtn = document.getElementById('autofillBtn');
  autofillBtn.addEventListener('click', async () => {
    // Get selected account
    storage.get(['accounts', 'selectedRow'], async (result) => {
      const accounts = result.accounts || [];
      const selectedRow = result.selectedRow || 0;
      const account = accounts[selectedRow];

      if (!account) {
        showStatus('No account selected! Load CSV first.', true);
        return;
      }

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showStatus('No active tab found', true);
        return;
      }

      showStatus('Injecting autofill script...');

      // Inject the autofill function into all frames
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: runAutofill,
          args: [account]
        });
        console.log('Injection results:', results);
        showStatus('Autofill triggered! Check the page.');
      } catch (err) {
        console.error('Injection error:', err);
        showStatus('Error: ' + err.message, true);
      }
    });
  });

  // Autofill function to be injected
  function runAutofill(account) {
    console.log('[FIFA Autofill] Running autofill for:', account.email);

    function setValue(element, value) {
      if (!element || !value) return false;
      element.focus();
      element.click();

      if (element.tagName === 'SELECT') {
        for (const opt of element.options) {
          if (opt.value.toLowerCase().includes(value.toLowerCase()) ||
              opt.textContent.toLowerCase().includes(value.toLowerCase())) {
            element.value = opt.value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      }

      element.value = '';
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    }

    let filled = 0;
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    console.log('[FIFA Autofill] Found', inputs.length, 'inputs');

    for (const input of inputs) {
      const ph = (input.placeholder || '').toLowerCase();
      const nm = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const tp = (input.type || '').toLowerCase();

      // Get nearby text for context
      let context = '';
      let parent = input.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        context += ' ' + (parent.textContent || '').toLowerCase();
        parent = parent.parentElement;
      }

      console.log('[FIFA Autofill] Input:', { ph, nm, id, tp });

      // Card Number
      if ((ph.includes('1234') || context.includes('card number')) && account.card_number) {
        setValue(input, account.card_number);
        filled++;
        continue;
      }
      // Card Holder
      if ((ph.includes('enter your name') || ph.includes('your name') || context.includes('card holder')) && (account.card_name || account.full_name)) {
        setValue(input, account.card_name || account.full_name);
        filled++;
        continue;
      }
      // CVV
      if ((ph === 'cvv' || ph.includes('cvv') || context.includes('security code') || context.includes('cvv')) && account.cvc) {
        setValue(input, account.cvc);
        filled++;
        continue;
      }
      // Email
      if ((tp === 'email' || nm.includes('email')) && account.email) {
        setValue(input, account.email);
        filled++;
        continue;
      }
      // Password
      if (tp === 'password' && account.password) {
        setValue(input, account.password);
        filled++;
        continue;
      }
      // Phone
      if ((tp === 'tel' || nm.includes('phone')) && account.phone) {
        setValue(input, account.phone);
        filled++;
        continue;
      }
      // First name
      if ((nm.includes('firstname') || nm.includes('first_name')) && account.first_name) {
        setValue(input, account.first_name);
        filled++;
        continue;
      }
      // Last name
      if ((nm.includes('lastname') || nm.includes('last_name')) && account.last_name) {
        setValue(input, account.last_name);
        filled++;
        continue;
      }
      // Address
      if ((nm.includes('address') || ph.includes('address')) && account.address) {
        setValue(input, account.address);
        filled++;
        continue;
      }
      // City
      if ((nm.includes('city') || ph.includes('city')) && account.city) {
        setValue(input, account.city);
        filled++;
        continue;
      }
      // Zip
      if ((nm.includes('zip') || nm.includes('postal')) && account.zip_code) {
        setValue(input, account.zip_code);
        filled++;
        continue;
      }
    }

    // Handle all select dropdowns
    const selects = document.querySelectorAll('select');
    for (const sel of selects) {
      const opts = Array.from(sel.options);
      const optTexts = opts.map(o => o.textContent.toLowerCase());
      const selId = (sel.id || '').toLowerCase();
      const selName = (sel.name || '').toLowerCase();

      // Get nearby label text
      let labelText = '';
      let parent = sel.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        labelText += ' ' + (parent.textContent || '').toLowerCase();
        parent = parent.parentElement;
      }

      // Gender dropdown
      if ((selId.includes('gender') || selName.includes('gender') || labelText.includes('gender') || optTexts.some(t => t.includes('select your gender'))) && account.gender) {
        for (const opt of opts) {
          if (opt.value.toLowerCase().includes(account.gender.toLowerCase()) ||
              opt.textContent.toLowerCase().includes(account.gender.toLowerCase())) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            console.log('[FIFA Autofill] Filled gender:', account.gender);
            break;
          }
        }
        continue;
      }

      // Language dropdown
      if ((selId.includes('language') || selName.includes('language') || labelText.includes('language') || labelText.includes('communication') || optTexts.some(t => t.includes('choose language'))) && account.language) {
        for (const opt of opts) {
          if (opt.value.toLowerCase().includes(account.language.toLowerCase()) ||
              opt.textContent.toLowerCase().includes(account.language.toLowerCase())) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            console.log('[FIFA Autofill] Filled language:', account.language);
            break;
          }
        }
        continue;
      }

      // Month dropdown (for card expiry)
      if (account.card_expiry && (optTexts.some(t => t.includes('month')) || opts.some(o => o.value === '01' || o.value === '1'))) {
        const parts = account.card_expiry.split('/');
        if (parts.length === 2) {
          const month = parts[0].trim().padStart(2, '0');
          for (const opt of opts) {
            if (opt.value === month || opt.value === parseInt(month).toString()) {
              sel.value = opt.value;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              filled++;
              break;
            }
          }
        }
        continue;
      }

      // Year dropdown (for card expiry)
      if (account.card_expiry && (optTexts.some(t => t.includes('year')) || opts.some(o => /^20\d{2}$/.test(o.value)))) {
        const parts = account.card_expiry.split('/');
        if (parts.length === 2) {
          let year = parts[1].trim();
          if (year.length === 2) year = '20' + year;
          const shortYear = year.slice(-2);
          for (const opt of opts) {
            if (opt.value === year || opt.value === shortYear || opt.textContent.includes(year)) {
              sel.value = opt.value;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              filled++;
              break;
            }
          }
        }
        continue;
      }

      // Country dropdown
      if ((selId.includes('country') || selName.includes('country') || labelText.includes('country')) && account.country) {
        for (const opt of opts) {
          if (opt.value.toLowerCase().includes(account.country.toLowerCase()) ||
              opt.textContent.toLowerCase().includes(account.country.toLowerCase())) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            break;
          }
        }
        continue;
      }

      // State/Province dropdown
      if ((selId.includes('state') || selId.includes('province') || selName.includes('state') || selName.includes('province') || labelText.includes('state') || labelText.includes('province')) && account.province) {
        for (const opt of opts) {
          if (opt.value.toLowerCase().includes(account.province.toLowerCase()) ||
              opt.textContent.toLowerCase().includes(account.province.toLowerCase())) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            break;
          }
        }
        continue;
      }
    }

    // Show result
    const msg = filled > 0 ? `Filled ${filled} fields!` : 'No fields filled. Check console.';
    const notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;top:20px;right:20px;background:' + (filled > 0 ? '#1a472a' : '#8b0000') + ';color:white;padding:16px 24px;border-radius:8px;z-index:999999;font-family:sans-serif;';
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);

    console.log('[FIFA Autofill] Filled', filled, 'fields');
  }
});
