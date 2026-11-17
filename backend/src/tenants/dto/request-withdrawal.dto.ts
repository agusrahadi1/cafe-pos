import { IsNumber, IsString, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestWithdrawalDto {
  @ApiProperty({ description: 'Nominal penarikan dana', example: 500000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(10000)
  amount: number;

  @ApiProperty({ description: 'Kode Bank (misal: BCA, BRI, MANDIRI, BNI)', example: 'BCA' })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: 'Nama Bank Lengkap', example: 'Bank Central Asia' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ description: 'Nomor Rekening Tujuan', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Nama Pemilik Rekening', example: 'Kopi Kenangan' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty({ description: 'Simpan rekening ini sebagai rekening default', required: false, example: true })
  @IsOptional()
  saveAsDefault?: boolean;

  @ApiProperty({ description: 'Catatan tambahan penarikan', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
