import { PartialType } from '@nestjs/swagger';
import { CreateModifierGroupDto } from './create-modifier-group.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateModifierGroupDto extends PartialType(CreateModifierGroupDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}