import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CloseShiftDto {
  @ApiProperty({ description: 'Actual cash amount physically counted in drawer', example: 1250000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualCash: number;

  @ApiProperty({ description: 'Shift closing notes / remarks', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

