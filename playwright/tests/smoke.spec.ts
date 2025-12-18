import { test, expect } from '@playwright/test';

test('Meet loads locally', async ({ page }) => {
  await page.goto('https://meet.internxt.com/');
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
});
