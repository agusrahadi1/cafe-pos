import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RefundPaymentDto {
  @ApiProperty({ required: false, example: 25000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0.01)
  amount?: number;

  @ApiProperty({ example: 'Customer cancelled order' })
  @IsString()
  reason: string;
}