import { PartialType } from '@nestjs/swagger';
import { CreateOutletDto } from './create-outlet.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOutletDto extends PartialType(CreateOutletDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}