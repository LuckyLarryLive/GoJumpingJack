import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Go Jumping Jack/);
    
    // Check for main navigation elements
    await expect(page.locator('header')).toBeVisible();
    
    // Check for search section
    await expect(page.locator('#search')).toBeVisible();
    
    // Check for trending destinations section
    await expect(page.locator('#trending')).toBeVisible();
  });

  test('should have working search form', async ({ page }) => {
    await page.goto('/');
    
    // Check if search form elements are present
    await expect(page.locator('input[placeholder*="City or airport"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check if search button contains expected text
    await expect(page.locator('button[type="submit"]')).toContainText('Search Flights');
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check for login/signup links
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });

  test('should display trending destinations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for trending destinations section to load
    await expect(page.locator('#trending')).toBeVisible();
    
    // Check if the section has a title
    await expect(page.locator('h2')).toContainText('Trending Destinations');
    
    // Check if there are destination cards
    const destinationCards = page.locator('#trending .bg-white');
    await expect(destinationCards.first()).toBeVisible();
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');
    
    // Check if footer is present
    await expect(page.locator('footer')).toBeVisible();
    
    // Check for common footer links
    await expect(page.locator('a[href="/about"]')).toBeVisible();
    await expect(page.locator('a[href="/contact"]')).toBeVisible();
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
  });

  test('should handle health check endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('timestamp');
    expect(healthData).toHaveProperty('checks');
  });
});
