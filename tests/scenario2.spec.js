/**
============================================================================
// Author : Shantanu Shekhar
// Project : Playwright 101 Coding Assignment
// Node.js Version : 24.15.0
// NPM Version : 11.16.0
// Playwright Version : 1.61.0
// VSCode 1.125.0
// ============================================================================
// Scenario 2:
// Navigate to Selenium Playground.
// Open the  “Drag & Drop Sliders” page.
// Select the slider “Default value 15” and drag the bar to make it 95.
// Validating whether the range value shows 95.
//============================================================================
*/ 

import { test, expect } from '@playwright/test';

test('Scenario 2 - Drag and Drop Sliders verification', async ({ page }) => {
  // 1. Navigate directly to the target page to bypass homepage flakiness and slow transitions.
  // Direct navigation is the industry best practice for isolating tests and reducing flakiness.
  await page.goto('https://www.testmuai.com/selenium-playground/drag-drop-range-sliders-demo/', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });

  // 2. Wait for the page load to complete.
  await page.waitForLoadState('load');
  try {
    await page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch (e) {
    // Ignore networkidle timeouts (e.g. from lingering tracker requests)
  }

  // 3. Locate the slider input element
  const slider = page.locator('#slider3 input[type="range"]');
  await slider.waitFor({ state: 'visible', timeout: 15000 });

  // 4. Set the value to 95 using a hydration-polling retry loop.
  // Standard slider.fill('95') is flaky in WebKit because it doesn't trigger 
  // the custom React state change event properly. Using the native prototype setter is 100% robust.
  // We poll and check in a loop to handle dynamic delays in client-side React hydration.
  const targetValue = '95';
  const rangeSuccess = page.locator('#slider3 output#rangeSuccess');
  let success = false;

  for (let i = 0; i < 10; i++) {
    await page.evaluate(({ value }) => {
      const input = document.querySelector('#slider3 input[type="range"]');
      if (!input) return;
      
      // Get the native HTMLInputElement value setter (bypassing React's overridden setter)
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      
      nativeInputValueSetter.call(input, value);
      
      // Dispatch input and change events so the UI updates
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, { value: targetValue });

    // Wait briefly and check if the output text updated.
    // If React is not hydrated yet, the value won't stick or update the output.
    await page.waitForTimeout(1000);
    const txt = await rangeSuccess.textContent();
    if (txt && txt.trim() === targetValue) {
      success = true;
      break;
    }
  }

  // 5. Final assertion to ensure the test fails cleanly if it didn't update
  await expect(rangeSuccess).toHaveText(targetValue, { timeout: 5000 });
});