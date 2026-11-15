const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { request, customer, orderFor } = require('../tro-giup-kiem-thu.cjs');

assert.match(process.env.DATABASE_URL || '', /brewlite_assignment1_test(?:\?|$)/, 'Requires isolated test database');
const db = new PrismaClient();
after(() => db.$disconnect());

test('admin list includes pending, failed and unpaid cancelled orders', async () => {
  const auth = await customer();
  const product = (await request('/products')).find(p => p.available);
  assert.ok(product);
  const orders = await Promise.all([0, 1, 2].map(() => orderFor(auth.accessToken, product)));
  await db.order.update({ where: { id: orders[1].id }, data: { status: 'PAYMENT_FAILED' } });
  await db.order.update({ where: { id: orders[2].id }, data: { status: 'CANCELLED' } });
  const admin = await request('/auth/login', {
    method: 'POST', status: 201,
    body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  const listed = await request('/admin/orders', { token: admin.accessToken });
  for (const [index, status] of ['PENDING', 'PAYMENT_FAILED', 'CANCELLED'].entries()) {
    assert.equal(listed.find(o => o.id === orders[index].id)?.status, status);
  }
  await request('/admin/orders', { token: auth.accessToken, status: 403 });
});
