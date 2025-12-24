/**
 * FIFA AUTOFILL - Content Script
 * Auto-fills FIFA forms with account data using Alt+A hotkey
 * Chrome/Mimic compatible - Enhanced for payment pages
 */

(function() {
  'use strict';

  // Field mapping: CSV column -> possible input selectors
  const FIELD_MAPPINGS = {
    // Login fields
    email: [
      'input[name="email"]',
      'input[type="email"]',
      'input[id*="email" i]',
      'input#email',
      'input[placeholder*="email" i]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]'
    ],
    password: [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="password" i]',
      'input#password',
      'input[placeholder*="password" i]',
      'input[autocomplete="current-password"]',
      'input[autocomplete="new-password"]'
    ],

    // Personal info fields
    first_name: [
      'input[name="firstName"]',
      'input[name="first_name"]',
      'input[name="firstname"]',
      'input[id*="firstName" i]',
      'input[id*="firstname" i]',
      'input#firstname',
      'input[placeholder*="first name" i]',
      'input[autocomplete="given-name"]'
    ],
    last_name: [
      'input[name="lastName"]',
      'input[name="last_name"]',
      'input[name="lastname"]',
      'input[id*="lastName" i]',
      'input[id*="lastname" i]',
      'input#lastname',
      'input[placeholder*="last name" i]',
      'input[autocomplete="family-name"]'
    ],
    full_name: [
      'input[name="fullName"]',
      'input[name="full_name"]',
      'input[name="name"]',
      'input[id*="fullName" i]',
      'input[placeholder*="full name" i]',
      'input[placeholder*="your name" i]',
      'input[autocomplete="name"]'
    ],

    // Address fields
    address: [
      'input[name="address"]',
      'input[name="address1"]',
      'input[name="address_line_1"]',
      'input[name="street"]',
      'input[name="addressLine1"]',
      'input[id*="address" i]',
      'input#address_line_1',
      'input[placeholder*="address" i]',
      'input[placeholder*="street" i]',
      'input[autocomplete="street-address"]',
      'input[autocomplete="address-line1"]'
    ],
    city: [
      'input[name="city"]',
      'input[name="address_town_standalone"]',
      'input[id*="city" i]',
      'input#address_town_standalone',
      'input[placeholder*="city" i]',
      'input[autocomplete="address-level2"]'
    ],
    zip_code: [
      'input[name="zip"]',
      'input[name="zipCode"]',
      'input[name="zip_code"]',
      'input[name="postalCode"]',
      'input[name="postal_code"]',
      'input[name="address_zipcode_standalone"]',
      'input[id*="zip" i]',
      'input[id*="postal" i]',
      'input#address_zipcode_standalone',
      'input[placeholder*="zip" i]',
      'input[placeholder*="postal" i]',
      'input[autocomplete="postal-code"]'
    ],
    province: [
      'input[name="state"]',
      'input[name="province"]',
      'input[name="region"]',
      'input[id*="state" i]',
      'input[id*="province" i]',
      'input#locality_STATE',
      'select[name="state"]',
      'select[name="province"]',
      'select[id*="state" i]',
      'select[id*="province" i]',
      'select#locality_STATE',
      'input[placeholder*="state" i]',
      'input[placeholder*="province" i]',
      'input[autocomplete="address-level1"]'
    ],
    country: [
      'input[name="country"]',
      'input[id*="country" i]',
      'select[name="country"]',
      'select[id*="country" i]',
      'select#country',
      'input[autocomplete="country-name"]'
    ],
    phone: [
      'input[name="phone"]',
      'input[name="phoneNumber"]',
      'input[name="phone_number"]',
      'input[name="mobile"]',
      'input[name="mobile_number"]',
      'input[type="tel"]',
      'input[id*="phone" i]',
      'input[id*="mobile" i]',
      'input#mobile_number',
      'input[placeholder*="phone" i]',
      'input[autocomplete="tel"]'
    ],

    // Payment fields - expanded for FIFA payment page
    card_number: [
      'input[placeholder="1234 1234 1234 1234"]',
      'input[placeholder*="1234 1234" i]',
      'input[name="cardNumber"]',
      'input[name="card_number"]',
      'input[name="ccnumber"]',
      'input[name="pan"]',
      'input[name="number"]',
      'input[name="cardnumber"]',
      'input[id*="cardNumber" i]',
      'input[id*="card-number" i]',
      'input[id*="card_number" i]',
      'input[id*="cardnumber" i]',
      'input[id*="cc-number" i]',
      'input[id*="encryptedCardNumber" i]',
      'input[placeholder*="card number" i]',
      'input[placeholder*="1234" i]',
      'input[placeholder*="0000" i]',
      'input[autocomplete="cc-number"]',
      'input[data-testid*="card" i]',
      'input[data-fieldtype="encryptedCardNumber"]',
      'input.input-field',
      'input.js-iframe-input'
    ],
    cvc: [
      'input[placeholder="CVV"]',
      'input[placeholder="cvv"]',
      'input[name="cvc"]',
      'input[name="cvv"]',
      'input[name="securityCode"]',
      'input[name="security_code"]',
      'input[name="cid"]',
      'input[name="encryptedSecurityCode"]',
      'input[id*="cvc" i]',
      'input[id*="cvv" i]',
      'input[id*="security" i]',
      'input[id*="encryptedSecurityCode" i]',
      'input[placeholder*="cvc" i]',
      'input[placeholder*="cvv" i]',
      'input[placeholder*="security" i]',
      'input[placeholder*="123" i]',
      'input[autocomplete="cc-csc"]',
      'input[data-fieldtype="encryptedSecurityCode"]'
    ],
    card_expiry: [
      'input[name="expiry"]',
      'input[name="expiryDate"]',
      'input[name="expiration"]',
      'input[name="exp"]',
      'input[name="encryptedExpiryDate"]',
      'input[id*="expir" i]',
      'input[id*="exp-date" i]',
      'input[id*="encryptedExpiryDate" i]',
      'input[placeholder*="expir" i]',
      'input[placeholder*="mm/yy" i]',
      'input[placeholder*="mm / yy" i]',
      'input[placeholder*="MM/YY" i]',
      'input[autocomplete="cc-exp"]',
      'input[data-fieldtype="encryptedExpiryDate"]'
    ],
    card_name: [
      'input[placeholder*="enter your name" i]',
      'input[placeholder*="Please enter your name" i]',
      'input[name="cardholderName"]',
      'input[name="cardholder"]',
      'input[name="nameOnCard"]',
      'input[name="card_holder"]',
      'input[name="holderName"]',
      'input[name="ccname"]',
      'input[id*="cardholderName" i]',
      'input[id*="cardholder" i]',
      'input[id*="holder" i]',
      'input[id*="ccname" i]',
      'input[placeholder*="name on card" i]',
      'input[placeholder*="cardholder" i]',
      'input[placeholder*="card holder" i]',
      'input[placeholder*="your name" i]',
      'input[autocomplete="cc-name"]'
    ]
  };

  // Set value with proper event triggering for React forms
  function setValue(element, value) {
    if (!element || !value) return false;

    // Focus the element
    element.focus();
    element.click();

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

    // Clear the field first
    element.value = '';

    // For React forms - use native setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(element, value);

    // Trigger all necessary events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    return true;
  }

  // Find and fill a field in a document (main or iframe)
  function fillFieldInDocument(doc, fieldName, value) {
    if (!value) return false;

    const selectors = FIELD_MAPPINGS[fieldName];
    if (!selectors) return false;

    // Try all selectors
    for (const selector of selectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        for (const element of elements) {
          // More lenient visibility check - just check if element exists and is not hidden
          const style = window.getComputedStyle(element);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
          if (element && isVisible) {
            console.log(`[FIFA Autofill] Found ${fieldName}:`, selector, element);
            setValue(element, value);
            return true;
          }
        }
      } catch (e) {
        console.log(`[FIFA Autofill] Selector error for ${fieldName}:`, e.message);
      }
    }

    return false;
  }

  // Special function to find FIFA payment fields by label text
  function fillFIFAPaymentFields(account) {
    let filled = 0;

    // Find all visible input fields
    const allInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    console.log('[FIFA Autofill] Found', allInputs.length, 'input fields on page');

    for (const input of allInputs) {
      const placeholder = (input.placeholder || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();

      // Find the label for this input
      let labelText = '';
      if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) labelText = label.textContent.toLowerCase();
      }
      // Also check parent elements for label text
      let parent = input.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        const parentLabel = parent.querySelector('label');
        if (parentLabel) {
          labelText = parentLabel.textContent.toLowerCase();
          break;
        }
        parent = parent.parentElement;
      }

      console.log('[FIFA Autofill] Input:', { placeholder, name, id, labelText, type: input.type });

      // Card Number
      if ((placeholder.includes('1234') || labelText.includes('card number') || name.includes('cardnumber') || id.includes('cardnumber')) && account.card_number) {
        console.log('[FIFA Autofill] Filling card number');
        setValue(input, account.card_number);
        filled++;
        continue;
      }

      // Card Holder / Name on card
      if ((placeholder.includes('enter your name') || placeholder.includes('your name') || labelText.includes('card holder') || labelText.includes('cardholder') || name.includes('holder') || id.includes('holder')) && (account.card_name || account.full_name)) {
        console.log('[FIFA Autofill] Filling card holder');
        setValue(input, account.card_name || account.full_name);
        filled++;
        continue;
      }

      // CVV
      if ((placeholder === 'cvv' || placeholder.includes('cvv') || placeholder.includes('cvc') || labelText.includes('security code') || labelText.includes('cvv') || name.includes('cvv') || name.includes('cvc')) && account.cvc) {
        console.log('[FIFA Autofill] Filling CVV');
        setValue(input, account.cvc);
        filled++;
        continue;
      }
    }

    return filled;
  }

  // Find and fill a field (checks main doc and same-origin iframes)
  function fillField(fieldName, value) {
    if (!value) return false;

    // Try main document first
    if (fillFieldInDocument(document, fieldName, value)) {
      return true;
    }

    // Try to find by label text in main document
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      const labelText = label.textContent.toLowerCase();
      if (labelText.includes(fieldName.replace('_', ' ')) ||
          labelText.includes(fieldName.replace('_', ''))) {
        const forId = label.getAttribute('for');
        if (forId) {
          const input = document.getElementById(forId);
          if (input) {
            console.log(`[FIFA Autofill] Filling ${fieldName} via label:`, forId);
            setValue(input, value);
            return true;
          }
        }
        const input = label.querySelector('input, select');
        if (input) {
          console.log(`[FIFA Autofill] Filling ${fieldName} via label child`);
          setValue(input, value);
          return true;
        }
      }
    }

    // Try same-origin iframes
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && fillFieldInDocument(iframeDoc, fieldName, value)) {
          console.log(`[FIFA Autofill] Filled ${fieldName} in iframe`);
          return true;
        }
      } catch (e) {
        // Cross-origin iframe, can't access
        console.log(`[FIFA Autofill] Cannot access iframe (cross-origin):`, iframe.src);
      }
    }

    console.log(`[FIFA Autofill] Field ${fieldName} not found on page`);
    return false;
  }

  // Handle expiry date split into month/year dropdowns
  function fillExpiryDate(expiry) {
    if (!expiry) return false;

    // expiry format: "10/30" or "10/2030"
    const parts = expiry.split('/');
    if (parts.length !== 2) return false;

    const month = parts[0].trim().padStart(2, '0');
    const monthInt = parseInt(month).toString();
    let year = parts[1].trim();

    // Convert 2-digit year to 4-digit if needed
    if (year.length === 2) {
      year = '20' + year;
    }
    const shortYear = year.slice(-2);

    let filledMonth = false;
    let filledYear = false;

    // Try combined expiry field first (MM/YY format)
    const combinedSelectors = [
      'input[name*="expir" i]',
      'input[id*="expir" i]',
      'input[placeholder*="mm/yy" i]',
      'input[placeholder*="MM/YY" i]',
      'input[autocomplete="cc-exp"]',
      'input[data-fieldtype="encryptedExpiryDate"]'
    ];

    for (const sel of combinedSelectors) {
      const field = document.querySelector(sel);
      if (field && field.tagName === 'INPUT') {
        const expiryFormatted = month + '/' + shortYear;
        setValue(field, expiryFormatted);
        console.log('[FIFA Autofill] Filled combined expiry:', expiryFormatted);
        return true;
      }
    }

    // Find all selects on page and identify month/year by their options or labels
    const allSelects = document.querySelectorAll('select');
    console.log('[FIFA Autofill] Found', allSelects.length, 'select elements for expiry');

    for (const select of allSelects) {
      const options = Array.from(select.options);
      const optTexts = options.map(o => o.textContent.toLowerCase());
      const optValues = options.map(o => o.value);

      // Check if this is a month dropdown (has options like 01-12 or month names)
      const hasMonthOptions = optTexts.some(t => t.includes('month')) ||
                              optValues.includes('01') || optValues.includes('1') ||
                              optTexts.some(t => t.includes('january') || t.includes('jan'));

      // Check if this is a year dropdown (has 4-digit years like 2025, 2026, etc.)
      const hasYearOptions = optTexts.some(t => t.includes('year')) ||
                             optValues.some(v => /^20\d{2}$/.test(v)) ||
                             optTexts.some(t => /20\d{2}/.test(t));

      if (!filledMonth && hasMonthOptions && !hasYearOptions) {
        // This is likely the month dropdown
        for (const opt of options) {
          if (opt.value === month || opt.value === monthInt ||
              opt.textContent.trim() === month || opt.textContent.trim() === monthInt ||
              opt.value.padStart(2, '0') === month) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            filledMonth = true;
            console.log('[FIFA Autofill] Filled expiry month:', month, 'in select:', select.id || select.name || 'unnamed');
            break;
          }
        }
      }

      if (!filledYear && hasYearOptions && !hasMonthOptions) {
        // This is likely the year dropdown
        for (const opt of options) {
          if (opt.value === year || opt.value === shortYear ||
              opt.textContent.includes(year) || opt.textContent.includes(shortYear)) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            filledYear = true;
            console.log('[FIFA Autofill] Filled expiry year:', year, 'in select:', select.id || select.name || 'unnamed');
            break;
          }
        }
      }
    }

    // Fallback: Try specific selectors
    if (!filledMonth) {
      const monthSelectors = [
        'select[id*="month" i]',
        'select[name*="month" i]',
        'select[aria-label*="month" i]'
      ];
      for (const sel of monthSelectors) {
        const monthSelect = document.querySelector(sel);
        if (monthSelect) {
          for (const opt of monthSelect.options) {
            if (opt.value === month || opt.value === monthInt ||
                opt.textContent.includes(month)) {
              monthSelect.value = opt.value;
              monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
              filledMonth = true;
              console.log('[FIFA Autofill] Filled expiry month via selector:', month);
              break;
            }
          }
          if (filledMonth) break;
        }
      }
    }

    if (!filledYear) {
      const yearSelectors = [
        'select[id*="year" i]',
        'select[name*="year" i]',
        'select[aria-label*="year" i]'
      ];
      for (const sel of yearSelectors) {
        const yearSelect = document.querySelector(sel);
        if (yearSelect) {
          for (const opt of yearSelect.options) {
            if (opt.value === year || opt.value === shortYear ||
                opt.textContent.includes(year) || opt.textContent.includes(shortYear)) {
              yearSelect.value = opt.value;
              yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
              filledYear = true;
              console.log('[FIFA Autofill] Filled expiry year via selector:', year);
              break;
            }
          }
          if (filledYear) break;
        }
      }
    }

    return filledMonth || filledYear;
  }

  // Detect if we're on a payment page
  function isPaymentPage() {
    const url = window.location.href.toLowerCase();
    const pageText = document.body?.innerText?.toLowerCase() || '';

    return url.includes('payment') ||
           url.includes('checkout') ||
           url.includes('pay') ||
           pageText.includes('card number') ||
           pageText.includes('credit card') ||
           pageText.includes('payment method') ||
           document.querySelector('input[autocomplete="cc-number"]') !== null;
  }

  // Log all inputs on page for debugging
  function logPageInputs() {
    console.log('[FIFA Autofill] === PAGE INPUT ANALYSIS ===');
    const inputs = document.querySelectorAll('input, select');
    console.log(`[FIFA Autofill] Found ${inputs.length} inputs on main page`);

    inputs.forEach((input, i) => {
      if (input.type !== 'hidden') {
        console.log(`[FIFA Autofill] Input ${i}:`, {
          tag: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          autocomplete: input.autocomplete,
          class: input.className
        });
      }
    });

    // Check iframes
    const iframes = document.querySelectorAll('iframe');
    console.log(`[FIFA Autofill] Found ${iframes.length} iframes`);
    iframes.forEach((iframe, i) => {
      console.log(`[FIFA Autofill] Iframe ${i}:`, iframe.src || iframe.id || 'no-src');
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          const iframeInputs = iframeDoc.querySelectorAll('input');
          console.log(`[FIFA Autofill] Iframe ${i} has ${iframeInputs.length} inputs`);
        }
      } catch(e) {
        console.log(`[FIFA Autofill] Iframe ${i} is cross-origin (cannot access)`);
      }
    });
  }

  // Main autofill function
  async function autofillForm(account) {
    if (!account) {
      showNotification('No account selected! Open extension popup first.', true);
      return;
    }

    console.log('[FIFA Autofill] Starting autofill with account:', account.email);
    console.log('[FIFA Autofill] Account data:', account);

    // Log page structure for debugging
    logPageInputs();

    let filledCount = 0;

    // Fill all fields from account data
    for (const [fieldName, value] of Object.entries(account)) {
      if (value && FIELD_MAPPINGS[fieldName]) {
        if (fillField(fieldName, value)) {
          filledCount++;
        }
      }
    }

    // Special handling for expiry date (month/year dropdowns or combined)
    if (account.card_expiry) {
      if (fillExpiryDate(account.card_expiry)) {
        filledCount++;
      }
    }

    // Use full_name for card_name if card_name wasn't filled
    if (account.full_name && !account.card_name) {
      if (fillField('card_name', account.full_name)) {
        filledCount++;
      }
    }

    // If on payment page and didn't fill card fields, try the special FIFA payment function
    if (isPaymentPage()) {
      console.log('[FIFA Autofill] Payment page detected, trying FIFA-specific payment fill...');
      const paymentFilled = fillFIFAPaymentFields(account);
      filledCount += paymentFilled;
    }

    if (filledCount > 0) {
      showNotification(`Filled ${filledCount} fields for ${account.email}`);
    } else {
      showNotification('No matching fields found on this page. Check console (F12) for details.', true);
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
      max-width: 350px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  // Get selected account from storage and autofill
  function triggerAutofill() {
    chrome.storage.local.get(['accounts', 'selectedRow'], (result) => {
      const accounts = result.accounts || [];
      const selectedRow = result.selectedRow || 0;
      const account = accounts[selectedRow];

      if (account) {
        autofillForm(account);
      } else {
        showNotification('No account data! Load CSV in extension popup first.', true);
      }
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
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'autofill') {
      autofillForm(message.account);
      sendResponse({ status: 'done' });
    }
    return true;
  });

  console.log('[FIFA Autofill] Extension loaded. Press Alt+A to autofill forms.');

})();
