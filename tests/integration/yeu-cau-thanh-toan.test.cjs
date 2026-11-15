const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { request, customer, orderFor, base } = require('../tro-giup-kiem-thu.cjs');
assert.match(process.env.DATABASE_URL || '', /brewlite_assignment1_test(?:\?|$)/);
const db = new PrismaClient();
after(() => db.$disconnect());

test('cart can load active, unexpired promotions from the public API', async () => {
  const promotions = await request('/promotions');
  assert.ok(Array.isArray(promotions));
  for (const promotion of promotions) {
    assert.equal(promotion.active, true);
    assert.ok(!promotion.expiresAt || new Date(promotion.expiresAt).getTime() > Date.now());
  }
});

test('POST /payments persists one VNPay intent for concurrent Idempotency-Key replays', async () => {
  const auth = await customer();
  const product = (await request('/products')).find(p => p.available);
  const order = await orderFor(auth.accessToken, product);
  const key = randomUUID();
  const pay = async (orderId, idempotencyKey = key, token = auth.accessToken) => {
    const response = await fetch(base + '/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
      body: JSON.stringify({ orderId, method: 'VNPay' }),
    });
    return { status: response.status, data: await response.json() };
  };
  assert.equal((await pay(order.id, '')).status, 400);
  const results = await Promise.all(Array.from({ length: 6 }, () => pay(order.id)));
  for (const result of results) {
    assert.equal(result.status, 200, JSON.stringify(result.data));
    assert.match(result.data.paymentUrl, /^https:\/\/sandbox\.vnpayment\.vn/);
    assert.equal(result.data.paymentId, results[0].data.paymentId);
    assert.equal(result.data.paymentUrl, results[0].data.paymentUrl);
  }
  assert.equal(await db.payment.count({ where: { orderId: order.id } }), 1);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, 'PENDING');
  const otherOrder = await orderFor(auth.accessToken, product);
  assert.equal((await pay(otherOrder.id)).status, 409);
  const other = await customer();
  assert.equal((await pay(order.id, randomUUID(), other.accessToken)).status, 404);
  assert.equal((await pay(order.id, randomUUID())).status, 409);
});
