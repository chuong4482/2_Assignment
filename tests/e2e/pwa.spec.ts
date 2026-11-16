import { test, expect } from '@playwright/test';

test('PWA exposes install metadata and a safe offline navigation fallback', async ({ page, context, request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((icon: {sizes: string}) => icon.sizes === '192x192')).toBe(true);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15000 }).toBe(true);
  await context.setOffline(true);
  await page.goto('/orders');
  await expect(page.getByRole('heading', {name: 'Bạn đang ngoại tuyến'})).toBeVisible();
  await expect(page.getByRole('link', {name: 'Thử kết nối lại'})).toBeVisible();
  await context.setOffline(false);
});
