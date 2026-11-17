import { IsString, MinLength, MaxLength, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @ApiProperty({ example: 'Paket menengah untuk kafe berkembang', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 199000 })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiProperty({ example: 1990000 })
  @IsNumber()
  @Min(0)
  priceYearly: number;

  @ApiProperty({ example: 100, description: '-1 for unlimited' })
  @IsNumber()
  maxProducts: number;

  @ApiProperty({ example: 10, description: '-1 for unlimited' })
  @IsNumber()
  maxStaffAccounts: number;

  @ApiProperty({ example: ['100 Menu', '10 Staf'], required: false })
  @IsOptional()
  features?: any;
}

