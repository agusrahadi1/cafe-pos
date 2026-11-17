import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { TenantStatus, UserRole, UserStatus, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class SuperadminService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getTenants(status?: string, search?: string) {
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as TenantStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tenants = await this.prisma.company.findMany({
      where,
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
        users: {
          where: { role: { in: [UserRole.ADMIN, UserRole.OWNER] } },
          take: 1,
          select: { id: true, email: true, fullName: true, phone: true, role: true, status: true },
        },
        _count: {
          select: {
            outlets: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get product and order count per tenant
    return Promise.all(
      tenants.map(async (t) => {
        const [productsCount, ordersCount] = await Promise.all([
          this.prisma.product.count({
            where: { outlet: { companyId: t.id } },
          }),
          this.prisma.order.count({
            where: { outlet: { companyId: t.id } },
          }),
        ]);

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          tagline: t.tagline,
          address: t.address,
          phone: t.phone,
          email: t.email,
          logoUrl: t.logoUrl || t.logo,
          receiptFooter: t.receiptFooter,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          activeSubscription: t.subscriptions[0] || null,
          owner: t.users[0] || null,
          counts: {
            outlets: t._count.outlets,
            staff: t._count.users,
            products: productsCount,
            orders: ordersCount,
          },
        };
      }),
    );
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.company.findUnique({
      where: { id },
      include: {
        outlets: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
        users: {
          select: { id: true, email: true, fullName: true, role: true, status: true, phone: true },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');
    return tenant;
  }

  async createTenant(dto: CreateTenantDto) {
    const existingSlug = await this.prisma.company.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Slug tenan "${dto.slug}" sudah digunakan. Pilih slug lain.`);
    }

    const existingEmail = await this.prisma.user.findFirst({
      where: { email: dto.ownerEmail },
    });
    if (existingEmail) {
      throw new ConflictException(`Email owner "${dto.ownerEmail}" sudah terdaftar dalam sistem.`);
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.planSlug },
    });
    if (!plan) {
      throw new NotFoundException(`Paket langganan "${dto.planSlug}" tidak ditemukan.`);
    }

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 12);
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          tagline: dto.tagline,
          address: dto.address,
          phone: dto.phone,
          email: dto.ownerEmail,
          status: TenantStatus.ACTIVE,
          receiptFooter: `Terima kasih atas kunjungan Anda di ${dto.name}!`,
        },
      });

      // 2. Create Default Outlet
      const outlet = await tx.outlet.create({
        data: {
          companyId: company.id,
          name: `${dto.name} - Pusat`,
          code: 'MAIN',
          address: dto.address,
          phone: dto.phone,
          email: dto.ownerEmail,
          taxRate: 11,
          serviceCharge: 0,
        },
      });

      // 3. Create Owner User
      const owner = await tx.user.create({
        data: {
          companyId: company.id,
          outletId: outlet.id,
          email: dto.ownerEmail,
          passwordHash,
          fullName: dto.ownerFullName,
          phone: dto.phone,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      // 4. Assign Subscription
      const subscription = await tx.tenantSubscription.create({
        data: {
          tenantId: company.id,
          planId: plan.id,
          startDate: new Date(),
          endDate: oneYearLater,
          status: SubscriptionStatus.ACTIVE,
          autoRenew: true,
          notes: 'Registrasi tenan baru via Superadmin Console',
        },
        include: { plan: true },
      });

      return {
        message: 'Tenan baru berhasil didaftarkan',
        tenant: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          status: company.status,
          outletId: outlet.id,
          owner: {
            id: owner.id,
            email: owner.email,
            fullName: owner.fullName,
          },
          subscription,
        },
      };
    });
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.company.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl, logo: dto.logoUrl }),
        ...(dto.receiptFooter !== undefined && { receiptFooter: dto.receiptFooter }),
        ...(dto.status && { status: dto.status }),
      },
    });

    return updated;
  }

  async toggleTenantStatus(id: string, status: TenantStatus) {
    const tenant = await this.prisma.company.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    const updated = await this.prisma.company.update({
      where: { id },
      data: { status },
    });

    return {
      message: `Status tenan "${tenant.name}" berhasil diubah menjadi ${status}`,
      status: updated.status,
    };
  }

  async resetOwnerPassword(tenantId: string, newPassword: string) {
    const owner = await this.prisma.user.findFirst({
      where: {
        companyId: tenantId,
        role: { in: [UserRole.ADMIN, UserRole.OWNER] },
      },
    });

    if (!owner) {
      throw new NotFoundException('Akun owner untuk tenan ini tidak ditemukan');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: owner.id },
      data: { passwordHash },
    });

    return {
      message: `Password owner "${owner.email}" berhasil diatur ulang`,
    };
  }

  async getPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: { where: { status: SubscriptionStatus.ACTIVE } },
          },
        },
      },
      orderBy: { priceMonthly: 'asc' },
    });

    return plans.map((p) => ({
      ...p,
      activeSubscribers: p._count.subscriptions,
    }));
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Paket dengan slug "${dto.slug}" sudah ada`);
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        maxProducts: dto.maxProducts,
        maxStaffAccounts: dto.maxStaffAccounts,
        features: dto.features || [],
      },
    });
  }

  async updatePlan(id: string, dto: Partial<CreatePlanDto>) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Paket langganan tidak ditemukan');

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priceMonthly !== undefined && { priceMonthly: dto.priceMonthly }),
        ...(dto.priceYearly !== undefined && { priceYearly: dto.priceYearly }),
        ...(dto.maxProducts !== undefined && { maxProducts: dto.maxProducts }),
        ...(dto.maxStaffAccounts !== undefined && { maxStaffAccounts: dto.maxStaffAccounts }),
        ...(dto.features !== undefined && { features: dto.features }),
      },
    });
  }

  async getSubscriptions() {
    return this.prisma.tenantSubscription.findMany({
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, status: true, email: true, phone: true },
        },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignSubscription(dto: AssignSubscriptionDto) {
    const tenant = await this.prisma.company.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.planSlug } });
    if (!plan) throw new NotFoundException('Paket langganan tidak ditemukan');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + dto.durationMonths);

    // Expire other active subscriptions
    await this.prisma.tenantSubscription.updateMany({
      where: { tenantId: tenant.id, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    const newSub = await this.prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planId: plan.id,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: dto.autoRenew || false,
        notes: dto.notes || 'Penyesuaian paket oleh Superadmin',
      },
      include: { plan: true, tenant: true },
    });

    return {
      message: `Paket ${plan.name} berhasil diterapkan untuk tenan "${tenant.name}" hingga ${endDate.toLocaleDateString('id-ID')}`,
      subscription: newSub,
    };
  }

  async getPlatformAnalytics() {
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      activeSubscriptions,
      allSubscriptions,
      totalOrders,
      gmvResult,
      expiringSoonSubs,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.company.count({ where: { status: TenantStatus.SUSPENDED } }),
      this.prisma.tenantSubscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        include: { plan: true },
      }),
      this.prisma.tenantSubscription.count(),
      this.prisma.order.count({
        where: { status: { notIn: ['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'] } },
      }),
      this.prisma.order.aggregate({
        where: { status: { notIn: ['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.tenantSubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          endDate: {
            gte: now,
            lte: next7Days,
          },
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true, email: true, phone: true, status: true },
          },
          plan: true,
        },
        orderBy: { endDate: 'asc' },
      }),
    ]);

    // Calculate Platform SaaS MRR & ARR
    let mrr = 0;
    let arr = 0;
    activeSubscriptions.forEach((sub) => {
      mrr += Number(sub.plan.priceMonthly || 0);
      arr += Number(sub.plan.priceYearly || 0);
    });

    const totalGmv = gmvResult._sum.totalAmount ? Number(gmvResult._sum.totalAmount) : 0;

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        suspended: suspendedTenants,
        expired: totalTenants - activeTenants - suspendedTenants,
      },
      subscriptions: {
        active: activeSubscriptions.length,
        total: allSubscriptions,
        mrr,
        arr,
        expiringSoonCount: expiringSoonSubs.length,
        expiringSoonList: expiringSoonSubs,
      },
      ecosystem: {
        totalOrders,
        totalGmv,
      },
    };
  }

  async impersonateTenant(tenantId: string) {
    const tenant = await this.prisma.company.findUnique({
      where: { id: tenantId },
      include: {
        outlets: { where: { isActive: true }, take: 1 },
      },
    });

    if (!tenant) throw new NotFoundException('Tenan tidak ditemukan');

    // Find owner or admin user of this tenant
    let user = await this.prisma.user.findFirst({
      where: {
        companyId: tenant.id,
        role: { in: [UserRole.ADMIN, UserRole.OWNER] },
        status: UserStatus.ACTIVE,
      },
      include: { company: true },
    });

    if (!user) {
      // Fallback: any active user in the company
      user = await this.prisma.user.findFirst({
        where: {
          companyId: tenant.id,
          status: UserStatus.ACTIVE,
        },
        include: { company: true },
      });
    }

    if (!user) {
      throw new NotFoundException('Tidak ada akun pengguna aktif di tenan ini');
    }

    const outletId = user.outletId || tenant.outlets[0]?.id || null;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      outletId,
      isImpersonated: true,
      impersonatedBy: 'SUPERADMIN',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '2h',
    });

    // Log impersonation event in AuditLog
    await this.auditLogsService.log({
      companyId: tenant.id,
      outletId: outletId || undefined,
      userId: user.id,
      action: 'IMPERSONATE',
      entity: 'Tenant',
      entityId: tenant.id,
      newData: {
        impersonatedTenant: tenant.name,
        targetUser: user.email,
      },
    });

    return {
      message: `Berhasil membuat sesi impersonasi untuk ${tenant.name}`,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        outletId,
        company: user.company,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      redirectUrl: `/${tenant.slug}/admin/menu`,
    };
  }

  async getGlobalAuditLogs(filters?: any) {
    return this.auditLogsService.findAllGlobal(filters);
  }

  async getServerHealth() {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      dbLatencyMs = Date.now() - startTime;
    } catch (err: any) {
      dbStatus = 'degraded';
      dbLatencyMs = -1;
    }

    // System memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const processMem = process.memoryUsage();

    // Check backups folder
    const backupDir = '/var/www/cafe-pos/backups';
    let backupFiles: any[] = [];
    if (fs.existsSync(backupDir)) {
      try {
        const files = fs.readdirSync(backupDir);
        backupFiles = files
          .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'))
          .map(f => {
            const stat = fs.statSync(path.join(backupDir, f));
            return {
              filename: f,
              sizeBytes: stat.size,
              createdAt: stat.birthtime,
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } catch (e) {}
    }

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL',
      },
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemoryBytes: totalMem,
        usedMemoryBytes: usedMem,
        freeMemoryBytes: freeMem,
        processRssBytes: processMem.rss,
        processHeapUsedBytes: processMem.heapUsed,
      },
      backups: {
        totalBackups: backupFiles.length,
        lastBackup: backupFiles[0] || null,
      },
    };
  }

  async triggerDatabaseBackup() {
    const backupDir = '/var/www/cafe-pos/backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    const dbUrl = this.configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new BadRequestException('DATABASE_URL tidak terkonfigurasi');
    }

    let cleanDbUrl = dbUrl;
    try {
      const parsed = new URL(dbUrl);
      parsed.search = '';
      cleanDbUrl = parsed.toString();
    } catch {
      cleanDbUrl = dbUrl.split('?')[0];
    }

    try {
      await execAsync(`pg_dump "${cleanDbUrl}" > "${filepath}"`);
      const stat = fs.statSync(filepath);

      return {
        message: 'Snapshot backup database berhasil dibuat',
        filename,
        filepath,
        sizeBytes: stat.size,
        createdAt: new Date(),
      };
    } catch (err: any) {
      throw new BadRequestException(`Gagal melakukan backup database: ${err.message}`);
    }
  }

  async getPayoutSettings() {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: 'payout_fee' },
    });
    return {
      payoutFee: setting ? Number(setting.value) : 4500,
      label: setting?.label || 'Biaya Admin Penarikan Dana Payout',
    };
  }

  async updatePayoutSettings(payoutFee: number) {
    if (payoutFee < 0) {
      throw new BadRequestException('Biaya penarikan tidak boleh negatif');
    }
    const updated = await this.prisma.platformSetting.upsert({
      where: { key: 'payout_fee' },
      update: { value: String(Math.round(payoutFee)) },
      create: {
        key: 'payout_fee',
        value: String(Math.round(payoutFee)),
        label: 'Biaya Admin Penarikan Dana Payout',
      },
    });
    return {
      success: true,
      payoutFee: Number(updated.value),
      message: `Biaya admin penarikan berhasil diatur ke Rp ${new Intl.NumberFormat('id-ID').format(Number(updated.value))}`,
    };
  }

  async getAllWithdrawals(status?: string, page: number = 1, limit: number = 20) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as any;
    }
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true, slug: true, email: true, phone: true, qrisBalance: true },
          },
        },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

