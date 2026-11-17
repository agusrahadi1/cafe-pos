import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { TableStatus } from '@prisma/client';

@ApiTags('Tables')
@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // ============================================
  // PANGGIL PELAYAN (WAITER CALLS) ENDPOINTS
  // ============================================
  @Public()
  @Post('call-waiter')
  @ApiOperation({ summary: 'Customer call waiter (Public)' })
  async callWaiter(
    @Body('tableToken') tableToken?: string,
    @Body('tableId') tableId?: string,
    @Body('type') type?: string,
    @Body('notes') notes?: string,
  ) {
    return this.tablesService.callWaiter({ tableToken, tableId, type, notes });
  }

  @Public()
  @Get('call-status/:tableIdOrToken')
  @ApiOperation({ summary: 'Get active waiter call status for table (Public)' })
  async getTableCallStatus(@Param('tableIdOrToken') tableIdOrToken: string) {
    return this.tablesService.getTableCallStatus(tableIdOrToken);
  }

  @Get('waiter-calls')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Get active waiter calls for current outlet' })
  async getActiveWaiterCalls(@Request() req: any) {
    return this.tablesService.getActiveWaiterCalls(req.user.outletId);
  }

  @Put('waiter-calls/:callId/resolve')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Mark waiter call as resolved' })
  async resolveWaiterCall(@Request() req: any, @Param('callId') callId: string) {
    return this.tablesService.resolveWaiterCall(callId, req.user.outletId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new table' })
  async create(@Request() req: any, @Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto, req.user.outletId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all tables' })
  async findAll(@Request() req: any) {
    return this.tablesService.findAll(req.user.outletId);
  }

  @Post('clear-all')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Clear all occupied tables and complete delivered orders' })
  async clearAllTables(@Request() req: any) {
    return this.tablesService.clearAllTables(req.user.outletId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get table by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.tablesService.findById(id, req.user.outletId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update table' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, req.user.outletId, updateTableDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete table' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.tablesService.remove(id, req.user.outletId);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Update table status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: TableStatus,
  ) {
    return this.tablesService.updateStatus(id, req.user.outletId, status);
  }

  @Post(':id/clear')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER)
  @ApiOperation({ summary: 'Clear single table and complete delivered orders' })
  async clearTable(@Request() req: any, @Param('id') id: string) {
    return this.tablesService.clearTable(id, req.user.outletId);
  }

  @Post(':id/regenerate-qr')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Regenerate QR token for table' })
  async regenerateQrToken(@Request() req: any, @Param('id') id: string) {
    return this.tablesService.regenerateQrToken(id, req.user.outletId);
  }

  @Get(':id/orders')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get active orders for table' })
  async getActiveOrders(@Request() req: any, @Param('id') id: string) {
    return this.tablesService.getActiveOrders(id);
  }
}