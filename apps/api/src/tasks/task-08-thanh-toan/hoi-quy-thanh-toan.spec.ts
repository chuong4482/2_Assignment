import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { OrderController } from '../task-06-don-hang/don-hang.controller';
import { executeOrderCreationCore } from '../task-06-don-hang/tao-don-hang.service';
import { expireOverdueOrders } from '../task-06-don-hang/het-han-don-hang.service';
import * as refs from '../task-06-don-hang/ma-don-hang';
import * as inventory from '../task-10-ton-kho/khoi-tao-ton-kho';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import * as gateway from './cong-vnpay.service';
import { VnpayController } from './cong-vnpay.controller';
import { settleSuccessfulPaymentAndLoyalty } from './thanh-toan.service';
import { cancelOrderWithRefund } from '../task-06-don-hang/huy-don-hang.service';
import { processVnpayCallbackTransaction } from './tro-giup-giao-dich-vnpay';

describe('payment correctness regressions', () => {
  afterEach(() => jest.restoreAllMocks());

  it('creates a new immutable order when the customer has an outstanding payment URL', async () => {
    jest.spyOn(inventory, 'getInventoryService').mockReturnValue({ checkFulfillable: async () => {} } as any);
    const prior = { id: 'outstanding', total: 45000, pointsUsed: 0, status: 'PENDING' };
    const tx: any = {
      product: { findUnique: async () => ({ id: 'coffee', name: 'Coffee', price: 40000, active: true }) },
      order: {
        findFirst: async () => prior,
        update: async ({ data }: any) => Object.assign(prior, data),
        create: async ({ data }: any) => ({ id: 'new-order', ...data }),
      },
      orderItem: { deleteMany: async () => {} },
    };
    const result = await executeOrderCreationCore(tx, {
      userId: 'customer', items: [{ productId: 'coffee', size: 'M', qty: 1, toppings: [] }],
    });
    expect(result.id).toBe('new-order');
    expect(prior.total).toBe(45000);
  });

  it('does not retry an order paid between the initial read and update', async () => {
    jest.spyOn(refs, 'findUserOrderByRef').mockResolvedValue({ id: 'order', total: 45000, status: 'PENDING' } as any);
    jest.spyOn(gateway, 'vnpayConfigFromEnv').mockReturnValue({ tmnCode: 'TEST', hashSecret: 'test', returnUrl: 'http://localhost/return' });
    jest.spyOn(prisma.order, 'update').mockResolvedValue({} as any);
    jest.spyOn(prisma.order, 'updateMany').mockResolvedValue({ count: 0 });
    await expect(new OrderController(new JwtService()).retryPayment(
      { user: { sub: 'customer' }, headers: {} }, 'order', { method: 'VNPay' },
    )).rejects.toMatchObject({ status: 409 });
  });

  it.each(['02', undefined])('rejects successful response with transaction status %s', async status => {
    jest.spyOn(gateway, 'vnpayConfigFromEnv').mockReturnValue({ tmnCode: 'TEST', hashSecret: 'test', returnUrl: 'http://localhost/return' });
    const query: Record<string, string> = { vnp_TxnRef: 'order', vnp_Amount: '4500000', vnp_ResponseCode: '00' };
    if (status) query.vnp_TransactionStatus = status;
    query.vnp_SecureHash = gateway.sign(query, 'test');
    let state = 'PENDING';
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({ id: 'order', total: 45000, status: state } as any);
    jest.spyOn(prisma, '$transaction').mockImplementation(async () => { state = 'PAID'; return {} as any; });
    const result = await new VnpayController().vnpayIpn(query);
    expect(state).toBe('PENDING');
    expect(result.RspCode).not.toBe('00');
    const redirect = jest.fn();
    await new VnpayController().vnpayReturn(query, {}, { redirect });
    expect(redirect.mock.calls[0][0]).not.toContain('vnpay=success');
  });

  it('expires failed unpaid orders and refunds reserved points once', async () => {
    const order: any = { id: 'failed', status: 'PAYMENT_FAILED', userId: 'customer', pointsUsed: 100, paymentExpiresAt: new Date(0) };
    let balance = 0;
    const client: any = {
      order: {
        findMany: async ({ where }: any) => {
          const statuses = where.status.in || [where.status];
          return statuses.includes(order.status) ? [{ id: order.id }] : [];
        },
        findUnique: async () => order,
        updateMany: async ({ where, data }: any) => {
          const statuses = where.status.in || [where.status];
          if (!statuses.includes(order.status)) return { count: 0 };
          Object.assign(order, data); return { count: 1 };
        },
        update: async ({ data }: any) => Object.assign(order, data),
      },
      user: { update: async () => { balance += 100; } },
      loyaltyTransaction: { findFirst: async () => null, create: async () => ({}) },
    };
    expect((await expireOverdueOrders(client)).expiredCount).toBe(1);
    expect(order.status).toBe('CANCELLED');
    expect(balance).toBe(100);
    expect((await expireOverdueOrders(client)).expiredCount).toBe(0);
    expect(balance).toBe(100);
  });

  it('rereads a cancelled order before settling a stale zero-total snapshot', async () => {
    const tx: any = {
      $queryRaw: async () => [],
      order: { findUnique: async () => ({ id: 'order', status: 'CANCELLED', total: 0 }) },
    };
    await expect(settleSuccessfulPaymentAndLoyalty(tx, {
      orderId: 'order', existingOrder: { id: 'order', status: 'PENDING', total: 0 },
      inventoryService: { deductForOrder: async () => ({ ok: true }) } as any,
    })).rejects.toMatchObject({ status: 409 });
  });

  it('keeps a cancelled paid VNPay transaction awaiting the actual provider refund', async () => {
    const payment = { id: 'payment', method: 'VNPay', status: 'SUCCESS' };
    const order = { id: 'paid-order', status: 'PAID', payment, total: 0 };
    const tx: any = {
      order: { findUnique: async () => order, updateMany: async () => ({ count: 1 }), update: async () => ({ ...order, status: 'CANCELLED' }) },
      payment: { update: async ({ data }: any) => Object.assign(payment, data) },
    };
    await cancelOrderWithRefund(tx, order.id, undefined, { restoreForOrder: async () => {} } as any);
    expect(payment.status).toBe('REFUND_PENDING');
  });

  it.each(['PENDING', 'PAYMENT_FAILED'])('refunds redeemed points once when a successful callback cannot fulfill %s', async initialStatus => {
    jest.spyOn(inventory, 'getInventoryService').mockReturnValue({
      deductForOrder: async () => ({ ok: false, shortages: [], missingRecipes: [] }),
      restoreForOrder: async () => {},
    } as any);
    let payment: any = null;
    let balance = 0;
    const ledger: any[] = [];
    const order: any = { id: 'unfulfillable', userId: 'customer', status: initialStatus, total: 30000, pointsUsed: 100, items: [] };
    const tx: any = {
      $queryRaw: async () => [],
      order: {
        findUnique: async () => ({ ...order, payment }),
        updateMany: async ({ data }: any) => { Object.assign(order, data); return { count: 1 }; },
        update: async ({ data }: any) => Object.assign(order, data),
      },
      payment: {
        findUnique: async () => payment,
        create: async ({ data }: any) => { payment = { id: 'payment', ...data }; return payment; },
        update: async ({ data }: any) => Object.assign(payment, data),
      },
      user: { update: async () => { balance += 100; } },
      loyaltyTransaction: { findFirst: async () => ledger[0] || null, create: async ({ data }: any) => { ledger.push(data); return data; } },
    };
    const callback = { orderId: order.id, responseCode: '00', transactionRef: 'bank-transaction' };
    expect((await processVnpayCallbackTransaction(tx, callback)).outOfStock).toBe(true);
    await processVnpayCallbackTransaction(tx, callback);
    expect(order.status).toBe('CANCELLED');
    expect(payment.status).toBe('REFUND_PENDING');
    expect(balance).toBe(100);
    expect(ledger).toHaveLength(1);
  });
});
