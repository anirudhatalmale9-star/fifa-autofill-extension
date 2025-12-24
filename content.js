/**
 * FIFA AUTOFILL - Content Script
 * Auto-fills FIFA forms with account data using Alt+A hotkey
 */

(function() {
  'use strict';

  // Field mapping: CSV column -> possible input selectors
  const FIELD_MAPPINGS = {
    // Login fields
    email: [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]'
    ],
    password: [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="password"]',
      'input[placeholder*="password" i]',
      'input[autocomplete="current-password"]',
      'input[autocomplete="new-password"]'
    ],

    // Personal info fields
    first_name: [
      'input[name="firstName"]',
      'input[name="first_name"]',
      'input[name="firstname"]',
      'input[id*="firstName"]',
      'input[id*="first_name"]',
      'input[placeholder*="first name" i]',
      'input[autocomplete="given-name"]'
    ],
    last_name: [
      'input[name="lastName"]',
      'input[name="last_name"]',
      'input[name="lastname"]',
      'input[id*="lastName"]',
      'input[id*="last_name"]',
      'input[placeholder*="last name" i]',
      'input[autocomplete="family-name"]'
    ],
    full_name: [
      'input[name="fullName"]',
      'input[name="full_name"]',
      'input[name="name"]',
      'input[id*="fullName"]',
      'input[placeholder*="full name" i]',
      'input[autocomplete="name"]'
    ],

    // Address fields
    address: [
      'input[name="address"]',
      'input[name="address1"]',
      'input[name="street"]',
      'input[id*="address"]',
      'input[placeholder*="address" i]',
      'input[placeholder*="street" i]',
      'input[autocomplete="street-address"]',
      'input[autocomplete="address-line1"]'
    ],
    city: [
      'input[name="city"]',
      'input[id*="city"]',
      'input[placeholder*="city" i]',
      'input[autocomplete="address-level2"]'
    ],
    zip_code: [
      'input[name="zip"]',
      'input[name="zipCode"]',
      'input[name="zip_code"]',
      'input[name="postalCode"]',
      'input[name="postal_code"]',
      'input[id*="zip"]',
      'input[id*="postal"]',
      'input[placeholder*="zip" i]',
      'input[placeholder*="postal" i]',
      'input[autocomplete="postal-code"]'
    ],
    province: [
      'input[name="state"]',
      'input[name="province"]',
      'input[name="region"]',
      'input[id*="state"]',
      'input[id*="province"]',
      'input[placeholder*="state" i]',
      'input[placeholder*="province" i]',
      'select[name="state"]',
      'select[name="province"]',
      'select[id*="state"]',
      'select[id*="province"]',
      'input[autocomplete="address-level1"]'
    ],
    country: [
      'input[name="country"]',
      'input[id*="country"]',
      'select[name="country"]',
      'select[id*="country"]',
      'input[autocomplete="country-name"]'
    ],
    phone: [
      'input[name="phone"]',
      'input[name="phoneNumber"]',
      'input[name="phone_number"]',
      'input[name="mobile"]',
      'input[type="tel"]',
      'input[id*="phone"]',
      'input[placeholder*="phone" i]',
      'input[autocomplete="tel"]'
    ],

    // Payment fields
    card_number: [
      'input[name="cardNumber"]',
      'input[name="card_number"]',
      'input[name="ccnumber"]',
      'input[id*="cardNumber"]',
      'input[id*="card-number"]',
      'input[placeholder*="card number" i]',
      'input[autocomplete="cc-number"]'
    ],
    cvc: [
      'input[name="cvc"]',
      'input[name="cvv"]',
      'input[name="securityCode"]',
      'input[id*="cvc"]',
      'input[id*="cvv"]',
      'input[placeholder*="cvc" i]',
      'input[placeholder*="cvv" i]',
      'input[autocomplete="cc-csc"]'
    ],
    card_expiry: [
      'input[name="expiry"]',
      'input[name="expiryDate"]',
      'input[name="expiration"]',
      'input[id*="expir"]',
      'input[placeholder*="expir" i]',
      'input[placeholder*="mm/yy" i]',
      'input[autocomplete="cc-exp"]'
    ],
    card_name: [
      'input[name="cardholderName"]',
      'input[name="cardholder"]',
      'input[name="nameOnCard"]',
      'input[id*="cardholderName"]',
      'input[id*="cardholder"]',
      'input[placeholder*="name on card" i]',
      'input[placeholder*="cardholder" i]',
      'input[autocomplete="cc-name"]'
    ]
  };

  // Set value with proper event triggering
  function setValue(element, value) {
    if (!element || !value) return false;

    // Focus the element
    element.focus();

    // For select elements
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

    // For input elements - clear first
    element.value = '';

    // Set the value
    element.value = value;

    // Trigger all necessary events for React/Angular/Vue forms
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    // For React specifically
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));

    return true;
  }

  // Find and fill a field
  function fillField(fieldName, value) {
    if (!value) return false;

    const selectors = FIELD_MAPPINGS[fieldName];
    if (!selectors) return false;

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) { // Check if visible
        console.log(`[FIFA Autofill] Filling ${fieldName}:`, selector);
        setValue(element, value);
        return true;
      }
    }

    console.log(`[FIFA Autofill] Field ${fieldName} not found on page`);
    return false;
  }

  // Main autofill function
  async function autofillForm(account) {
    if (!account) {
      showNotification('No account selected! Open extension popup first.', true);
      return;
    }

    console.log('[FIFA Autofill] Starting autofill with account:', account.email);

    let filledCount = 0;

    // Fill all fields from account data
    for (const [fieldName, value] of Object.entries(account)) {
      if (value && FIELD_MAPPINGS[fieldName]) {
        if (fillField(fieldName, value)) {
          filledCount++;
        }
      }
    }

    if (filledCount > 0) {
      showNotification(`Filled ${filledCount} fields for ${account.email}`);
    } else {
      showNotification('No matching fields found on this page', true);
    }
  }

  // Show notification
  function showNotification(message, isError = false) {
    const existing = document.getElementById('fifa-autofill-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'fifa-autofill-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? '#8b0000' : '#1a472a'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 4000);
  }

  // Get selected account from storage and autofill
  function triggerAutofill() {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    browserAPI.storage.local.get(['accounts', 'selectedRow']).then((result) => {
      const accounts = result.accounts || [];
      const selectedRow = result.selectedRow || 0;
      const account = accounts[selectedRow];

      if (account) {
        autofillForm(account);
      } else {
        showNotification('No account data! Load CSV in extension popup first.', true);
      }
    }).catch((err) => {
      console.error('[FIFA Autofill] Error:', err);
      showNotification('Error loading account data', true);
    });
  }

  // Listen for Alt+A hotkey
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      console.log('[FIFA Autofill] Alt+A pressed, triggering autofill...');
      triggerAutofill();
    }
  });

  // Listen for messages from popup/background
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  if (browserAPI && browserAPI.runtime) {
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'autofill') {
        autofillForm(message.account);
        sendResponse({ status: 'done' });
      }
      return true;
    });
  }

  console.log('[FIFA Autofill] Extension loaded. Press Alt+A to autofill forms.');

})();
