import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, OrderStatus, PaymentMethod } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new order (manual POS or QR customer)' })
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto, req.user?.outletId, req.user?.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all orders with filters' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'tableId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(@Request() req: any, @Query() filters: any) {
    return this.ordersService.findAll(req.user.outletId, filters);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get dashboard data for cashier' })
  async getDashboard(@Request() req: any) {
    return this.ordersService.getDashboardData(req.user.outletId);
  }

  @Get('kitchen')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.KITCHEN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get orders for kitchen display' })
  async getKitchenOrders(@Request() req: any) {
    return this.ordersService.getKitchenOrders(req.user.outletId);
  }

  @Get('waiter')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.WAITER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get orders for waiter' })
  async getWaiterOrders(@Request() req: any) {
    return this.ordersService.getWaiterOrders(req.user.outletId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (public for customer status page)' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findById(id, req.user?.outletId);
  }

  @Get('number/:orderNumber')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get order by order number' })
  async findByOrderNumber(@Request() req: any, @Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber, req.user.outletId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Update order (only for DRAFT/PENDING_PAYMENT)' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, req.user.outletId, updateOrderDto, req.user.sub);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.KITCHEN, UserRole.WAITER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.updateStatus(id, req.user.outletId, status, req.user.sub, reason);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Cancel order' })
  async cancel(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancel(id, req.user.outletId, reason, req.user.sub);
  }
}