import { BadRequestException, Body, ConflictException, Controller, Headers, HttpCode, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { TokenGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { buildVnpayUrl, isVnpayConfigured, vnpayConfigFromEnv } from './cong-vnpay.service';
import { settleSuccessfulPaymentAndLoyalty } from './thanh-toan.service';

class PaymentIntentDto {
  @IsString() orderId: string;
  @IsOptional() @IsIn(['VNPay']) method?: string;
}

@Controller('payments')
export class PaymentIntentController {
  @Post()
  @HttpCode(200)
  @UseGuards(TokenGuard)
  async create(@Req() req: any, @Body() dto: PaymentIntentDto, @Headers('idempotency-key') key?: string) {
    if (!key || key.length > 120 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
      throw new BadRequestException('Idempotency-Key is required (1..120 letters, digits, . _ : -)');
    }
    const userId = req.user.sub || req.user.id;
    const config = vnpayConfigFromEnv();
    try {
      return await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${dto.orderId} FOR UPDATE`;
        let order = await tx.order.findFirst({
          where: { id: dto.orderId, userId }, include: { payment: true, items: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        const previous = await tx.payment.findUnique({ where: { idempotencyKey: key } });
        if ((previous && previous.orderId !== order.id) || (order.payment && order.payment.idempotencyKey !== key)) {
          throw new ConflictException('Idempotency-Key belongs to another payment intent');
        }
        if (previous?.status === 'SUCCESS') {
          return { orderId: order.id, paymentId: previous.id, status: previous.status, paymentUrl: null };
        }
        if (order.status !== 'PENDING') throw new ConflictException('Order is not pending payment; use retry-payment if payment failed');
        if (order.paymentExpiresAt && order.paymentExpiresAt.getTime() <= Date.now()) {
          throw new ConflictException('Payment intent has expired');
        }
        if (order.total > 0 && !isVnpayConfigured(config)) throw new BadRequestException('VNPay is not configured');
        const payment = previous || await tx.payment.create({ data: {
          orderId: order.id, idempotencyKey: key, amount: order.total,
          method: 'VNPay', provider: 'VNPAY', status: 'PENDING',
        } });
        if (order.total === 0) {
          const settled = await settleSuccessfulPaymentAndLoyalty(tx, {
            orderId: order.id, method: 'VNPay', amount: 0, provider: 'VNPAY',
            transactionRef: `ZERO-${payment.id}`, responseCode: '00',
          });
          return { orderId: order.id, paymentId: payment.id, status: settled.payment.status, paymentUrl: null };
        }
        // Replays use the original timestamp: same intent and signed URL, no new charge.
        const paymentUrl = buildVnpayUrl({
          order: { id: order.id, totalAmount: order.total }, config,
          clientIp: req.socket?.remoteAddress || '127.0.0.1', now: payment.createdAt,
        });
        return { orderId: order.id, paymentId: payment.id, status: payment.status, paymentUrl };
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('Idempotency-Key belongs to another payment intent');
      throw error;
    }
  }
}
