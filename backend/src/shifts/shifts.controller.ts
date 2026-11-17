import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ShiftStatus } from '@prisma/client';

@ApiTags('Shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Open a new cashier shift' })
  async openShift(@Request() req: any, @Body() dto: OpenShiftDto) {
    const userId = req.user.id || req.user.sub;
    const outletId = dto.outletId || req.user.outletId;
    return this.shiftsService.openShift(userId, outletId, dto);
  }

  @Get('current')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get current active shift for logged in user' })
  async getCurrentShift(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.shiftsService.getCurrentShift(userId, req.user.outletId);
  }

  @Get(':id/summary')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get real-time summary for a shift' })
  async getShiftSummary(@Param('id') id: string) {
    return this.shiftsService.getShiftSummary(id);
  }

  @Post(':id/close')
  @Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Close shift with cash drawer reconciliation' })
  async closeShift(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CloseShiftDto
  ) {
    const userId = req.user.id || req.user.sub;
    const isSuperOrAdmin =
      req.user.role === UserRole.SUPERADMIN ||
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.OWNER;
    return this.shiftsService.closeShift(id, userId, dto, isSuperOrAdmin);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all shifts for the outlet' })
  @ApiQuery({ name: 'status', required: false, enum: ShiftStatus })
  @ApiQuery({ name: 'cashierId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Request() req: any,
    @Query('status') status?: ShiftStatus,
    @Query('cashierId') cashierId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.shiftsService.findAll(req.user.outletId, {
      status,
      cashierId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get shift detail by ID' })
  async findOne(@Param('id') id: string) {
    return this.shiftsService.findById(id);
  }
}
