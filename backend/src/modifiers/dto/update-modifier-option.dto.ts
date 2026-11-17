import { PartialType } from '@nestjs/swagger';
import { CreateModifierOptionDto } from './create-modifier-option.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateModifierOptionDto extends PartialType(CreateModifierOptionDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}