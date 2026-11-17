import { IsString, IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionCheckoutDto {
  @ApiProperty({ example: 'pro', description: 'Slug paket: starter, pro, enterprise' })
  @IsString()
  planSlug: string;

  @ApiProperty({ example: 'MONTHLY', enum: ['MONTHLY', 'YEARLY'] })
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';
}

export class ConfirmSubscriptionPaymentDto {
  @ApiProperty({ example: 'SUB-democafe-123456789' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'pro' })
  @IsString()
  planSlug: string;

  @ApiProperty({ example: 1, description: 'Duration in months (1 or 12)' })
  @IsNumber()
  @Min(1)
  durationMonths: number;
}

