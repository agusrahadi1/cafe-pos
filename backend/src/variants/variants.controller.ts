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
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Variants')
@Controller('products/:productId/variants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new variant for a product' })
  async create(@Param('productId') productId: string, @Body() createVariantDto: CreateVariantDto) {
    return this.variantsService.create(productId, createVariantDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all variants for a product' })
  async findAll(@Param('productId') productId: string) {
    return this.variantsService.findAll(productId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active variants for a product (public)' })
  async findActive(@Param('productId') productId: string) {
    return this.variantsService.findActive(productId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get variant by ID' })
  async findOne(@Param('id') id: string) {
    return this.variantsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update variant' })
  async update(@Param('id') id: string, @Body() updateVariantDto: UpdateVariantDto) {
    return this.variantsService.update(id, updateVariantDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete variant' })
  async remove(@Param('id') id: string) {
    return this.variantsService.remove(id);
  }

  @Put('reorder')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Reorder variants' })
  async reorder(@Param('productId') productId: string, @Body('variantIds') variantIds: string[]) {
    return this.variantsService.reorder(productId, variantIds);
  }
}