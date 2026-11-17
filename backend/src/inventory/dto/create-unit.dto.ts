import { IsString, MinLength, MaxLength, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUnitDto {
  @ApiProperty({ example: 'Gram' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'g' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol: string;

  @ApiProperty({ example: 'g', required: false })
  @IsOptional()
  @IsString()
  baseUnit?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0.0001)
  conversionFactor?: number;
}

