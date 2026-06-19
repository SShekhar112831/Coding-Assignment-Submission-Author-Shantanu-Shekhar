/**
============================================================================
// Author : Shantanu Shekhar
// Project : Playwright 101 Coding Assignment
// Node.js Version : 24.15.0
// NPM Version : 11.16.0
// Playwright Version : 1.61.0
// VSCode 1.125.0
// ============================================================================
// Scenario 1:
// Navigate to Selenium Playground.
// Open the "Simple Form Demo" page.
// Enter a message in the input field.
// Click the "Get Checked Value" button.

// Validate that the same message is displayed.
============================================================================
*/  

import { test, expect } from '@playwright/test';

test('Scenario 1 - Simple Form Demo verification', async ({ page }) => {
  // Set test timeout to 60 seconds to ensure slow machines or concurrent runs have enough time
  test.setTimeout(60000);

  // 1. Navigate to the main page. Wait only for 'domcontentloaded' to save time.
  await page.goto('https://www.testmuai.com/selenium-playground/', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });

  // 2. Click the 'Simple Form Demo' link.
  const simpleFormLink = page.getByRole('link', { name: 'Simple Form Demo' });
  await simpleFormLink.waitFor({ state: 'visible', timeout: 15000 });
  await simpleFormLink.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await simpleFormLink.click({ force: true });
  
  // Wait for the URL to change to the target page (using domcontentloaded).
  await page.waitForURL('**/simple-form-demo/**', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });

  // 3. Locate the message input box.
  const messageInput = page.locator('input#user-message');
  await messageInput.waitFor({ state: 'visible', timeout: 30000 });

  // 4. Locate the 'Get Checked Value' button.
  const showInputBtn = page.locator('button#showInput');
  await showInputBtn.waitFor({ state: 'visible', timeout: 20000 });

  // 5. Assert that the message paragraph contains the expected text.
  const messageParagraph = page.locator('p#message');
  const textToType = 'Welcome to test MU AI';
  let success = false;

  for (let i = 0; i < 6; i++) {
    try {
      // Re-fill input on each iteration to guarantee it persists after delayed hydration
      await messageInput.fill(textToType);
      await showInputBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await showInputBtn.click({ force: true });
      
      // Use a short timeout for the retry loop
      await expect(messageParagraph).toContainText(textToType, { timeout: 2000 });
      success = true;
      break;
    } catch (e) {
      await page.waitForTimeout(1000);
    }
  }

  // Final fallback assertion for clean failure reporting
  if (!success) {
    await expect(messageParagraph).toContainText(textToType, { timeout: 5000 });
  }
});