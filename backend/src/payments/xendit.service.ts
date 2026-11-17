import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly secretKey: string;
  private readonly webhookToken: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
  ) {
    this.secretKey = this.configService.get<string>('XENDIT_SECRET_KEY') || '';
    this.webhookToken = this.configService.get<string>('XENDIT_WEBHOOK_TOKEN') || '';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5001';
  }

  private getBasicAuthHeader(): string {
    return `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`;
  }

  private async generatePaymentNumber(outletId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastPayment = await this.prisma.payment.findFirst({
      where: { outletId },
      orderBy: { createdAt: 'desc' },
      select: { paymentNumber: true },
    });

    let sequence = 1;
    if (lastPayment && lastPayment.paymentNumber) {
      const lastSeq = parseInt(lastPayment.paymentNumber.slice(-4), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `PAY${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create Xendit Invoice with xenPlatform Sub-Account support
   */
  async createInvoice(orderId: string, customFrontendUrl?: string): Promise<{
    invoiceUrl: string;
    invoiceId: string;
    expiryDate: string;
    status: string;
    amount: number;
  }> {
    if (!this.secretKey) {
      throw new BadRequestException('XENDIT_SECRET_KEY belum dikonfigurasi di server');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        outlet: {
          include: {
            company: true,
          },
        },
        table: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order dengan ID ${orderId} tidak ditemukan`);
    }

    // Determine target frontend baseUrl dynamically
    let baseUrl = this.frontendUrl;
    if (customFrontendUrl) {
      try {
        const parsed = new URL(customFrontendUrl);
        baseUrl = `${parsed.protocol}//${parsed.host}`;
      } catch {
        baseUrl = customFrontendUrl.replace(/\/$/, '');
      }
    }

    // Check if order already has an active pending payment with valid Xendit invoice
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,
        provider: 'xendit',
        status: PaymentStatus.PENDING_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment && existingPayment.providerPayload) {
      const payload = existingPayment.providerPayload as any;
      if (payload.invoice_url && payload.expiry_date) {
        const expiry = new Date(payload.expiry_date);
        const existingSuccessUrl = String(payload.success_redirect_url || '');
        const isOldLocalhost = existingSuccessUrl.includes('localhost') || existingSuccessUrl.includes('127.0.0.1');
        const isCurrentNonLocal = !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1');

        // Only reuse existing invoice if not expired AND not pointing to stale localhost
        if (expiry > new Date() && !(isOldLocalhost && isCurrentNonLocal)) {
          return {
            invoiceUrl: payload.invoice_url,
            invoiceId: payload.id || existingPayment.providerReference || '',
            expiryDate: payload.expiry_date,
            status: payload.status || 'PENDING',
            amount: Number(order.totalAmount),
          };
        }
      }
    }

    const company = order.outlet?.company;
    const subAccountId = company?.xenditSubAccountId || null;
    const totalAmount = Math.round(Number(order.totalAmount));

    const tableToken = (order.table as any)?.qrToken || (order.table as any)?.qrCode?.token;
    const tokenQuery = tableToken ? `?token=${encodeURIComponent(tableToken)}` : '';
    const redirectUrl = `${baseUrl}/order/status/${order.id}${tokenQuery}`;

    const invoicePayload: any = {
      external_id: order.orderNumber,
      amount: totalAmount,
      description: `Pembayaran ${order.orderNumber} di ${company?.name || 'Cafe'} (Meja ${order.table?.tableNumber || '-'})`,
      invoice_duration: 900, // 15 menit
      currency: 'IDR',
      reminder_time: 1,
      customer: {
        given_names: order.customerName || 'Pelanggan Meja',
        mobile_number: order.customerPhone || undefined,
      },
      customer_notification_preference: {
        invoice_created: ['whatsapp'],
        invoice_paid: ['whatsapp'],
      },
      success_redirect_url: redirectUrl,
      failure_redirect_url: redirectUrl,
      items: order.items.map((item) => ({
        name: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
        quantity: item.quantity,
        price: Math.round(Number(item.unitPrice)),
        category: 'Food & Beverage',
      })),
    };

    // Include fees if tax or service charge exist
    const fees: any[] = [];
    if (Number(order.taxAmount) > 0) {
      fees.push({
        type: 'Pajak (PB1)',
        value: Math.round(Number(order.taxAmount)),
      });
    }
    if (Number(order.serviceChargeAmount) > 0) {
      fees.push({
        type: 'Biaya Layanan',
        value: Math.round(Number(order.serviceChargeAmount)),
      });
    }
    if (fees.length > 0) {
      invoicePayload.fees = fees;
    }

    const headers: Record<string, string> = {
      'Authorization': this.getBasicAuthHeader(),
      'Content-Type': 'application/json',
    };

    // xenPlatform support: If tenant has a sub-account ID, route payment to them
    if (subAccountId) {
      headers['for-user-id'] = subAccountId;
      this.logger.log(`Routing payment to Xendit sub-account: ${subAccountId} for company: ${company?.name}`);
    }

    this.logger.log(`Creating Xendit invoice for Order ${order.orderNumber} - Amount: Rp ${totalAmount} - Redirect: ${redirectUrl}`);

    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers,
      body: JSON.stringify(invoicePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(`Xendit API Error (${response.status}): ${JSON.stringify(data)}`);
      if (response.status === 403) {
        throw new BadRequestException('API Key Xendit ditolak (403 Forbidden). Pastikan API Key di Dashboard Xendit (Settings -> API Keys) telah diberi permission "Write" untuk fitur "Invoices".');
      }
      throw new BadRequestException(data.message || 'Gagal membuat invoice pembayaran Xendit');
    }

    // Save or update payment record in DB
    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          method: PaymentMethod.XENDIT,
          amount: new Prisma.Decimal(totalAmount),
          status: PaymentStatus.PENDING_PAYMENT,
          provider: 'xendit',
          providerReference: data.id,
          providerPayload: data,
          idempotencyKey: `xendit-${data.id}`,
        },
      });
    } else {
      const paymentNumber = await this.generatePaymentNumber(order.outletId);
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          outletId: order.outletId,
          paymentNumber,
          method: PaymentMethod.XENDIT,
          amount: new Prisma.Decimal(totalAmount),
          status: PaymentStatus.PENDING_PAYMENT,
          provider: 'xendit',
          providerReference: data.id,
          providerPayload: data,
          idempotencyKey: `xendit-${data.id}`,
        },
      });
    }

    return {
      invoiceUrl: data.invoice_url,
      invoiceId: data.id,
      expiryDate: data.expiry_date,
      status: data.status,
      amount: totalAmount,
    };
  }

  /**
   * Verify Xendit Webhook Token
   */
  verifyWebhookToken(tokenHeader?: string): boolean {
    if (!this.webhookToken) {
      this.logger.warn('XENDIT_WEBHOOK_TOKEN belum diset di .env, mengabaikan verifikasi token');
      return true;
    }
    return tokenHeader === this.webhookToken;
  }

  /**
   * Sync invoice status directly from Xendit API (useful for localhost development & webhook fallback)
   */
  async syncInvoiceStatus(orderId: string): Promise<{ synced: boolean; status: string; orderStatus: string }> {
    if (!this.secretKey) {
      return { synced: false, status: 'NO_KEY', orderStatus: 'UNKNOWN' };
    }

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId },
        ],
      },
      include: {
        payments: {
          where: { provider: 'xendit' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      return { synced: true, status: 'ALREADY_PROCESSED', orderStatus: order.status };
    }

    const xenditPayment = order.payments[0];
    if (!xenditPayment || !xenditPayment.providerReference) {
      return { synced: false, status: 'NO_XENDIT_INVOICE', orderStatus: order.status };
    }

    const invoiceId = xenditPayment.providerReference;

    try {
      const response = await fetch(`https://api.xendit.co/v2/invoices/${invoiceId}`, {
        headers: {
          'Authorization': this.getBasicAuthHeader(),
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch Xendit invoice ${invoiceId}: ${response.status}`);
        return { synced: false, status: 'FETCH_FAILED', orderStatus: order.status };
      }

      const xenditInvoice = await response.json();
      this.logger.log(`Synced Xendit Invoice ${invoiceId}: status=${xenditInvoice.status}`);

      if (xenditInvoice.status === 'PAID' || xenditInvoice.status === 'SETTLED') {
        await this.handleCallback(xenditInvoice, 'INTERNAL_SYNC');
        return { synced: true, status: xenditInvoice.status, orderStatus: OrderStatus.PAID };
      }

      if (xenditInvoice.status === 'EXPIRED') {
        await this.handleCallback(xenditInvoice, 'INTERNAL_SYNC');
        return { synced: true, status: xenditInvoice.status, orderStatus: order.status };
      }

      return { synced: true, status: xenditInvoice.status, orderStatus: order.status };
    } catch (err: any) {
      this.logger.error(`Error syncing Xendit invoice ${invoiceId}: ${err.message}`);
      return { synced: false, status: 'ERROR', orderStatus: order.status };
    }
  }

  /**
   * Handle Webhook Callback from Xendit
   */
  async handleCallback(payload: any, tokenHeader?: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Received Xendit Webhook: status=${payload?.status}, external_id=${payload?.external_id}`);

    if (tokenHeader !== 'INTERNAL_SYNC') {
      if (this.webhookToken && !this.verifyWebhookToken(tokenHeader)) {
        this.logger.error('Invalid Xendit callback token');
        throw new UnauthorizedException('Invalid x-callback-token');
      }
    }

    const { external_id, id: invoiceId, status, paid_amount, payment_method, paid_at } = payload;

    if (!external_id) {
      throw new BadRequestException('external_id missing in webhook payload');
    }

    // Find order by orderNumber or id
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: external_id },
          { id: external_id },
        ],
      },
      include: {
        outlet: true,
        payments: true,
      },
    });

    if (!order) {
      this.logger.warn(`Order not found for external_id: ${external_id}`);
      return { success: false, message: `Order not found for external_id: ${external_id}` };
    }

    if (status === 'PAID' || status === 'SETTLED') {
      const actualPaidAmount = paid_amount ? new Prisma.Decimal(paid_amount) : order.totalAmount;

      await this.prisma.$transaction(async (tx) => {
        // 1. Update Order status to PAID
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAmount: actualPaidAmount,
            confirmedAt: new Date(),
          },
        });

        // 2. Update Payment records
        const existingPayment = await tx.payment.findFirst({
          where: {
            orderId: order.id,
            provider: 'xendit',
            providerReference: invoiceId,
          },
        });

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: PaymentStatus.PAID,
              paidAt: paid_at ? new Date(paid_at) : new Date(),
              providerPayload: payload,
            },
          });
        } else {
          const paymentNumber = await this.generatePaymentNumber(order.outletId);
          await tx.payment.create({
            data: {
              orderId: order.id,
              outletId: order.outletId,
              paymentNumber,
              method: PaymentMethod.QRIS,
              amount: actualPaidAmount,
              status: PaymentStatus.PAID,
              provider: 'xendit',
              providerReference: invoiceId,
              providerPayload: payload,
              paidAt: paid_at ? new Date(paid_at) : new Date(),
            },
          });
        }

        // 3. Status History
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: OrderStatus.PAID,
            reason: `Xendit payment verified via webhook (${payment_method || 'ONLINE'})`,
            metadata: payload,
          },
        });

        // 4. Update Table Status to PREPARING
        if (order.tableId) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: 'PREPARING' },
          });
        }

        // 5. Deduct inventory stock automatically
        await this.inventoryService.deductStockForOrder(order.id, tx);
      });

      this.logger.log(`Order ${order.orderNumber} successfully marked as PAID! Inventory deducted.`);
      return { success: true, message: `Order ${order.orderNumber} marked as PAID` };
    }

    if (status === 'EXPIRED') {
      await this.prisma.payment.updateMany({
        where: {
          orderId: order.id,
          provider: 'xendit',
          providerReference: invoiceId,
        },
        data: {
          status: PaymentStatus.EXPIRED,
        },
      });

      this.logger.log(`Xendit invoice ${invoiceId} for Order ${order.orderNumber} has EXPIRED.`);
      return { success: true, message: `Invoice expired recorded` };
    }

    return { success: true, message: `Unhandled status ${status}` };
  }
}

