import { IsString, MinLength, MaxLength, IsOptional, IsNumber, IsDecimal, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateOutletDto {
  @ApiProperty({ example: 'Main Branch' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'MB01' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Code must contain only uppercase letters and numbers' })
  code: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ example: '+62211234567', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'outlet@mycafe.com', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ example: 'Asia/Jakarta', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'IDR', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ example: 11, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  taxRate?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  serviceCharge?: number;
}