import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QRCode, QRStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QrCodesService {
  constructor(private prisma: PrismaService) {}

  async generateForTable(tableId: string, outletId: string, baseUrl: string): Promise<QRCode> {
    // Check if table exists and belongs to outlet
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, outletId },
      include: { qrCode: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.qrCode) {
      throw new ConflictException('QR code already exists for this table. Use regenerate instead.');
    }

    const token = uuidv4();
    const url = `${baseUrl}/${token}`;

    return this.prisma.qRCode.create({
      data: {
        tableId,
        token,
        url,
        status: QRStatus.ACTIVE,
      },
    });
  }

  async findByTableId(tableId: string): Promise<QRCode | null> {
    return this.prisma.qRCode.findUnique({
      where: { tableId },
    });
  }

  async findByToken(token: string): Promise<QRCode | null> {
    return this.prisma.qRCode.findUnique({
      where: { token },
      include: {
        table: {
          include: {
            outlet: {
              include: { company: true },
            },
          },
        },
      },
    });
  }

  async regenerate(tableId: string, outletId: string, baseUrl: string): Promise<QRCode> {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, outletId },
      include: { qrCode: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const token = uuidv4();
    const url = `${baseUrl}/${token}`;

    if (table.qrCode) {
      return this.prisma.qRCode.update({
        where: { id: table.qrCode.id },
        data: {
          token,
          url,
          status: QRStatus.REGENERATED,
        },
      });
    }

    return this.prisma.qRCode.create({
      data: {
        tableId,
        token,
        url,
        status: QRStatus.ACTIVE,
      },
    });
  }

  async disable(tableId: string, outletId: string): Promise<QRCode> {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, outletId },
      include: { qrCode: true },
    });

    if (!table || !table.qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return this.prisma.qRCode.update({
      where: { id: table.qrCode.id },
      data: { status: QRStatus.DISABLED },
    });
  }

  async enable(tableId: string, outletId: string): Promise<QRCode> {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, outletId },
      include: { qrCode: true },
    });

    if (!table || !table.qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return this.prisma.qRCode.update({
      where: { id: table.qrCode.id },
      data: { status: QRStatus.ACTIVE },
    });
  }

  async validateToken(token: string) {
    const qrCode = await this.findByToken(token);

    if (!qrCode) {
      return { valid: false, reason: 'QR code not found' };
    }

    if (qrCode.status !== QRStatus.ACTIVE) {
      return { valid: false, reason: 'QR code is disabled' };
    }

    const tableWithOutlet = qrCode as unknown as { table: { isActive: boolean; outlet: any } };

    if (!tableWithOutlet.table.isActive) {
      return { valid: false, reason: 'Table is not active' };
    }

    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return { valid: false, reason: 'QR code has expired' };
    }

    return {
      valid: true,
      table: tableWithOutlet.table,
      outlet: tableWithOutlet.table.outlet,
      company: tableWithOutlet.table.outlet?.company || null,
    };
  }

  async getQrCodeData(tableId: string, outletId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, outletId },
      include: { qrCode: true },
    });

    if (!table || !table.qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return {
      token: table.qrCode.token,
      url: table.qrCode.url,
      status: table.qrCode.status,
      tableNumber: table.tableNumber,
      tableName: table.name,
    };
  }
}