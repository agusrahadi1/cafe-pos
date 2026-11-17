import { PartialType } from '@nestjs/swagger';
import { CreateVariantDto } from './create-variant.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVariantDto extends PartialType(CreateVariantDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}