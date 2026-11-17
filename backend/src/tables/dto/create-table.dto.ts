import { IsString, MinLength, MaxLength, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ example: 'T01' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  tableNumber: string;

  @ApiProperty({ example: 'Table 1', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}