import { IsString, IsOptional, IsNumber, Min, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class AdjustStockDto {
  @ApiProperty({ description: 'ID Ingredient yang disesuaikan' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN_PURCHASE })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 1000, description: 'Jumlah perubahan stok atau nilai opname' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: false, description: 'Jika true, quantity diisi sebagai stok fisik akhir (Opname)', required: false })
  @IsOptional()
  @IsBoolean()
  isSetAbsolute?: boolean;

  @ApiProperty({ example: 250, description: 'Harga beli satuan saat stok masuk', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  unitCost?: number;

  @ApiProperty({ example: 'PO-2026-001', required: false })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ example: 'Pembelian 1 sak kopi biji 1kg', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

