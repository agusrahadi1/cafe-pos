import { IsString, MinLength, MaxLength, IsEmail, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Kopi Senja' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'kopi-senja' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must only contain lowercase alphanumeric characters and single hyphens (e.g. kopi-senja)',
  })
  slug: string;

  @ApiProperty({ example: 'Tempat ngopi santai di sore hari', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiProperty({ example: 'Jl. Melawai Raya No. 10, Jakarta Selatan', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+6281234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @MinLength(2)
  ownerFullName: string;

  @ApiProperty({ example: 'owner@kopisenja.com' })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  ownerPassword: string;

  @ApiProperty({ example: 'starter', description: 'Plan slug: starter, pro, enterprise' })
  @IsString()
  planSlug: string;
}

