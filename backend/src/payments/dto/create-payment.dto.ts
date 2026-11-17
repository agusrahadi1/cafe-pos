import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.QRIS })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0.01)
  amount: number;
}