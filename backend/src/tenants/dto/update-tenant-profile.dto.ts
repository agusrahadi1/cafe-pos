import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiptFooter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  qrisImageUrl?: string;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  serviceCharge?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultBankCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultBankName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultAccountNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultAccountName?: string;
}

