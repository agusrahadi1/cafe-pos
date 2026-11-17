import { IsString, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSubscriptionDto {
  @ApiProperty({ example: 'tenant-uuid-123' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: 'pro' })
  @IsString()
  planSlug: string;

  @ApiProperty({ example: 12, description: 'Duration in months' })
  @IsNumber()
  @Min(1)
  durationMonths: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiProperty({ example: 'Manual renewal by Superadmin', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

