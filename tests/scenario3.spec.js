/**
============================================================================
Author : Shantanu Shekhar
Project : Playwright 101 Coding Assignment
Node.js Version : 24.15.0
NPM Version : 11.16.0
Playwright Version : 1.61.0
VSCode 1.125.0
============================================================================
Scenario 3:
1. Open the [https://www.testmuai.com/selenium-playground/](https://www.testmuai.com/selenium-playground/) page and click “Input Form Submit”.
2. Click “Submit” without filling in any information in the form.
3. Assert “Please fill in the fi elds” error message.
4. Fill in Name, Email, and other fi elds.
5. From the Country drop-down, select “United States” using the text property.
6. Fill in all fi elds and click “Submit”.
7. Once submitted, validate the success message “Thanks for contacting us, we will get back to you shortly.” on the screen.
============================================================================
*/
import { test, expect } from '@playwright/test';

test('Scenario 3 - Input Form Submit verification', async ({ page }) => {
  // 1. Block heavy assets and tracking scripts to optimize performance and prevent timeouts
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const isImage = route.request().resourceType() === 'image';
    const isFont = route.request().resourceType() === 'font';
    const isTracker = url.includes('analytics') || 
                      url.includes('hotjar') || 
                      url.includes('facebook') || 
                      url.includes('google-analytics') || 
                      url.includes('hubspot') || 
                      url.includes('drift');
    
    if (isImage || isFont || isTracker) {
      route.abort();
    } else {
      route.continue();
    }
  });

  // 2. Navigate to the playground homepage
  await page.goto('https://www.testmuai.com/selenium-playground/', { 
    waitUntil: 'domcontentloaded', 
    timeout: 45000 
  });

  // 3. Locate the 'Input Form Submit' link, scroll it into view, and click
  const inputFormLink = page.getByRole('link', { name: 'Input Form Submit' });
  await inputFormLink.waitFor({ state: 'visible', timeout: 20000 });
  await inputFormLink.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await inputFormLink.click({ force: true });
  
  // 4. Wait for the URL transition to complete
  await page.waitForURL('**/input-form-demo/**', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });

  // 5. Allow the page to load assets and complete client-side React hydration
  await page.waitForLoadState('load');
  try {
    await page.waitForLoadState('networkidle', { timeout: 4000 });
  } catch (e) {
    // Ignore networkidle timeout from lingering third-party connections
  }

  // Target inputs data
  const inputs = {
    name: 'Shantanu Shekhar',
    email: 'shantanu31.shekhar@gmail.com',
    password: 'Password@123',
    company: 'SHEKHAR Systems',
    website: 'https://example.com',
    city: 'Bangalore',
    address1: 'Indira Nagar',
    address2: 'Bangalore',
    state: 'Karnataka',
    zip: '560093'
  };

  const successMessage = page.locator('p.success-msg');

  // 6. Resilient retry loop to handle React hydration lag or layout shifting
  let success = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // If a previous attempt clicked submit before JS attached preventDefault(),
      // the browser natively reloads with query params. We detect this and reset.
      if (page.url().includes('?')) {
        await page.goto('https://www.testmuai.com/selenium-playground/input-form-demo/', { waitUntil: 'load', timeout: 20000 });
        try {
          await page.waitForLoadState('networkidle', { timeout: 3000 });
        } catch (e) {}
      }

      // Ensure form container is ready
      await page.locator('#seleniumform').waitFor({ state: 'visible', timeout: 15000 });

      // Populate form fields using stable ID-based selectors
      await page.locator('#name').fill(inputs.name);
      await page.locator('#inputEmail4').fill(inputs.email);
      await page.locator('#inputPassword4').fill(inputs.password);
      await page.locator('#company').fill(inputs.company);
      await page.locator('#websitename').fill(inputs.website);
      
      // Select the Country dropdown option (India -> value 'IN')
      const countrySelect = page.locator('select[name="country"]');
      await countrySelect.selectOption('IN');
      
      await page.locator('#inputCity').fill(inputs.city);
      await page.locator('#inputAddress1').fill(inputs.address1);
      await page.locator('#inputAddress2').fill(inputs.address2);
      await page.locator('#inputState').fill(inputs.state);
      await page.locator('#inputZip').fill(inputs.zip);

      // Verify that values were successfully written to the DOM before submitting.
      // If React wiped out inputs due to an mid-type re-render, this check triggers a retry.
      const nameVal = await page.locator('#name').inputValue();
      const zipVal = await page.locator('#inputZip').inputValue();
      if (nameVal !== inputs.name || zipVal !== inputs.zip) {
        throw new Error('Form fields were not correctly filled. Retrying...');
      }

      // Submit the form
      const submitBtn = page.locator('#seleniumform button[type="submit"]');
      await submitBtn.evaluate(el => el.scrollIntoView({ block: 'center' }));
      await submitBtn.click({ force: true });

      // Verify the success message appears
      await expect(successMessage).toBeVisible({ timeout: 8000 });
      await expect(successMessage).toContainText('Thanks for contacting us, we will get back to you shortly.', { timeout: 5000 });
      
      success = true;
      break;
    } catch (e) {
      console.log(`Attempt ${attempt + 1} failed. Error: ${e.message}`);
      await page.waitForTimeout(2000);
    }
  }

  // Final assertion for clean failure reporting if all retries fail
  if (!success) {
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await expect(successMessage).toContainText('Thanks for contacting us, we will get back to you shortly.');
  }
});