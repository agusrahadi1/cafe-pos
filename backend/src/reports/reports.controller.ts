import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private parseDates(dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
    let from: Date;
    let to: Date;

    if (dateFrom) {
      from = new Date(dateFrom);
      if (isNaN(from.getTime())) from = new Date();
      if (dateFrom.length <= 10) {
        from.setHours(0, 0, 0, 0);
      }
    } else {
      from = new Date();
      from.setHours(0, 0, 0, 0);
    }

    if (dateTo) {
      to = new Date(dateTo);
      if (isNaN(to.getTime())) to = new Date();
      if (dateTo.length <= 10) {
        to.setHours(23, 59, 59, 999);
      }
    } else {
      to = new Date(from);
      to.setHours(23, 59, 59, 999);
    }

    return { from, to };
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get dashboard summary' })
  async getDashboard(@Request() req: any) {
    return this.reportsService.getDashboardSummary(req.user.outletId);
  }

  @Get('sales')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getSales(@Request() req: any, @Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    const { from, to } = this.parseDates(dateFrom, dateTo);
    return this.reportsService.getSalesReport(req.user.outletId, from, to);
  }

  @Get('products')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get product performance report' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getProducts(@Request() req: any, @Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    const { from, to } = this.parseDates(dateFrom, dateTo);
    return this.reportsService.getProductReport(req.user.outletId, from, to);
  }

  @Get('payments')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get payment report' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getPayments(@Request() req: any, @Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    const { from, to } = this.parseDates(dateFrom, dateTo);
    return this.reportsService.getPaymentReport(req.user.outletId, from, to);
  }

  @Get('operational')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get operational report' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async getOperational(@Request() req: any, @Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    const { from, to } = this.parseDates(dateFrom, dateTo);
    return this.reportsService.getOperationalReport(req.user.outletId, from, to);
  }
}