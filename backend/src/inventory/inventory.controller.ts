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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SaveRecipeDto } from './dto/save-recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, StockMovementType } from '@prisma/client';

@ApiTags('Inventory & Recipes')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==========================================
  // UNITS OF MEASURE
  // ==========================================
  @Get('units')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Ambil daftar satuan bahan baku (UoM)' })
  async getUnits(@Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) throw new BadRequestException('Company ID tidak terdeteksi');
    return this.inventoryService.getUnits(companyId);
  }

  @Post('units')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Tambah satuan bahan baku baru' })
  async createUnit(@Request() req: any, @Body() dto: CreateUnitDto) {
    const companyId = req.user.companyId;
    if (!companyId) throw new BadRequestException('Company ID tidak terdeteksi');
    return this.inventoryService.createUnit(companyId, dto);
  }

  // ==========================================
  // INGREDIENTS
  // ==========================================
  @Get('ingredients')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Ambil master bahan baku beserta stok fisik outlet aktif' })
  async getIngredients(@Request() req: any) {
    const companyId = req.user.companyId;
    const outletId = req.user.outletId;
    if (!companyId || !outletId) throw new BadRequestException('Company ID atau Outlet ID tidak valid');
    return this.inventoryService.getIngredients(companyId, outletId);
  }

  @Post('ingredients')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Tambah bahan baku baru ke master data' })
  async createIngredient(@Request() req: any, @Body() dto: CreateIngredientDto) {
    const companyId = req.user.companyId;
    const outletId = req.user.outletId;
    if (!companyId || !outletId) throw new BadRequestException('Company ID atau Outlet ID tidak valid');
    return this.inventoryService.createIngredient(companyId, outletId, dto, req.user.id);
  }

  @Put('ingredients/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Perbarui master bahan baku' })
  async updateIngredient(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateIngredientDto
  ) {
    const companyId = req.user.companyId;
    if (!companyId) throw new BadRequestException('Company ID tidak terdeteksi');
    return this.inventoryService.updateIngredient(companyId, id, dto);
  }

  @Delete('ingredients/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Hapus / nonaktifkan bahan baku' })
  async deleteIngredient(@Request() req: any, @Param('id') id: string) {
    const companyId = req.user.companyId;
    if (!companyId) throw new BadRequestException('Company ID tidak terdeteksi');
    return this.inventoryService.deleteIngredient(companyId, id);
  }

  // ==========================================
  // STOCKS ADJUSTMENT & MOVEMENTS
  // ==========================================
  @Post('stocks/adjust')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Penyesuaian stok (Stok Masuk, Opname, Rusak/Waste)' })
  async adjustStock(@Request() req: any, @Body() dto: AdjustStockDto) {
    const outletId = req.user.outletId;
    if (!outletId) throw new BadRequestException('Outlet ID tidak terdeteksi');
    return this.inventoryService.adjustStock(outletId, req.user.id, dto);
  }

  @Get('movements')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Buku besar riwayat mutasi pergerakan stok' })
  @ApiQuery({ name: 'ingredientId', required: false })
  @ApiQuery({ name: 'type', enum: StockMovementType, required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMovements(
    @Request() req: any,
    @Query('ingredientId') ingredientId?: string,
    @Query('type') type?: StockMovementType,
    @Query('limit') limit?: number
  ) {
    const outletId = req.user.outletId;
    if (!outletId) throw new BadRequestException('Outlet ID tidak terdeteksi');
    return this.inventoryService.getStockMovements(outletId, {
      ingredientId,
      type,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('alerts')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.CASHIER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Peringatan stok menipis / habis di outlet aktif' })
  async getAlerts(@Request() req: any) {
    const outletId = req.user.outletId;
    if (!outletId) throw new BadRequestException('Outlet ID tidak terdeteksi');
    return this.inventoryService.getLowStockAlerts(outletId);
  }

  // ==========================================
  // RECIPES & COGS / HPP
  // ==========================================
  @Get('recipes')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Daftar resep per produk beserta kalkulasi HPP dan margin laba' })
  async getRecipes(@Request() req: any) {
    const outletId = req.user.outletId;
    if (!outletId) throw new BadRequestException('Outlet ID tidak terdeteksi');
    return this.inventoryService.getRecipes(outletId);
  }

  @Post('recipes')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Simpan / perbarui resep bahan untuk produk atau varian' })
  async saveRecipe(@Request() req: any, @Body() dto: SaveRecipeDto) {
    return this.inventoryService.saveRecipe(dto);
  }
}

