/**
 * FIFA AUTOFILL - Background Script (Firefox/StealthFox compatible)
 */

// Initialize storage with empty data
browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.get(['accounts', 'selectedRow']).then((result) => {
    if (!result.accounts) {
      browser.storage.local.set({ accounts: [], selectedRow: 0 });
    }
  });
  console.log('[FIFA Autofill] Extension installed');
});

// Listen for messages from popup or content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedAccount') {
    browser.storage.local.get(['accounts', 'selectedRow']).then((result) => {
      const accounts = result.accounts || [];
      const selectedRow = result.selectedRow || 0;
      sendResponse({ account: accounts[selectedRow] || null, row: selectedRow });
    });
    return true;
  }
});
