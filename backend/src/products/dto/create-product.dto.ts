import { IsString, MinLength, MaxLength, IsOptional, IsNumber, IsDecimal, IsEnum, IsInt, Min, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'LATTE-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'Iced Latte' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Fresh espresso with cold milk', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 35000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 15000, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  costPrice?: number;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.AVAILABLE, required: false })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}