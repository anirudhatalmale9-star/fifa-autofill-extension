/**
 * FIFA AUTOFILL - Background Script (Chrome/Mimic compatible - Manifest v3)
 */

// Initialize storage with empty data
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['accounts', 'selectedRow'], (result) => {
    if (!result.accounts) {
      chrome.storage.local.set({ accounts: [], selectedRow: 0 });
    }
  });
  console.log('[FIFA Autofill] Extension installed');
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedAccount') {
    chrome.storage.local.get(['accounts', 'selectedRow'], (result) => {
      const accounts = result.accounts || [];
      const selectedRow = result.selectedRow || 0;
      sendResponse({ account: accounts[selectedRow] || null, row: selectedRow });
    });
    return true;
  }
});
