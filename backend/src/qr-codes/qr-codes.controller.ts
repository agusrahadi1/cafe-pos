import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QrCodesService } from './qr-codes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@ApiTags('QR Codes')
@Controller('qr-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QrCodesController {
  constructor(
    private readonly qrCodesService: QrCodesService,
    private configService: ConfigService,
  ) {}

  private resolveQrBaseUrl(req: any): string {
    const origin = req?.headers?.origin;
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return `${origin}/order`;
    }
    if (req?.headers?.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        if (parsed.host && !parsed.host.includes('localhost') && !parsed.host.includes('127.0.0.1')) {
          return `${parsed.protocol}//${parsed.host}/order`;
        }
      } catch {}
    }
    return this.configService.get<string>('QR_BASE_URL') || 'http://localhost:5001/order';
  }

  @Post('tables/:tableId/generate')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Generate QR code for a table' })
  async generate(@Request() req: any, @Param('tableId') tableId: string) {
    const baseUrl = this.resolveQrBaseUrl(req);
    return this.qrCodesService.generateForTable(tableId, req.user.outletId, baseUrl);
  }

  @Get('tables/:tableId')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get QR code for a table' })
  async findByTable(@Request() req: any, @Param('tableId') tableId: string) {
    return this.qrCodesService.findByTableId(tableId);
  }

  @Post('tables/:tableId/regenerate')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Regenerate QR code for a table' })
  async regenerate(@Request() req: any, @Param('tableId') tableId: string) {
    const baseUrl = this.resolveQrBaseUrl(req);
    return this.qrCodesService.regenerate(tableId, req.user.outletId, baseUrl);
  }

  @Put('tables/:tableId/disable')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Disable QR code for a table' })
  async disable(@Request() req: any, @Param('tableId') tableId: string) {
    return this.qrCodesService.disable(tableId, req.user.outletId);
  }

  @Put('tables/:tableId/enable')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Enable QR code for a table' })
  async enable(@Request() req: any, @Param('tableId') tableId: string) {
    return this.qrCodesService.enable(tableId, req.user.outletId);
  }

  @Public()
  @Get('validate/:token')
  @ApiOperation({ summary: 'Validate QR code token (public endpoint)' })
  async validateToken(@Param('token') token: string) {
    return this.qrCodesService.validateToken(token);
  }

  @Get('tables/:tableId/data')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get QR code data for printing' })
  async getQrCodeData(@Request() req: any, @Param('tableId') tableId: string) {
    return this.qrCodesService.getQrCodeData(tableId, req.user.outletId);
  }
}