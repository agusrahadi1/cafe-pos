import { PartialType } from '@nestjs/swagger';
import { CreateTableDto } from './create-table.dto';
import { IsOptional } from 'class-validator';
import { TableStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @ApiProperty({ enum: TableStatus, required: false })
  @IsOptional()
  status?: TableStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}