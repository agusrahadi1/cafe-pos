import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Payment, PaymentStatus, PaymentMethod, OrderStatus, ShiftStatus, Prisma, BalanceMutationType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CoreApi, Snap } from 'midtrans-client';
import { BorderPayService } from './borderpay.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private midtransCore: CoreApi;
  private midtransSnap: Snap;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private borderPayService: BorderPayService,
  ) {
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY') || '';
    const clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY') || '';
    const isProduction = this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';

    this.midtransCore = new CoreApi({
      isProduction,
      serverKey,
      clientKey,
    });

    this.midtransSnap = new Snap({
      isProduction,
      serverKey,
      clientKey,
    });
  }

  async generatePaymentNumber(outletId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastPayment = await this.prisma.payment.findFirst({
      where: { outletId },
      orderBy: { createdAt: 'desc' },
      select: { paymentNumber: true },
    });

    let sequence = 1;
    if (lastPayment) {
      const lastSeq = parseInt(lastPayment.paymentNumber.slice(-4), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `PAY${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  async createPaymentForOrder(
    orderId: string,
    outletId: string,
    method: PaymentMethod,
    amount: Prisma.Decimal | number,
    idempotencyKey: string,
  ): Promise<Payment> {
    // Check idempotency
    const existingPayment = await this.prisma.payment.findFirst({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const paymentNumber = await this.generatePaymentNumber(outletId);

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        outletId,
        paymentNumber,
        method,
        amount: new Prisma.Decimal(amount),
        status: PaymentStatus.PENDING_PAYMENT,
        provider: method === PaymentMethod.MIDTRANS || method === PaymentMethod.QRIS ? 'midtrans' : 'manual',
        idempotencyKey,
      },
    });

    return payment;
  }

  async processMidtransPayment(paymentId: string, clientOrigin?: string): Promise<{ token: string; redirectUrl: string }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true, outlet: true, table: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Jika pembayaran sudah berstatus PAID (sudah lunas)
    if (payment.status === PaymentStatus.PAID) {
      throw new ConflictException('Pesanan ini sudah dibayar lunas');
    }

    // Idempotent reuse: Jika pembayaran sudah berstatus PROCESSING dan sudah memiliki data Midtrans token/redirectUrl
    if (payment.status === PaymentStatus.PROCESSING && payment.providerPayload) {
      const payload = payment.providerPayload as any;
      if (payload && (payload.token || payload.redirectUrl || payload.redirect_url)) {
        return {
          token: payload.token || '',
          redirectUrl: payload.redirectUrl || payload.redirect_url || '',
        };
      }
    }

    const order = payment.order;
    const grossAmount = Math.round(Number(payment.amount));

    const itemDetails: any[] = order.items.map((item) => ({
      id: String(item.productId || item.id).slice(0, 50),
      price: Math.round(Number(item.totalPrice || Number(item.unitPrice) * item.quantity) / (item.quantity || 1)),
      quantity: item.quantity,
      name: String(item.productName + (item.variantName ? ` - ${item.variantName}` : '')).slice(0, 50),
    }));

    if (order.taxAmount && Number(order.taxAmount) > 0) {
      itemDetails.push({
        id: 'TAX',
        price: Math.round(Number(order.taxAmount)),
        quantity: 1,
        name: 'Pajak Restoran',
      });
    }

    if (order.serviceChargeAmount && Number(order.serviceChargeAmount) > 0) {
      itemDetails.push({
        id: 'SERVICE_CHARGE',
        price: Math.round(Number(order.serviceChargeAmount)),
        quantity: 1,
        name: 'Biaya Layanan',
      });
    }

    if (order.discountAmount && Number(order.discountAmount) > 0) {
      itemDetails.push({
        id: 'DISCOUNT',
        price: -Math.round(Number(order.discountAmount)),
        quantity: 1,
        name: 'Diskon Promo',
      });
    }

    const itemsSum = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalItemDetails = itemsSum === grossAmount ? itemDetails : undefined;

    let frontendBase = clientOrigin;
    if (!frontendBase || frontendBase.includes('localhost') || frontendBase.includes('127.0.0.1')) {
      const configBase = this.configService.get('FRONTEND_URL');
      if (configBase && !configBase.includes('localhost') && !configBase.includes('127.0.0.1')) {
        frontendBase = configBase;
      } else {
        frontendBase = 'https://cafe.abstech.web.id';
      }
    }

    const tableToken = (order.table as any)?.qrToken || (order.table as any)?.token;
    const tokenQuery = tableToken ? `?token=${encodeURIComponent(tableToken)}` : '';
    const statusUrl = `${frontendBase}/order/status/${payment.orderId}${tokenQuery}`;

    const snapRequest: any = {
      transaction_details: {
        order_id: payment.paymentNumber,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: order.customerName || 'Customer',
        phone: order.customerPhone || undefined,
        email: order.customerPhone ? `${order.customerPhone}@cafe.local` : undefined,
      },
      callbacks: {
        finish: statusUrl,
        error: statusUrl,
        pending: statusUrl,
      },
    };

    if (finalItemDetails && finalItemDetails.length > 0) {
      snapRequest.item_details = finalItemDetails;
    }

    const snapResponse = await this.midtransSnap.createTransaction(snapRequest);

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerReference: payment.paymentNumber,
        providerPayload: snapResponse as any,
        status: PaymentStatus.PROCESSING,
      },
    });

    return {
      token: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    };
  }

  async processQrisPayment(paymentId: string): Promise<{ qrString: string; qrImageUrl: string }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { items: true, outlet: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Jika pembayaran sudah berstatus PAID (sudah lunas)
    if (payment.status === PaymentStatus.PAID) {
      throw new ConflictException('Pesanan ini sudah dibayar lunas');
    }

    // Idempotent reuse: Jika pembayaran sudah berstatus PROCESSING dan sudah memiliki data QRIS Midtrans
    if (payment.status === PaymentStatus.PROCESSING && payment.providerPayload) {
      const payload = payment.providerPayload as any;
      if (payload && (payload.qrString || payload.qr_string)) {
        return {
          qrString: payload.qrString || payload.qr_string || '',
          qrImageUrl: payload.qrImageUrl || payload.qr_image_url || '',
        };
      }
    }

    const order = payment.order;
    const itemDetails = order.items.map((item) => ({
      id: item.productId,
      price: Number(item.unitPrice),
      quantity: item.quantity,
      name: item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
    }));

    const coreRequest = {
      payment_type: 'qris',
      transaction_details: {
        order_id: payment.paymentNumber,
        gross_amount: Number(payment.amount),
      },
      item_details: itemDetails,
      customer_details: {
        first_name: order.customerName || 'Customer',
        phone: order.customerPhone,
      },
    };

    const coreResponse = await this.midtransCore.charge(coreRequest);

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerReference: coreResponse.transaction_id,
        providerPayload: coreResponse as any,
        status: PaymentStatus.PROCESSING,
      },
    });

    return {
      qrString: coreResponse.qr_string,
      qrImageUrl: coreResponse.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(coreResponse.qr_string)}&size=200x200`,
    };
  }

  async handleMidtransNotification(notification: any): Promise<Payment> {
    const { order_id, transaction_status, fraud_status, transaction_id, payment_type, gross_amount } = notification;

    if (order_id && typeof order_id === 'string' && order_id.startsWith('SUB-')) {
      const isPaid =
        (transaction_status === 'capture' && fraud_status === 'accept') ||
        transaction_status === 'settlement';

      if (isPaid) {
        const parts = order_id.split('-');
        const tenantSlug = parts[1];
        const company = await this.prisma.company.findFirst({
          where: { slug: { startsWith: tenantSlug } },
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        });

        if (company) {
          const now = new Date();
          let baseDate = now;
          const activeSub = company.subscriptions[0];
          if (activeSub && new Date(activeSub.endDate) > now) {
            baseDate = new Date(activeSub.endDate);
          }
          const endDate = new Date(baseDate);
          endDate.setMonth(endDate.getMonth() + 1);

          await this.prisma.tenantSubscription.updateMany({
            where: { tenantId: company.id, status: 'ACTIVE' },
            data: { status: 'EXPIRED' },
          });

          const planId = activeSub?.planId || (await this.prisma.subscriptionPlan.findFirst())?.id;
          if (planId) {
            await this.prisma.tenantSubscription.create({
              data: {
                tenantId: company.id,
                planId,
                startDate: now,
                endDate,
                status: 'ACTIVE',
                autoRenew: true,
                notes: `Webhook Midtrans settlement (${order_id})`,
              },
            });

            await this.prisma.company.update({
              where: { id: company.id },
              data: { status: 'ACTIVE' },
            });
          }
        }
      }

      return { status: 'SUCCESS', order_id, transaction_status } as any;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { paymentNumber: order_id },
      include: { order: true },
    });

    if (!payment) {
      console.log(`[Midtrans Webhook] Received notification for unknown or test order_id: ${order_id}`);
      return { status: 'OK', message: 'Test notification received successfully', order_id } as any;
    }

    // Idempotency check
    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    let newStatus: PaymentStatus;
    let orderStatus: OrderStatus | null = null;

    switch (transaction_status) {
      case 'capture':
        if (payment_type === 'credit_card') {
          newStatus = fraud_status === 'challenge' ? PaymentStatus.PROCESSING : PaymentStatus.PAID;
          if (newStatus === PaymentStatus.PAID) orderStatus = OrderStatus.PAID;
        } else {
          newStatus = PaymentStatus.PAID;
          orderStatus = OrderStatus.PAID;
        }
        break;
      case 'settlement':
        newStatus = PaymentStatus.PAID;
        orderStatus = OrderStatus.PAID;
        break;
      case 'pending':
        newStatus = PaymentStatus.PENDING_PAYMENT;
        break;
      case 'deny':
        newStatus = PaymentStatus.FAILED;
        orderStatus = OrderStatus.PAYMENT_FAILED;
        break;
      case 'expire':
        newStatus = PaymentStatus.EXPIRED;
        orderStatus = OrderStatus.EXPIRED;
        break;
      case 'cancel':
        newStatus = PaymentStatus.FAILED;
        orderStatus = OrderStatus.PAYMENT_FAILED;
        break;
      default:
        newStatus = PaymentStatus.FAILED;
        orderStatus = OrderStatus.PAYMENT_FAILED;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          providerReference: transaction_id,
          providerPayload: notification as any,
          paidAt: newStatus === PaymentStatus.PAID ? new Date() : null,
          failedAt: (newStatus === PaymentStatus.FAILED || newStatus === PaymentStatus.EXPIRED) ? new Date() : null,
          failureReason: (newStatus === PaymentStatus.FAILED || newStatus === PaymentStatus.EXPIRED) ? transaction_status : null,
        },
      });

      // Update order status and paidAmount if needed
      if (orderStatus && payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: orderStatus,
            ...(newStatus === PaymentStatus.PAID ? { paidAmount: payment.amount } : {}),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: payment.order?.status || OrderStatus.PENDING_PAYMENT,
            toStatus: orderStatus,
            reason: `Payment ${transaction_status} (Midtrans Webhook)`,
            metadata: { paymentId: payment.id, transactionId: transaction_id } as any,
          },
        });
      }

      return updatedPayment;
    });
  }

  async syncMidtransStatus(orderId: string): Promise<{ synced: boolean; status?: string; orderStatus?: string }> {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId },
        ],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status === OrderStatus.PAID) {
      return { synced: true, status: 'PAID', orderStatus: order.status };
    }

    const midtransPayment = order.payments.find(p => p.provider === 'midtrans' || p.method === PaymentMethod.MIDTRANS);
    if (!midtransPayment) {
      return { synced: false, status: 'NO_MIDTRANS_PAYMENT', orderStatus: order.status };
    }

    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY') || '';
    const isProduction = this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    const midtransApiBase = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

    try {
      const response = await fetch(`${midtransApiBase}/v2/${encodeURIComponent(midtransPayment.paymentNumber)}/status`, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const statusResponse = await response.json();
        if (statusResponse && statusResponse.transaction_status) {
          await this.handleMidtransNotification(statusResponse);
          const updatedOrder = await this.prisma.order.findUnique({ where: { id: order.id } });
          return {
            synced: true,
            status: statusResponse.transaction_status,
            orderStatus: updatedOrder?.status,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Midtrans Sync] Status fetch for payment ${midtransPayment.paymentNumber}:`, err.message || err);
      return { synced: false, status: 'FETCH_FAILED', orderStatus: order.status };
    }

    return { synced: false, status: 'UNKNOWN', orderStatus: order.status };
  }

  async handleMidtransRedirect(query: any): Promise<{ success: boolean; message: string; orderId?: string }> {
    const { order_id, transaction_status, transaction_id } = query;

    const payment = await this.prisma.payment.findFirst({
      where: { paymentNumber: order_id },
      include: { order: true },
    });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    // Redirect is NOT source of truth - webhook is
    return {
      success: transaction_status === 'settlement' || transaction_status === 'capture',
      message: `Payment ${transaction_status}. Please wait for confirmation.`,
      orderId: payment.orderId,
    };
  }

  async findById(id: string, outletId: string): Promise<(Payment & { order?: any }) | null> {
    return this.prisma.payment.findFirst({
      where: { id, outletId },
      include: { order: true },
    });
  }

  async findByOrderId(orderId: string, outletId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { orderId, outletId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(outletId: string, filters?: any): Promise<Payment[]> {
    const where: any = { outletId };

    if (filters?.status) where.status = filters.status;
    if (filters?.method) where.method = filters.method;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, orderNumber: true, table: true } } },
    });
  }

  async refund(paymentId: string, outletId: string, amount?: Prisma.Decimal | number, reason?: string, userId?: string): Promise<Payment> {
    const payment = await this.findById(paymentId, outletId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new ConflictException('Can only refund paid payments');
    }

    const decimalAmount = amount !== undefined ? new Prisma.Decimal(amount) : undefined;
    const refundAmount = decimalAmount || payment.amount;
    if (refundAmount.gt(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    // For Midtrans, we would call their refund API here
    // For now, just update the payment record
    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: refundAmount.eq(payment.amount) ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
          refundedAt: new Date(),
          refundReason: reason,
          refundAmount: refundAmount.add(payment.refundAmount),
        },
      });

      if (payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.REFUNDED },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: payment.order?.status || OrderStatus.PAID,
            toStatus: OrderStatus.REFUNDED,
            changedById: userId,
            reason: `Refund: ${reason}`,
            metadata: { paymentId, refundAmount: refundAmount.toString() } as any,
          },
        });
      }

      return updatedPayment;
    });
  }

  async getPaymentSummary(outletId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { outletId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [byMethod, byStatus, totalAmount] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { ...where, status: PaymentStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    return {
      byMethod: byMethod.map((m) => ({
        method: m.method,
        count: m._count.id,
        total: m._sum.amount,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        total: s._sum.amount,
      })),
      totalRevenue: totalAmount._sum.amount || new Prisma.Decimal(0),
    };
  }

  /**
   * Process QRIS Payment via BorderPay Gateway
   */
  async processBorderPayPayment(paymentId: string, clientOrigin?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: true,
            outlet: { include: { company: true } },
            table: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Jika pembayaran sudah berstatus PAID (sudah lunas)
    if (payment.status === PaymentStatus.PAID) {
      throw new ConflictException('Pesanan ini sudah dibayar lunas');
    }

    // Idempotent reuse: Jika pembayaran sudah berstatus PROCESSING dan sudah memiliki data BorderPay QRIS/URL
    if (payment.status === PaymentStatus.PROCESSING && payment.providerPayload) {
      const payload = payment.providerPayload as any;
      if (payload && (payload.qrString || payload.qr_string || payload.paymentUrl || payload.pay_url)) {
        return {
          paymentUrl:
            payload.paymentUrl ||
            payload.pay_url ||
            payload.checkout_url ||
            `https://borderpay.id/pay/${payment.paymentNumber}`,
          qrString: payload.qrString || payload.qr_string || payload.qr_content,
          qrImageUrl: payload.qrImageUrl || payload.qr_image_url || payload.qr_url,
          referenceId: payment.paymentNumber,
          providerReference: payment.providerReference || payment.paymentNumber,
        };
      }
    }

    const order = payment.order;
    const grossAmount = Math.round(Number(payment.amount));

    let frontendBase = clientOrigin;
    if (!frontendBase || frontendBase.includes('localhost') || frontendBase.includes('127.0.0.1')) {
      const configBase = this.configService.get('FRONTEND_URL');
      if (configBase && !configBase.includes('localhost') && !configBase.includes('127.0.0.1')) {
        frontendBase = configBase;
      } else {
        frontendBase = 'http://localhost:5001';
      }
    }

    const tableToken = (order.table as any)?.qrToken || (order.table as any)?.token;
    const tokenQuery = tableToken ? `?token=${encodeURIComponent(tableToken)}` : '';
    const returnUrl = `${frontendBase}/order/status/${payment.orderId}${tokenQuery}`;

    const res = await this.borderPayService.createOrderPayment({
      amount: grossAmount,
      referenceId: payment.paymentNumber,
      returnUrl,
      description: `Pesanan Meja #${order.table?.tableNumber || '-'} (${order.orderNumber})`,
      customerName: order.customerName || 'Customer',
      customerPhone: order.customerPhone || undefined,
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        provider: 'borderpay',
        method: PaymentMethod.BORDERPAY,
        providerReference: res.providerReference || payment.paymentNumber,
        providerPayload: res as any,
        status: PaymentStatus.PROCESSING,
      },
    });

    return {
      paymentUrl: res.paymentUrl,
      qrString: res.qrString,
      qrImageUrl: res.qrImageUrl,
      referenceId: payment.paymentNumber,
    };
  }

  /**
   * Helper: Mark Payment as Paid & Credit to Cafe QRIS Balance
   */
  async markPaymentAsPaid(paymentId: string, providerRef: string, payload: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            outlet: { include: { company: true } },
            table: true,
          },
        },
      },
    });

    if (!payment) return null;
    if (payment.status === PaymentStatus.PAID) return payment;

    const companyId = payment.order?.outlet?.companyId;

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          providerReference: providerRef,
          providerPayload: payload,
          paidAt: new Date(),
        },
      });

      if (payment.orderId) {
        let shiftIdToAssign: string | undefined = undefined;
        if (!payment.order?.shiftId && payment.order?.outletId) {
          const activeShift = await tx.shift.findFirst({
            where: { outletId: payment.order.outletId, status: ShiftStatus.OPEN },
            orderBy: { createdAt: 'desc' },
          });
          if (activeShift) {
            shiftIdToAssign = activeShift.id;
          }
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: OrderStatus.PAID,
            paidAmount: payment.amount,
            ...(shiftIdToAssign && { shiftId: shiftIdToAssign }),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            fromStatus: payment.order?.status || OrderStatus.PENDING_PAYMENT,
            toStatus: OrderStatus.PAID,
            reason: `Payment Confirmed via BorderPay (${providerRef})`,
            metadata: payload,
          },
        });

        // Credit to cafe QRIS sales balance
        if (
          companyId &&
          (payment.method === PaymentMethod.QRIS ||
            payment.method === PaymentMethod.BORDERPAY ||
            payment.provider === 'borderpay')
        ) {
          const company = await tx.company.findUnique({ where: { id: companyId } });
          if (company) {
            const balanceBefore = company.qrisBalance;
            const balanceAfter = new Prisma.Decimal(Number(balanceBefore) + Number(payment.amount));

            await tx.company.update({
              where: { id: companyId },
              data: { qrisBalance: balanceAfter },
            });

            await tx.balanceMutation.create({
              data: {
                companyId,
                type: BalanceMutationType.QRIS_SALE,
                amount: payment.amount,
                balanceBefore,
                balanceAfter,
                referenceId: payment.order.orderNumber,
                description: `Penjualan QRIS Meja #${payment.order.table?.tableNumber || '-'} (${payment.order.orderNumber})`,
              },
            });
          }
        }
      }

      return updatedPayment;
    });
  }

  /**
   * Handle BorderPay Webhook (Pesanan Menu Kafe & Langganan SaaS)
   */
  async handleBorderPayWebhook(body: any, borderpayToken?: string, borderpaySignature?: string) {
    const rawOrderToken = this.configService.get<string>('BORDERPAY_WEBHOOK_TOKEN') || '';
    const rawSaasToken = this.configService.get<string>('BORDERPAY_SAAS_WEBHOOK_TOKEN') || '';

    const configuredTokens = [
      rawOrderToken.replace(/['"]/g, '').trim(),
      rawSaasToken.replace(/['"]/g, '').trim(),
    ].filter(Boolean);

    const incomingToken = (borderpayToken || '').replace(/^Bearer\s+/i, '').replace(/['"]/g, '').trim();

    // 1. Verify Verification Token if provided & configured
    if (configuredTokens.length > 0 && incomingToken) {
      if (!configuredTokens.includes(incomingToken)) {
        this.logger.warn(
          `BorderPay Webhook Token Mismatch: received '${incomingToken}' does not match configured tokens (${configuredTokens.join(', ')})`,
        );
        throw new UnauthorizedException('Token verifikasi BorderPay tidak valid');
      }
    }

    // 2. Handle handshake or test ping from BorderPay
    if (
      !body ||
      Object.keys(body).length === 0 ||
      body.type === 'ping' ||
      body.event === 'ping' ||
      body.event === 'webhook.test' ||
      body.action === 'test'
    ) {
      return { status: 'OK', message: 'BorderPay Webhook endpoint verified successfully' };
    }

    const referenceId = body.reference_id || body.order_id || body.id;
    const rawStatus = (body.status || '').toLowerCase();
    const isPaid = ['paid', 'completed', 'success', 'settlement'].includes(rawStatus);

    if (!referenceId) {
      return { status: 'IGNORED', message: 'No reference_id provided' };
    }

    // 3. Handle SaaS Subscription Checkout (SUB-xxx)
    if (typeof referenceId === 'string' && referenceId.startsWith('SUB-')) {
      if (isPaid) {
        const slugPart = referenceId.replace(/^SUB-/, '').replace(/-\d+$/, '');
        const fallbackSlug = referenceId.split('-')[1] || '';

        const company = await this.prisma.company.findFirst({
          where: {
            OR: [
              { slug: { startsWith: slugPart } },
              { slug: { startsWith: fallbackSlug } },
            ],
          },
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        });

        if (company) {
          const now = new Date();
          let baseDate = now;
          const activeSub = company.subscriptions[0];
          if (activeSub && new Date(activeSub.endDate) > now) {
            baseDate = new Date(activeSub.endDate);
          }
          const endDate = new Date(baseDate);
          endDate.setMonth(endDate.getMonth() + 1);

          await this.prisma.tenantSubscription.updateMany({
            where: { tenantId: company.id, status: 'ACTIVE' },
            data: { status: 'EXPIRED' },
          });

          const planId = activeSub?.planId || (await this.prisma.subscriptionPlan.findFirst())?.id;
          if (planId) {
            await this.prisma.tenantSubscription.create({
              data: {
                tenantId: company.id,
                planId,
                startDate: now,
                endDate,
                status: 'ACTIVE',
                autoRenew: true,
                notes: `Webhook BorderPay settlement (${referenceId})`,
              },
            });

            await this.prisma.company.update({
              where: { id: company.id },
              data: { status: 'ACTIVE' },
            });
          }
        }
      }

      return { status: 'SUCCESS', referenceId, statusReceived: rawStatus };
    }

    // 4. Handle Customer Order Payment (QRIS & Online)
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { paymentNumber: referenceId },
          { providerReference: referenceId },
          { id: referenceId },
        ],
      },
    });

    if (payment) {
      if (isPaid) {
        await this.markPaymentAsPaid(payment.id, referenceId, body);
        return { status: 'SUCCESS', message: 'Order payment confirmed' };
      }
      return { status: 'RECEIVED', message: `Status is ${rawStatus}` };
    }

    return { status: 'NOT_FOUND', message: 'Transaction not found in POS database' };
  }

  /**
   * Sync BorderPay Status for Customer Order Page & POS Cashier
   */
  async syncBorderPayStatus(orderId: string): Promise<{ synced: boolean; status?: string; orderStatus?: string }> {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CONFIRMED ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY ||
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.COMPLETED
    ) {
      return { synced: true, status: 'PAID', orderStatus: order.status };
    }

    const bpPayment = order.payments.find(
      (p) => p.provider === 'borderpay' || p.method === PaymentMethod.BORDERPAY || p.method === PaymentMethod.QRIS,
    );

    if (!bpPayment) {
      return { synced: false, status: 'NO_BORDERPAY_PAYMENT', orderStatus: order.status };
    }

    // BorderPay mencatat transaksi dengan reference_id = paymentNumber (e.g. PAY202611145501)
    // Sediakan providerReference (e.g. cmwfxlr3b0an14ey7fx30sf40) sebagai fallback
    const primaryRef = bpPayment.paymentNumber || bpPayment.providerReference || '';
    const altRef = bpPayment.providerReference || undefined;

    const checkRes = await this.borderPayService.getPaymentStatus(primaryRef, 'qris', altRef);

    if (checkRes.isPaid) {
      await this.markPaymentAsPaid(bpPayment.id, primaryRef, {
        syncedAt: new Date(),
        borderPayData: checkRes.data,
      });
      return { synced: true, status: 'PAID', orderStatus: OrderStatus.PAID };
    }

    return { synced: false, status: checkRes.status || 'PENDING', orderStatus: order.status };
  }
}