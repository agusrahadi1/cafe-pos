import { IsString, MinLength, MaxLength, IsOptional, IsNumber, IsDecimal, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateVariantDto {
  @ApiProperty({ example: 'Large' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  price: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}