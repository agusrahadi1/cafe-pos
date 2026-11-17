import { IsString, MinLength, MaxLength, IsOptional, IsNumber, Min, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateIngredientDto {
  @ApiProperty({ example: 'Biji Kopi Arabika House Blend', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

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

  @ApiProperty({ description: 'ID UnitOfMeasure', required: false })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty({ example: 250, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  costPerUnit?: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  minStockAlert?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

