import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperadminService } from './superadmin.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, TenantStatus } from '@prisma/client';

@ApiTags('Superadmin')
@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
@ApiBearerAuth()
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Platform-wide analytics (Total tenants, MRR, GMV)' })
  async getAnalytics() {
    return this.superadminService.getPlatformAnalytics();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants with search and status filter' })
  async getTenants(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.superadminService.getTenants(status, search);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details by ID' })
  async getTenantById(@Param('id') id: string) {
    return this.superadminService.getTenantById(id);
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Register a new tenant cafe with owner account and plan' })
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.superadminService.createTenant(dto);
  }

  @Put('tenants/:id')
  @ApiOperation({ summary: 'Update tenant information' })
  async updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.superadminService.updateTenant(id, dto);
  }

  @Put('tenants/:id/status')
  @ApiOperation({ summary: 'Suspend or activate tenant immediately' })
  async toggleTenantStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
  ) {
    return this.superadminService.toggleTenantStatus(id, status);
  }

  @Post('tenants/:id/reset-password')
  @ApiOperation({ summary: 'Reset owner password for tenant' })
  async resetOwnerPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.superadminService.resetOwnerPassword(id, password);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans and quotas' })
  async getPlans() {
    return this.superadminService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.superadminService.createPlan(dto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.superadminService.updatePlan(id, dto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all tenant subscriptions' })
  async getSubscriptions() {
    return this.superadminService.getSubscriptions();
  }

  @Post('subscriptions/assign')
  @ApiOperation({ summary: 'Assign or renew tenant subscription' })
  async assignSubscription(@Body() dto: AssignSubscriptionDto) {
    return this.superadminService.assignSubscription(dto);
  }

  @Post('tenants/:id/impersonate')
  @ApiOperation({ summary: 'Impersonate a tenant admin/owner' })
  async impersonateTenant(@Param('id') id: string) {
    return this.superadminService.impersonateTenant(id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get system-wide audit logs with filters' })
  async getAuditLogs(@Query() filters: any) {
    return this.superadminService.getGlobalAuditLogs(filters);
  }

  @Get('server-health')
  @ApiOperation({ summary: 'Get server, memory, and database health metrics' })
  async getServerHealth() {
    return this.superadminService.getServerHealth();
  }

  @Post('database/backup')
  @ApiOperation({ summary: 'Trigger a manual database snapshot backup' })
  async triggerDatabaseBackup() {
    return this.superadminService.triggerDatabaseBackup();
  }

  @Get('payout-settings')
  @ApiOperation({ summary: 'Get payout fee settings' })
  async getPayoutSettings() {
    return this.superadminService.getPayoutSettings();
  }

  @Put('payout-settings')
  @ApiOperation({ summary: 'Update payout fee setting' })
  async updatePayoutSettings(@Body('payoutFee') payoutFee: number) {
    return this.superadminService.updatePayoutSettings(payoutFee);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get all withdrawals platform-wide' })
  async getWithdrawals(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superadminService.getAllWithdrawals(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}

