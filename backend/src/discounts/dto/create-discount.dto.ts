import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType, DiscountScope } from '@prisma/client';

export class CreateDiscountDto {
  @ApiProperty({ example: 'Diskon Launching Cafe 20%' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Promo peluncuran kafe baru untuk semua menu', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: 'LAUNCH20', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ enum: DiscountType, default: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 20, description: 'Percentage (e.g. 20) or fixed amount in Rp (e.g. 5000)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ enum: DiscountScope, default: DiscountScope.ALL_ITEMS })
  @IsEnum(DiscountScope)
  scope: DiscountScope;

  @ApiProperty({ example: 50000, required: false, description: 'Minimum subtotal to apply discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ example: 20000, required: false, description: 'Max discount amount in Rp if percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ required: false, example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, example: '2026-10-01T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: ['prod-uuid-1', 'prod-uuid-2'], required: false, description: 'List of product IDs when scope is SPECIFIC_PRODUCTS' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}

