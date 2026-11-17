import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModifierGroupDto {
  @ApiProperty({ example: 'Sugar Level' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'Choose your sugar level', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}