/**
 * FIFA AUTOFILL - Account Loader
 * Loads accounts from accounts.csv file in extension folder
 */

// This will be populated from accounts.csv
let EMBEDDED_ACCOUNTS = [];

// Load accounts from CSV file
(async function loadAccountsFromCSV() {
  try {
    const response = await fetch(chrome.runtime.getURL('accounts.csv'));
    const csvText = await response.text();

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    // Parse header
    let headerLine = lines[0].toLowerCase();
    if (headerLine.endsWith(',')) headerLine = headerLine.slice(0, -1);
    const headers = headerLine.split(',').map(h => h.trim());

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const account = {};

      headers.forEach((header, index) => {
        account[header] = values[index] || '';
      });

      // Auto-generate full_name if missing
      if (!account.full_name && account.first_name && account.last_name) {
        account.full_name = account.first_name + ' ' + account.last_name;
      }

      // Use full_name as card_name if missing
      if (!account.card_name && account.full_name) {
        account.card_name = account.full_name;
      }

      EMBEDDED_ACCOUNTS.push(account);
    }

    console.log('[FIFA Autofill] Loaded', EMBEDDED_ACCOUNTS.length, 'accounts from CSV');
  } catch (err) {
    console.error('[FIFA Autofill] Error loading accounts.csv:', err);
  }
})();
