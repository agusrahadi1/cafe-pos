import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Get('resolve/:slug')
  @ApiOperation({ summary: 'Publicly resolve tenant info, branding, and status by slug' })
  async resolveSlug(@Param('slug') slug: string) {
    return this.tenantsService.resolveSlug(slug);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant profile and quota usage' })
  async getProfile(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.tenantsService.getProfile(companyId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current tenant cafe profile and branding' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateTenantProfileDto) {
    return this.tenantsService.updateProfile(req.user.companyId, dto);
  }

  @Get('payout-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payout configuration, balance, and default bank' })
  async getPayoutConfig(@Request() req: any) {
    return this.tenantsService.getPayoutConfig(req.user.companyId);
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a withdrawal from QRIS sales balance' })
  async requestWithdrawal(@Request() req: any, @Body() dto: RequestWithdrawalDto) {
    return this.tenantsService.requestWithdrawal(req.user.companyId, req.user.id, dto);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List withdrawal requests for tenant' })
  async getWithdrawals(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tenantsService.getWithdrawals(
      req.user.companyId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('balance-mutations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List QRIS balance ledger mutations' })
  async getBalanceMutations(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tenantsService.getBalanceMutations(
      req.user.companyId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Post('subscription/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create BorderPay transaction for subscription renewal or upgrade' })
  async createSubscriptionCheckout(@Request() req: any, @Body() dto: any) {
    return this.tenantsService.createSubscriptionCheckout(req.user.companyId, req.user, dto);
  }

  @Post('subscription/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm subscription payment and activate plan' })
  async confirmSubscriptionPayment(@Request() req: any, @Body() dto: any) {
    return this.tenantsService.confirmSubscriptionPayment(req.user.companyId, dto);
  }

  @Get('subscription/status/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check SaaS subscription payment status by orderId' })
  async checkSubscriptionStatus(@Param('orderId') orderId: string) {
    return this.tenantsService.checkSubscriptionStatus(orderId);
  }
}

