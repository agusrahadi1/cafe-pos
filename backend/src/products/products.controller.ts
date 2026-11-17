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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { ProductStatus } from '@prisma/client';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new product' })
  async create(@Request() req: any, @Body() createProductDto: CreateProductDto) {
    const outletId = req.user?.outletId || (createProductDto as any).outletId;
    return this.productsService.create(createProductDto, outletId, req.user?.companyId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findAll(
    @Request() req: any,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('outletId') queryOutletId?: string,
  ) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.productsService.findAll(outletId, req.user?.companyId, includeInactive);
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get active products (public for customers)' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findActive(@Request() req: any, @Query('outletId') queryOutletId?: string) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.productsService.findActive(outletId, req.user?.companyId);
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findByCategory(
    @Request() req: any,
    @Param('categoryId') categoryId: string,
    @Query('outletId') queryOutletId?: string,
  ) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.productsService.findByCategory(outletId, categoryId, req.user?.companyId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findOne(@Request() req: any, @Param('id') id: string, @Query('outletId') queryOutletId?: string) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.productsService.findById(id, outletId, req.user?.companyId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, req.user.outletId, updateProductDto, req.user?.companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete product' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.productsService.remove(id, req.user.outletId, req.user?.companyId);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Update product status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
  ) {
    return this.productsService.updateStatus(id, req.user.outletId, status, req.user?.companyId);
  }

  @Put('reorder')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Reorder products' })
  async reorder(@Request() req: any, @Body('productIds') productIds: string[]) {
    return this.productsService.reorder(req.user.outletId, productIds, req.user?.companyId);
  }
}