import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, PaymentStatus, PaymentMethod } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { XenditService } from './xendit.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly xenditService: XenditService,
  ) {}

  @Post('orders/:orderId/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment for an order' })
  async createPayment(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    const idempotencyKey = req.headers['idempotency-key'] || `manual-${orderId}-${Date.now()}`;
    return this.paymentsService.createPaymentForOrder(
      orderId,
      req.user.outletId,
      createPaymentDto.method,
      createPaymentDto.amount,
      idempotencyKey,
    );
  }

  @Public()
  @Post(':id/process-borderpay')
  @ApiOperation({ summary: 'Process BorderPay QRIS payment (public)' })
  async processBorderPay(
    @Param('id') id: string,
    @Body('origin') clientOrigin?: string,
    @Req() req?: any,
  ) {
    let origin = clientOrigin || req?.headers?.origin;
    if (!origin && req?.headers?.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        origin = `${parsed.protocol}//${parsed.host}`;
      } catch {
        origin = req.headers.referer;
      }
    }
    return this.paymentsService.processBorderPayPayment(id, origin);
  }

  @Public()
  @Post('webhook/borderpay')
  @ApiOperation({ summary: 'BorderPay webhook notification for orders & SaaS (public)' })
  async borderPayWebhook(
    @Body() notification: any,
    @Headers('x-borderpay-token') borderpayToken?: string,
    @Headers('x-borderpay-signature') borderpaySignature?: string,
  ) {
    return this.paymentsService.handleBorderPayWebhook(notification, borderpayToken, borderpaySignature);
  }

  @Public()
  @Post('webhook/borderpay-saas')
  @ApiOperation({ summary: 'BorderPay webhook notification dedicated for SaaS subscriptions (public)' })
  async borderPaySaasWebhook(
    @Body() notification: any,
    @Headers('x-borderpay-token') borderpayToken?: string,
    @Headers('x-borderpay-signature') borderpaySignature?: string,
  ) {
    return this.paymentsService.handleBorderPayWebhook(notification, borderpayToken, borderpaySignature);
  }

  @Public()
  @Get(':orderId/borderpay-sync')
  @ApiOperation({ summary: 'Check and synchronize BorderPay payment status (public)' })
  async syncBorderPayStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.syncBorderPayStatus(orderId);
  }

  @Public()
  @Post(':id/process-midtrans')
  @ApiOperation({ summary: 'Process Midtrans Snap payment (public)' })
  async processMidtrans(
    @Param('id') id: string,
    @Body('origin') clientOrigin?: string,
    @Req() req?: any,
  ) {
    let origin = clientOrigin || req?.headers?.origin;
    if (!origin && req?.headers?.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        origin = `${parsed.protocol}//${parsed.host}`;
      } catch {
        origin = req.headers.referer;
      }
    }
    return this.paymentsService.processMidtransPayment(id, origin);
  }

  @Post(':id/process-qris')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process QRIS payment' })
  async processQris(@Request() req: any, @Param('id') id: string) {
    return this.paymentsService.processQrisPayment(id);
  }

  @Public()
  @Post('webhook/midtrans')
  @ApiOperation({ summary: 'Midtrans webhook notification (public)' })
  async midtransWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
    @Body() notification: any,
  ) {
    // TODO: Verify signature using Midtrans server key
    // const isValid = this.verifyMidtransSignature(req.rawBody, signature);
    // if (!isValid) throw new UnauthorizedException('Invalid signature');

    return this.paymentsService.handleMidtransNotification(notification);
  }

  @Public()
  @Post('midtrans/callback')
  @ApiOperation({ summary: 'Midtrans callback alias (public)' })
  async midtransCallbackPost(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
    @Body() notification: any,
  ) {
    return this.paymentsService.handleMidtransNotification(notification);
  }

  @Public()
  @Get(['webhook/midtrans', 'midtrans/callback'])
  @ApiOperation({ summary: 'Midtrans webhook verification endpoint (public)' })
  async midtransWebhookVerify() {
    return { status: 'OK', message: 'Midtrans webhook endpoint is active' };
  }

  @Public()
  @Get('midtrans/sync/:orderId')
  @ApiOperation({ summary: 'Sync Midtrans payment status directly from Midtrans API (public)' })
  async syncMidtransStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.syncMidtransStatus(orderId);
  }

  @Public()
  @Get('redirect/midtrans')
  @ApiOperation({ summary: 'Midtrans redirect callback (public)' })
  async midtransRedirect(@Query() query: any) {
    return this.paymentsService.handleMidtransRedirect(query);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments with filters' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(@Request() req: any, @Query() filters: any) {
    return this.paymentsService.findAll(req.user.outletId, filters);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment summary for reports' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getSummary(@Request() req: any, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.paymentsService.getPaymentSummary(
      req.user.outletId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('orders/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments for an order' })
  async findByOrder(@Request() req: any, @Param('orderId') orderId: string) {
    return this.paymentsService.findByOrderId(orderId, req.user.outletId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.paymentsService.findById(id, req.user.outletId);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment' })
  async refund(
    @Request() req: any,
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(
      id,
      req.user.outletId,
      refundPaymentDto.amount,
      refundPaymentDto.reason,
      req.user.sub,
    );
  }

  @Public()
  @Post('xendit/invoice')
  @ApiOperation({ summary: 'Create Xendit checkout invoice for an order (public)' })
  async createXenditInvoice(
    @Body('orderId') orderId: string,
    @Body('redirectUrl') redirectUrl?: string,
    @Req() req?: any,
  ) {
    let origin = redirectUrl || req?.headers?.origin;
    if (!origin && req?.headers?.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        origin = `${parsed.protocol}//${parsed.host}`;
      } catch {
        origin = req.headers.referer;
      }
    }
    return this.xenditService.createInvoice(orderId, origin);
  }

  @Public()
  @Get('xendit/sync/:orderId')
  @ApiOperation({ summary: 'Sync Xendit invoice status directly from Xendit API (public)' })
  async syncXenditStatus(@Param('orderId') orderId: string) {
    return this.xenditService.syncInvoiceStatus(orderId);
  }

  @Public()
  @Post('xendit/callback')
  @ApiOperation({ summary: 'Xendit invoice webhook callback (public)' })
  async xenditWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() payload: any,
  ) {
    return this.xenditService.handleCallback(payload, callbackToken);
  }

  @Public()
  @Get('xendit/callback')
  @ApiOperation({ summary: 'Xendit webhook verification endpoint (public)' })
  async xenditWebhookVerify() {
    return { status: 'OK', message: 'Xendit webhook endpoint is active' };
  }

  @Public()
  @Post('doit/callback')
  @ApiOperation({ summary: 'doit.id payment webhook callback (public)' })
  async doitWebhook(
    @Headers('paybridge-signature') signature: string,
    @Body() payload: any,
  ) {
    console.log('[doit.id Webhook POST Received]:', { signature, payload });
    return { success: true, message: 'doit.id webhook received successfully' };
  }

  @Public()
  @Get('doit/callback')
  @ApiOperation({ summary: 'doit.id webhook verification endpoint (public)' })
  async doitWebhookVerify() {
    return { status: 'OK', message: 'doit.id webhook endpoint is active' };
  }
}