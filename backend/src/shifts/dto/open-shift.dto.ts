import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OpenShiftDto {
  @ApiProperty({ description: 'Shift name (e.g. Shift Pagi, Shift Sore)', example: 'Shift Pagi' })
  @IsNotEmpty()
  @IsString()
  shiftName: string;

  @ApiProperty({ description: 'Initial cash amount in drawer', example: 100000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialCash: number;

  @ApiProperty({ description: 'Optional outletId if not from JWT', required: false })
  @IsOptional()
  @IsString()
  outletId?: string;
}

