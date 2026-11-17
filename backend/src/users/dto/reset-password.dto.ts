import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}

