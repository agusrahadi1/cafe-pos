import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  oldPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  newPassword: string;
}