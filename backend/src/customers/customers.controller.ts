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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('sessions')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Create customer session for a table' })
  async createSession(
    @Body('tableId') tableId: string,
    @Body('customerName') customerName?: string,
    @Body('phone') phone?: string,
  ) {
    return this.customersService.createSession(tableId, customerName, phone);
  }

  @Get('sessions/:token')
  @ApiOperation({ summary: 'Get session by token (public for customer)' })
  async getSessionByToken(@Param('token') token: string) {
    return this.customersService.findSessionByToken(token);
  }

  @Get('tables/:tableId/session')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Get active session for a table' })
  async getActiveSession(@Param('tableId') tableId: string) {
    return this.customersService.findActiveSessionByTable(tableId);
  }

  @Put('sessions/:id/activity')
  @ApiOperation({ summary: 'Update session last activity (public)' })
  async updateActivity(@Param('id') id: string) {
    return this.customersService.updateSessionActivity(id);
  }

  @Put('sessions/:id/end')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'End customer session' })
  async endSession(@Param('id') id: string) {
    return this.customersService.endSession(id);
  }

  @Get('sessions/:id/orders')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Get orders for a session' })
  async getSessionOrders(@Param('id') id: string) {
    return this.customersService.getSessionOrders(id);
  }

  @Post('sessions/cleanup')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Cleanup expired sessions' })
  async cleanupSessions() {
    return this.customersService.cleanupExpiredSessions();
  }
}