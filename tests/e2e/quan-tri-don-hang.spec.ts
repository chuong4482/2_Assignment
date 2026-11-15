import { test, expect } from '@playwright/test';

const states = ['PENDING', 'PAYMENT_FAILED', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
const orders = states.map((status, i) => ({
  id: `audit-order-${i}`, code: `BLTEST${i}`, status, total: 50000,
  createdAt: '2026-11-16T09:00:00.000Z',
  user: { email: 'audit@example.test', fullName: 'Kiểm thử quản trị' },
  payment: { method: 'VNPay', status: status === 'CANCELLED' ? 'REFUND_PENDING' : 'PENDING' },
  items: [{ productName: 'Cà phê', size: 'M', qty: 1, unitPrice: 50000 }],
}));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('brewlite_admin_token', 'isolated-ui-test-token');
  });
  await page.route(/^http:\/\/localhost:(4000|4100)\//, async route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'PATCH' && url.pathname.includes('/orders/')) {
      await route.abort('failed');
      return;
    }
    const data = url.pathname === '/auth/profile' ? { role: 'ADMIN', email: 'audit@example.test' }
      : url.pathname === '/admin/orders' ? orders
      : url.pathname.includes('/settings') ? {}
      : [];
    await route.fulfill({ json: data });
  });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Đơn hàng', exact: true }).click();
});

test('shows all order states with accurate payment and pickup labels', async ({ page }) => {
  const table = page.locator('.tab-orders tbody');
  await expect(table.locator('tr')).toHaveCount(7);
  await expect(table.getByText('Thanh toán thất bại', { exact: true })).toBeVisible();
  await expect(table.getByText('Sẵn sàng nhận', { exact: true })).toBeVisible();
  await expect(table.getByText('Đã hủy · Chờ hoàn tiền', { exact: true })).toBeVisible();
  await expect(table.getByRole('button', { name: /Xác nhận đã trả/ })).toHaveCount(0);
});

test('shows an empty message for a filter without matching orders', async ({ page }) => {
  await page.route('**/admin/orders', route => route.fulfill({ json: orders.filter(o => o.status === 'PAID') }));
  await page.reload();
  await page.getByRole('button', { name: 'Hoàn tất', exact: true }).click();
  await expect(page.locator('.tab-orders tbody')).toContainText('Không có đơn hàng phù hợp');
});

test('failed status update never shows local success', async ({ page }) => {
  const row = page.locator('tbody tr').filter({ hasText: '#BLTEST2' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Bắt đầu pha' }).click();
  await expect(page.getByText('Không thể kết nối máy chủ. Trạng thái đơn hàng chưa được cập nhật.', { exact: false })).toBeVisible();
  await expect(row.locator('.badge')).toHaveText('Đã thanh toán');
});

test('mobile admin fits the screen without the order diagram', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('tbody tr')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByText('Sơ đồ trạng thái đơn hàng', { exact: true })).toHaveCount(0);
});

test('cancel action is available only before preparation', async ({ page }) => {
  await expect(page.locator('tbody tr')).toHaveCount(7);
  for (const [i, status] of states.entries()) {
    const button = page.locator('tbody tr').filter({ hasText: `#BLTEST${i}` }).getByRole('button', { name: 'Hủy đơn', exact: true });
    await expect(button).toHaveCount(['PENDING', 'PAYMENT_FAILED', 'PAID'].includes(status) ? 1 : 0);
  }
});

test('cancellation requires confirmation and shows refund pending from server', async ({ page }) => {
  const row = page.locator('tbody tr').filter({ hasText: '#BLTEST2' });
  await expect(row).toBeVisible();
  let cancellations = 0;
  let cancelled = false;
  await page.route('**/admin/orders**', async route => {
    if (route.request().method() === 'PATCH') {
      expect(route.request().postDataJSON()).toEqual({ status: 'CANCELLED' });
      cancellations++;
      cancelled = true;
      await route.fulfill({ json: { status: 'CANCELLED', payment: { status: 'REFUND_PENDING' } } });
      return;
    }
    await route.fulfill({ json: orders.map(o => o.id === 'audit-order-2' && cancelled ? { ...o, status: 'CANCELLED', payment: { ...o.payment, status: 'REFUND_PENDING' } } : o) });
  });
  page.once('dialog', dialog => dialog.dismiss());
  await row.getByRole('button', { name: 'Hủy đơn', exact: true }).click();
  expect(cancellations).toBe(0);
  await expect(row.locator('.badge')).toHaveText('Đã thanh toán');
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('hoàn tiền');
    await dialog.accept();
  });
  await row.getByRole('button', { name: 'Hủy đơn', exact: true }).click();
  await expect(row.locator('.badge')).toHaveText('Đã hủy · Chờ hoàn tiền');
  expect(cancellations).toBe(1);
  await expect(row.getByRole('button', { name: 'Hủy đơn', exact: true })).toHaveCount(0);
});
