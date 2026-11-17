import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BorderPayService } from '../payments/borderpay.service';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { SubscriptionCheckoutDto, ConfirmSubscriptionPaymentDto } from './dto/subscription-checkout.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { TenantStatus, SubscriptionStatus, UserRole, Prisma, BalanceMutationType, WithdrawalStatus } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private borderPayService: BorderPayService,
  ) {}

  async resolveCompanyId(companyId?: string): Promise<string> {
    if (companyId) return companyId;
    const first = await this.prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    return first?.id || '';
  }

  async resolveSlug(slug: string) {
    const tenant = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        outlets: {
          where: { isActive: true },
          take: 1,
        },
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Kafe dengan alamat URL "${slug}" tidak ditemukan.`);
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenException(`Akses untuk kafe "${tenant.name}" saat ini ditangguhkan.`);
    }

    const defaultOutlet = tenant.outlets[0] || null;
    const activeSub = tenant.subscriptions[0] || null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      tagline: tenant.tagline,
      address: tenant.address,
      phone: tenant.phone,
      email: tenant.email,
      logoUrl: tenant.logoUrl || tenant.logo,
      receiptFooter: tenant.receiptFooter,
      qrisImageUrl: tenant.qrisImageUrl,
      status: tenant.status,
      defaultOutletId: defaultOutlet?.id || null,
      taxRate: Number(defaultOutlet?.taxRate ?? 0),
      serviceCharge: Number(defaultOutlet?.serviceCharge ?? 0),
      plan: activeSub
        ? {
            name: activeSub.plan.name,
            slug: activeSub.plan.slug,
            maxProducts: activeSub.plan.maxProducts,
            maxStaffAccounts: activeSub.plan.maxStaffAccounts,
          }
        : null,
    };
  }

  async getProfile(companyId: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const tenant = await this.prisma.company.findUnique({
      where: { id: resolvedCompanyId },
      include: {
        outlets: true,
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    const activeSub = tenant.subscriptions[0] || null;

    // Calculate usage quotas
    const [productsCount, staffCount] = await Promise.all([
      this.prisma.product.count({
        where: { outlet: { companyId: resolvedCompanyId } },
      }),
      this.prisma.user.count({
        where: {
          companyId: resolvedCompanyId,
          role: { not: UserRole.SUPERADMIN },
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      ...tenant,
      activeSubscription: activeSub,
      quotas: {
        products: {
          used: productsCount,
          max: activeSub?.plan.maxProducts ?? -1,
          isUnlimited: (activeSub?.plan.maxProducts ?? -1) === -1,
        },
        staff: {
          used: staffCount,
          max: activeSub?.plan.maxStaffAccounts ?? -1,
          isUnlimited: (activeSub?.plan.maxStaffAccounts ?? -1) === -1,
        },
      },
    };
  }

  async updateProfile(companyId: string, dto: UpdateTenantProfileDto) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const tenant = await this.prisma.company.findUnique({ where: { id: resolvedCompanyId } });
    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    if (dto.taxRate !== undefined || dto.serviceCharge !== undefined) {
      await this.prisma.outlet.updateMany({
        where: { companyId: resolvedCompanyId },
        data: {
          ...(dto.taxRate !== undefined && { taxRate: new Prisma.Decimal(dto.taxRate) }),
          ...(dto.serviceCharge !== undefined && { serviceCharge: new Prisma.Decimal(dto.serviceCharge) }),
        },
      });
    }

    return this.prisma.company.update({
      where: { id: resolvedCompanyId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl, logo: dto.logoUrl }),
        ...(dto.receiptFooter !== undefined && { receiptFooter: dto.receiptFooter }),
        ...(dto.qrisImageUrl !== undefined && { qrisImageUrl: dto.qrisImageUrl }),
        ...(dto.defaultBankCode !== undefined && { defaultBankCode: dto.defaultBankCode }),
        ...(dto.defaultBankName !== undefined && { defaultBankName: dto.defaultBankName }),
        ...(dto.defaultAccountNumber !== undefined && { defaultAccountNumber: dto.defaultAccountNumber }),
        ...(dto.defaultAccountName !== undefined && { defaultAccountName: dto.defaultAccountName }),
      },
    });
  }

  /**
   * Payout / Withdrawal Configuration for Tenant
   */
  async getPayoutConfig(companyId: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const [company, feeSetting, totalWithdrawn] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: resolvedCompanyId },
        select: {
          id: true,
          name: true,
          qrisBalance: true,
          defaultBankCode: true,
          defaultBankName: true,
          defaultAccountNumber: true,
          defaultAccountName: true,
        },
      }),
      this.prisma.platformSetting.findUnique({
        where: { key: 'payout_fee' },
      }),
      this.prisma.withdrawal.aggregate({
        where: {
          companyId: resolvedCompanyId,
          status: { in: [WithdrawalStatus.COMPLETED, WithdrawalStatus.PROCESSING] },
        },
        _sum: { amount: true },
      }),
    ]);

    if (!company) throw new NotFoundException('Tenan tidak ditemukan');

    const payoutFee = feeSetting ? Number(feeSetting.value) : 4500;

    return {
      qrisBalance: Number(company.qrisBalance),
      totalWithdrawn: Number(totalWithdrawn._sum.amount || 0),
      payoutFee,
      defaultBank: {
        bankCode: company.defaultBankCode || 'BCA',
        bankName: company.defaultBankName || 'Bank Central Asia',
        accountNumber: company.defaultAccountNumber || '',
        accountHolderName: company.defaultAccountName || '',
      },
    };
  }

  /**
   * Request a new Withdrawal (Tarik Dana Saldo QRIS)
   */
  async requestWithdrawal(companyId: string, userId: string, dto: RequestWithdrawalDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Tenan tidak ditemukan');

    const feeSetting = await this.prisma.platformSetting.findUnique({
      where: { key: 'payout_fee' },
    });
    const fee = feeSetting ? Number(feeSetting.value) : 4500;

    const requestedAmount = Number(dto.amount);
    if (requestedAmount <= fee) {
      throw new BadRequestException(
        `Nominal penarikan harus lebih besar dari biaya admin penarikan (Rp ${new Intl.NumberFormat('id-ID').format(fee)})`,
      );
    }

    const currentBalance = Number(company.qrisBalance);
    if (currentBalance < requestedAmount) {
      throw new BadRequestException(
        `Saldo QRIS tidak mencukupi. Saldo Anda saat ini: Rp ${new Intl.NumberFormat('id-ID').format(currentBalance)}`,
      );
    }

    const netAmount = requestedAmount - fee;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `WD-${company.slug.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    // Execute atomic balance deduction and ledger record
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct balance
      const balanceBefore = company.qrisBalance;
      const balanceAfter = new Prisma.Decimal(currentBalance - requestedAmount);

      await tx.company.update({
        where: { id: companyId },
        data: {
          qrisBalance: balanceAfter,
          ...(dto.saveAsDefault && {
            defaultBankCode: dto.bankCode,
            defaultBankName: dto.bankName,
            defaultAccountNumber: dto.accountNumber,
            defaultAccountName: dto.accountHolderName,
          }),
        },
      });

      // Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          companyId,
          amount: new Prisma.Decimal(requestedAmount),
          fee: new Prisma.Decimal(fee),
          netAmount: new Prisma.Decimal(netAmount),
          bankCode: dto.bankCode,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountHolderName: dto.accountHolderName,
          status: WithdrawalStatus.PROCESSING,
          referenceId,
          notes: dto.notes,
          createdById: userId,
        },
      });

      // Create mutation record
      await tx.balanceMutation.create({
        data: {
          companyId,
          type: BalanceMutationType.WITHDRAWAL,
          amount: new Prisma.Decimal(-requestedAmount),
          balanceBefore,
          balanceAfter,
          referenceId,
          description: `Penarikan Saldo ke ${dto.bankName} ${dto.accountNumber} a.n ${dto.accountHolderName} (Dana Bersih: Rp ${new Intl.NumberFormat('id-ID').format(netAmount)}, Admin: Rp ${new Intl.NumberFormat('id-ID').format(fee)})`,
        },
      });

      return withdrawal;
    });

    // Execute BorderPay Payout API
    const payoutRes = await this.borderPayService.createDisbursement({
      amount: netAmount,
      bankCode: dto.bankCode,
      accountNumber: dto.accountNumber,
      accountHolderName: dto.accountHolderName,
      referenceId,
      description: `Payout Saldo QRIS Kafe ${company.name}`,
    });

    // Update withdrawal record with provider result
    const updated = await this.prisma.withdrawal.update({
      where: { id: result.id },
      data: {
        disbursementId: payoutRes.disbursementId,
        status: payoutRes.status === 'COMPLETED' ? WithdrawalStatus.COMPLETED : WithdrawalStatus.PROCESSING,
        processedAt: payoutRes.status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return {
      success: true,
      message: `Permintaan penarikan dana sebesar Rp ${new Intl.NumberFormat('id-ID').format(requestedAmount)} berhasil dikirimkan. Dana bersih Rp ${new Intl.NumberFormat('id-ID').format(netAmount)} sedang diproses ke rekening ${dto.bankName} Anda.`,
      withdrawal: updated,
    };
  }

  /**
   * Get Tenant Withdrawals
   */
  async getWithdrawals(companyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where: { companyId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Tenant Balance Mutations (Buku Besar Mutasi Saldo)
   */
  async getBalanceMutations(companyId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.balanceMutation.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.balanceMutation.count({ where: { companyId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Subscription Checkout via BorderPay (Key: SaaS)
   */
  async createSubscriptionCheckout(
    companyId: string,
    user: { id: string; email: string; fullName: string },
    dto: SubscriptionCheckoutDto,
  ) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const tenant = await this.prisma.company.findUnique({ where: { id: resolvedCompanyId } });
    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.planSlug },
    });
    if (!plan) throw new NotFoundException(`Paket langganan "${dto.planSlug}" tidak ditemukan`);

    const isYearly = dto.billingCycle === 'YEARLY';
    const amount = Number(isYearly ? plan.priceYearly : plan.priceMonthly);
    const durationMonths = isYearly ? 12 : 1;

    // Generate unique order ID for BorderPay
    const orderId = `SUB-${tenant.slug.slice(0, 8)}-${Date.now()}`;

    const frontendBaseUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5001';
    const returnUrl = `${frontendBaseUrl}/admin/settings?payment=success&orderId=${orderId}&plan=${plan.slug}&months=${durationMonths}`;

    const borderPayRes = await this.borderPayService.createSubscriptionPayment({
      amount,
      referenceId: orderId,
      returnUrl,
      description: `Paket ${plan.name} (${isYearly ? '1 Tahun' : '1 Bulan'}) - ${tenant.name}`,
      customerName: user.fullName || tenant.name,
      customerPhone: tenant.phone || undefined,
    });

    return {
      orderId,
      paymentUrl: borderPayRes.paymentUrl,
      redirectUrl: borderPayRes.paymentUrl,
      qrString: borderPayRes.qrString,
      qrImageUrl: borderPayRes.qrImageUrl,
      grossAmount: amount,
      plan: {
        name: plan.name,
        slug: plan.slug,
        priceMonthly: Number(plan.priceMonthly),
        priceYearly: Number(plan.priceYearly),
      },
      durationMonths,
      billingCycle: dto.billingCycle,
    };
  }

  /**
   * Cek status pembayaran langganan SaaS
   */
  async checkSubscriptionStatus(orderId: string) {
    // 1. Cek apakah sudah pernah tercatat aktif di database
    const existingSub = await this.prisma.tenantSubscription.findFirst({
      where: { notes: { contains: orderId } },
      include: { plan: true },
    });

    if (existingSub) {
      return { isPaid: true, status: 'PAID', subscription: existingSub };
    }

    // 2. Cek langsung ke BorderPay API
    const bpStatus = await this.borderPayService.getSubscriptionPaymentStatus(orderId);
    if (bpStatus.isPaid) {
      const parts = orderId.split('-');
      const tenantSlug = parts[1];
      const company = await this.prisma.company.findFirst({
        where: { slug: { startsWith: tenantSlug } },
        include: {
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
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
          where: { tenantId: company.id, status: SubscriptionStatus.ACTIVE },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        const planId = activeSub?.planId || (await this.prisma.subscriptionPlan.findFirst())?.id;
        if (planId) {
          const newSub = await this.prisma.tenantSubscription.create({
            data: {
              tenantId: company.id,
              planId,
              startDate: now,
              endDate,
              status: SubscriptionStatus.ACTIVE,
              autoRenew: true,
              notes: `BorderPay Settlement (${orderId})`,
            },
            include: { plan: true },
          });

          await this.prisma.company.update({
            where: { id: company.id },
            data: { status: TenantStatus.ACTIVE },
          });

          return { isPaid: true, status: 'PAID', subscription: newSub };
        }
      }
    }

    return { isPaid: false, status: bpStatus.status || 'PENDING' };
  }

  /**
   * Confirm Subscription Activation
   */
  async confirmSubscriptionPayment(
    companyId: string,
    dto: ConfirmSubscriptionPaymentDto,
  ) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const tenant = await this.prisma.company.findUnique({
      where: { id: resolvedCompanyId },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.planSlug },
    });
    if (!plan) throw new NotFoundException('Paket langganan tidak ditemukan');

    // Calculate start & end date
    const now = new Date();
    const activeSub = tenant.subscriptions[0];
    let startDate = now;
    let baseDate = now;

    if (activeSub && new Date(activeSub.endDate) > now) {
      baseDate = new Date(activeSub.endDate);
    }

    const endDate = new Date(baseDate);
    endDate.setMonth(endDate.getMonth() + (dto.durationMonths || 1));

    // Deactivate previous active subscriptions
    await this.prisma.tenantSubscription.updateMany({
      where: { tenantId: companyId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    // Create new active subscription
    const newSub = await this.prisma.tenantSubscription.create({
      data: {
        tenantId: companyId,
        planId: plan.id,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        notes: `Perpanjangan via BorderPay (Order ID: ${dto.orderId})`,
      },
      include: { plan: true },
    });

    // Ensure tenant status is ACTIVE
    await this.prisma.company.update({
      where: { id: companyId },
      data: { status: TenantStatus.ACTIVE },
    });

    return {
      message: `Langganan paket "${plan.name}" berhasil diaktifkan hingga ${endDate.toLocaleDateString('id-ID')}`,
      subscription: newSub,
    };
  }
}
