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

// Handle Alt+A command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'autofill') {
    console.log('[FIFA Autofill] Alt+A command received');

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.log('[FIFA Autofill] No active tab');
      return;
    }

    console.log('[FIFA Autofill] Injecting script into tab:', tab.url);

    // Get the selected account
    const result = await chrome.storage.local.get(['accounts', 'selectedRow']);
    const accounts = result.accounts || [];
    const selectedRow = result.selectedRow || 0;
    const account = accounts[selectedRow];

    if (!account) {
      // Inject notification that no account is loaded
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          alert('[FIFA Autofill] No account loaded! Open extension popup and load your CSV first.');
        }
      });
      return;
    }

    // Inject the autofill script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: autofillPage,
        args: [account]
      });
      console.log('[FIFA Autofill] Script injected successfully');
    } catch (err) {
      console.error('[FIFA Autofill] Error injecting script:', err);
    }
  }
});

// This function will be injected into the page
function autofillPage(account) {
  console.log('[FIFA Autofill] Autofill function running with account:', account.email);

  // Set value with proper event triggering for React forms
  function setValue(element, value) {
    if (!element || !value) return false;

    element.focus();
    element.click();

    if (element.tagName === 'SELECT') {
      const options = element.querySelectorAll('option');
      for (const opt of options) {
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
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    return true;
  }

  let filledCount = 0;

  // Find all visible input fields
  const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
  console.log('[FIFA Autofill] Found', allInputs.length, 'input fields');

  for (const input of allInputs) {
    const placeholder = (input.placeholder || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const type = (input.type || '').toLowerCase();

    // Find the label for this input
    let labelText = '';
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) labelText = label.textContent.toLowerCase();
    }
    let parent = input.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      const text = parent.textContent.toLowerCase();
      if (text.length < 100) labelText = text;
      parent = parent.parentElement;
    }

    console.log('[FIFA Autofill] Input:', { placeholder, name, id, type, labelText: labelText.substring(0, 50) });

    // Card Number
    if ((placeholder.includes('1234') || labelText.includes('card number') ||
         name.includes('cardnumber') || name.includes('card_number') || name.includes('pan')) && account.card_number) {
      console.log('[FIFA Autofill] Filling card number');
      setValue(input, account.card_number);
      filledCount++;
      continue;
    }

    // Card Holder / Name on card
    if ((placeholder.includes('enter your name') || placeholder.includes('your name') ||
         labelText.includes('card holder') || labelText.includes('cardholder') ||
         name.includes('holder') || name.includes('cardname')) && (account.card_name || account.full_name)) {
      console.log('[FIFA Autofill] Filling card holder');
      setValue(input, account.card_name || account.full_name);
      filledCount++;
      continue;
    }

    // CVV / CVC
    if ((placeholder === 'cvv' || placeholder.includes('cvv') || placeholder.includes('cvc') ||
         labelText.includes('security code') || labelText.includes('cvv') ||
         name.includes('cvv') || name.includes('cvc') || name.includes('securitycode')) && account.cvc) {
      console.log('[FIFA Autofill] Filling CVV');
      setValue(input, account.cvc);
      filledCount++;
      continue;
    }

    // Email
    if ((type === 'email' || placeholder.includes('email') || name.includes('email') || labelText.includes('email')) && account.email) {
      console.log('[FIFA Autofill] Filling email');
      setValue(input, account.email);
      filledCount++;
      continue;
    }

    // Password
    if ((type === 'password' || name.includes('password')) && account.password) {
      console.log('[FIFA Autofill] Filling password');
      setValue(input, account.password);
      filledCount++;
      continue;
    }

    // First Name
    if ((placeholder.includes('first name') || name.includes('firstname') || name.includes('first_name') || labelText.includes('first name')) && account.first_name) {
      console.log('[FIFA Autofill] Filling first name');
      setValue(input, account.first_name);
      filledCount++;
      continue;
    }

    // Last Name
    if ((placeholder.includes('last name') || name.includes('lastname') || name.includes('last_name') || labelText.includes('last name')) && account.last_name) {
      console.log('[FIFA Autofill] Filling last name');
      setValue(input, account.last_name);
      filledCount++;
      continue;
    }

    // Phone
    if ((type === 'tel' || placeholder.includes('phone') || name.includes('phone') || name.includes('mobile') || labelText.includes('phone')) && account.phone) {
      console.log('[FIFA Autofill] Filling phone');
      setValue(input, account.phone);
      filledCount++;
      continue;
    }

    // Address
    if ((placeholder.includes('address') || placeholder.includes('street') || name.includes('address') || labelText.includes('address')) && account.address) {
      console.log('[FIFA Autofill] Filling address');
      setValue(input, account.address);
      filledCount++;
      continue;
    }

    // City
    if ((placeholder.includes('city') || name.includes('city') || labelText.includes('city')) && account.city) {
      console.log('[FIFA Autofill] Filling city');
      setValue(input, account.city);
      filledCount++;
      continue;
    }

    // Zip Code
    if ((placeholder.includes('zip') || placeholder.includes('postal') || name.includes('zip') || name.includes('postal') || labelText.includes('zip')) && account.zip_code) {
      console.log('[FIFA Autofill] Filling zip code');
      setValue(input, account.zip_code);
      filledCount++;
      continue;
    }
  }

  // Handle expiry date dropdowns
  if (account.card_expiry) {
    const parts = account.card_expiry.split('/');
    if (parts.length === 2) {
      const month = parts[0].trim().padStart(2, '0');
      let year = parts[1].trim();
      if (year.length === 2) year = '20' + year;

      const allSelects = document.querySelectorAll('select');
      console.log('[FIFA Autofill] Found', allSelects.length, 'select elements');

      for (const select of allSelects) {
        const options = Array.from(select.options);
        const optTexts = options.map(o => o.textContent.toLowerCase());
        const optValues = options.map(o => o.value);
        const selectText = (select.id + select.name + select.className).toLowerCase();

        // Month dropdown
        if (optTexts.some(t => t.includes('month')) || optValues.includes('01') || optValues.includes('1') ||
            selectText.includes('month')) {
          for (const opt of options) {
            if (opt.value === month || opt.value === parseInt(month).toString()) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('[FIFA Autofill] Filled month:', month);
              filledCount++;
              break;
            }
          }
        }

        // Year dropdown
        if (optTexts.some(t => t.includes('year')) || optValues.some(v => /^20\d{2}$/.test(v)) ||
            selectText.includes('year')) {
          const shortYear = year.slice(-2);
          for (const opt of options) {
            if (opt.value === year || opt.value === shortYear ||
                opt.textContent.includes(year) || opt.textContent.includes(shortYear)) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('[FIFA Autofill] Filled year:', year);
              filledCount++;
              break;
            }
          }
        }

        // State/Province dropdown
        if ((optTexts.some(t => t.includes('state') || t.includes('province')) ||
            selectText.includes('state') || selectText.includes('province')) && account.province) {
          for (const opt of options) {
            if (opt.value.toLowerCase().includes(account.province.toLowerCase()) ||
                opt.textContent.toLowerCase().includes(account.province.toLowerCase())) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('[FIFA Autofill] Filled state/province');
              filledCount++;
              break;
            }
          }
        }

        // Country dropdown
        if ((optTexts.some(t => t.includes('country')) || selectText.includes('country')) && account.country) {
          for (const opt of options) {
            if (opt.value.toLowerCase().includes(account.country.toLowerCase()) ||
                opt.textContent.toLowerCase().includes(account.country.toLowerCase())) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('[FIFA Autofill] Filled country');
              filledCount++;
              break;
            }
          }
        }
      }
    }
  }

  // Show notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${filledCount > 0 ? '#1a472a' : '#8b0000'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  notification.textContent = filledCount > 0
    ? `Filled ${filledCount} fields for ${account.email}`
    : 'No matching fields found. Check console (F12) for details.';
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4000);

  console.log('[FIFA Autofill] Total filled:', filledCount);
}

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
