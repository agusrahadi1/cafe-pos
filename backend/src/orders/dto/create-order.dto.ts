import { IsArray, ValidateNested, IsOptional, IsString, IsUUID, IsEnum, IsNumber, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderItemModifierDto {
  @ApiProperty()
  @IsUUID()
  modifierGroupId: string;

  @ApiProperty()
  @IsUUID()
  modifierOptionId: string;
}

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, type: [CreateOrderItemModifierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  customerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.QRIS })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}