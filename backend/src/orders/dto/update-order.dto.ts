import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}