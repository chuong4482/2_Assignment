import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { OrderController } from '../task-06-don-hang/don-hang.controller';
import * as orderRefs from '../task-06-don-hang/ma-don-hang';
import * as gateway from './cong-vnpay.service';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';

describe('VNPay retry validation', () => {
  afterEach(() => jest.restoreAllMocks());
  it('reports missing merchant config as 400 without changing the pending order', async () => {
    jest.spyOn(orderRefs, 'findUserOrderByRef').mockResolvedValue({ id: 'test-order', total: 45000, status: 'PENDING', payment: null } as any);
    jest.spyOn(gateway, 'vnpayConfigFromEnv').mockReturnValue({ tmnCode: '', hashSecret: '', returnUrl: 'http://localhost/return' });
    const update = jest.spyOn(prisma.order, 'update').mockResolvedValue({} as any);
    const controller = new OrderController(new JwtService());
    await expect(controller.retryPayment({ user: { sub: 'test-user' }, headers: {} }, 'test-order', { method: 'VNPay' })).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });
});
