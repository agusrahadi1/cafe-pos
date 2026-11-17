import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new discount or promo' })
  async create(@Request() req: any, @Body() createDiscountDto: CreateDiscountDto) {
    const outletId = req.user?.outletId || req.body?.outletId;
    return this.discountsService.create(createDiscountDto, outletId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all discounts for outlet' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findAll(@Request() req: any, @Query('outletId') queryOutletId?: string) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.discountsService.findAll(outletId, req.user?.companyId);
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get active discounts (public for customer QR menu and POS)' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findActive(@Request() req: any, @Query('outletId') queryOutletId?: string) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.discountsService.findActive(outletId, req.user?.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get discount by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.discountsService.findById(id, req.user?.outletId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update discount' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto
  ) {
    return this.discountsService.update(id, req.user?.outletId, updateDiscountDto);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Quick toggle active status of discount' })
  async toggleStatus(@Request() req: any, @Param('id') id: string) {
    return this.discountsService.toggleStatus(id, req.user?.outletId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete discount' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.discountsService.remove(id, req.user?.outletId);
  }
}

