import { IsString, MinLength, MaxLength, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Biji Kopi Arabika House Blend' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ING-KOP-001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiProperty({ example: 'Kopi & Teh', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ description: 'ID UnitOfMeasure' })
  @IsUUID()
  unitId: string;

  @ApiProperty({ example: 250, description: 'Biaya beli per satuan (HPP)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  costPerUnit?: number;

  @ApiProperty({ example: 500, description: 'Ambang batas peringatan stok menipis' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  minStockAlert?: number;

  @ApiProperty({ example: 1000, description: 'Stok awal di outlet aktif (opsional)', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  initialStock?: number;
}

