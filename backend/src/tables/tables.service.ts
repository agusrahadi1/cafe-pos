import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Table, TableStatus, OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  private getQrBaseUrl(): string {
    if (process.env.QR_BASE_URL) {
      return process.env.QR_BASE_URL.replace(/\/+$/, '');
    }
    if (process.env.FRONTEND_URL) {
      return `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/order`;
    }
    return 'http://localhost:5001/order';
  }

  async create(createTableDto: CreateTableDto, outletId: string): Promise<Table> {
    const existingTable = await this.prisma.table.findFirst({
      where: {
        outletId,
        tableNumber: createTableDto.tableNumber,
      },
    });

    if (existingTable) {
      throw new ConflictException('Table number already exists in this outlet');
    }

    const qrToken = uuidv4();
    const qrBaseUrl = this.getQrBaseUrl();

    return this.prisma.table.create({
      data: {
        ...createTableDto,
        outletId,
        qrToken,
        qrCode: {
          create: {
            token: qrToken,
            url: `${qrBaseUrl}/${qrToken}`,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        qrCode: true,
      },
    });
  }

  async findAll(outletId: string): Promise<Table[]> {
    return this.prisma.table.findMany({
      where: { outletId },
      orderBy: { tableNumber: 'asc' },
      include: {
        qrCode: true,
        _count: {
          select: { orders: true, sessions: true },
        },
      },
    });
  }

  async findById(id: string, outletId: string): Promise<Table | null> {
    return this.prisma.table.findFirst({
      where: { id, outletId },
      include: {
        qrCode: true,
        orders: {
          where: {
            status: {
              in: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        sessions: {
          where: { isActive: true },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findByQrToken(qrToken: string): Promise<Table | null> {
    return this.prisma.table.findFirst({
      where: { qrToken, isActive: true },
      include: {
        outlet: true,
        qrCode: true,
      },
    });
  }

  async update(id: string, outletId: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const table = await this.findById(id, outletId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (updateTableDto.tableNumber && updateTableDto.tableNumber !== table.tableNumber) {
      const existingTable = await this.prisma.table.findFirst({
        where: {
          outletId,
          tableNumber: updateTableDto.tableNumber,
          NOT: { id },
        },
      });

      if (existingTable) {
        throw new ConflictException('Table number already exists');
      }
    }

    return this.prisma.table.update({
      where: { id },
      data: updateTableDto,
    });
  }

  async remove(id: string, outletId: string): Promise<Table> {
    const table = await this.findById(id, outletId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, outletId: string, status: TableStatus): Promise<Table> {
    const table = await this.findById(id, outletId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (status === TableStatus.AVAILABLE) {
      // Auto-complete any dangling delivered orders on this table
      await this.prisma.order.updateMany({
        where: {
          tableId: id,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY] },
        },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  async clearTable(id: string, outletId: string): Promise<Table> {
    const table = await this.findById(id, outletId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // Complete any active orders on this table that are already delivered or ready
    await this.prisma.order.updateMany({
      where: {
        tableId: id,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY] },
      },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return this.prisma.table.update({
      where: { id },
      data: { status: TableStatus.AVAILABLE },
    });
  }

  async clearAllTables(outletId: string): Promise<{ message: string; count: number }> {
    const tables = await this.prisma.table.findMany({
      where: { outletId },
      select: { id: true },
    });
    const tableIds = tables.map((t) => t.id);

    if (tableIds.length > 0) {
      await this.prisma.order.updateMany({
        where: {
          outletId,
          tableId: { in: tableIds },
          status: { in: [OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY] },
        },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      const updated = await this.prisma.table.updateMany({
        where: { outletId },
        data: { status: TableStatus.AVAILABLE },
      });

      return { message: 'Semua meja berhasil dikosongkan', count: updated.count };
    }

    return { message: 'Tidak ada meja ditemukan', count: 0 };
  }

  async regenerateQrToken(id: string, outletId: string): Promise<Table> {
    const table = await this.findById(id, outletId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const qrToken = uuidv4();
    const qrBaseUrl = this.getQrBaseUrl();

    await this.prisma.qRCode.upsert({
      where: { tableId: id },
      create: {
        tableId: id,
        token: qrToken,
        url: `${qrBaseUrl}/${qrToken}`,
        status: 'ACTIVE',
      },
      update: {
        token: qrToken,
        url: `${qrBaseUrl}/${qrToken}`,
        status: 'ACTIVE',
      },
    });

    return this.prisma.table.update({
      where: { id },
      data: { qrToken },
      include: { qrCode: true },
    });
  }

  async getActiveOrders(tableId: string) {
    return this.prisma.order.findMany({
      where: {
        tableId,
        status: {
          in: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  // ==========================================
  // WAITER CALL SYSTEM (PANGGIL PELAYAN)
  // ==========================================
  private waiterCalls: Array<{
    id: string;
    tableId: string;
    tableNumber: string;
    tableName?: string;
    outletId: string;
    type: string;
    notes?: string;
    createdAt: Date;
    status: 'PENDING' | 'RESOLVED';
  }> = [];

  async callWaiter(params: {
    tableToken?: string;
    tableId?: string;
    type?: string;
    notes?: string;
  }) {
    let table = null;

    if (params.tableToken) {
      table = await this.prisma.table.findFirst({
        where: {
          OR: [
            { qrToken: params.tableToken },
            { qrCode: { token: params.tableToken } },
          ],
        },
        include: { outlet: true },
      });
    } else if (params.tableId) {
      table = await this.prisma.table.findUnique({
        where: { id: params.tableId },
        include: { outlet: true },
      });
    }

    if (!table) {
      throw new NotFoundException('Meja tidak ditemukan atau kode tidak valid');
    }

    // Check if there is already a pending call for this table within the last 2 minutes
    const existingCall = this.waiterCalls.find(
      (c) => c.tableId === table.id && c.status === 'PENDING'
    );

    if (existingCall) {
      return {
        success: true,
        isExisting: true,
        message: `Panggilan untuk Meja ${table.tableNumber} sudah aktif. Pelayan sedang menuju ke meja Anda!`,
        call: existingCall,
      };
    }

    const newCall = {
      id: uuidv4(),
      tableId: table.id,
      tableNumber: table.tableNumber,
      tableName: table.name || undefined,
      outletId: table.outletId,
      type: params.type || 'CALL_WAITER',
      notes: params.notes || undefined,
      createdAt: new Date(),
      status: 'PENDING' as const,
    };

    this.waiterCalls.unshift(newCall);

    // Keep max 100 recent calls in memory
    if (this.waiterCalls.length > 100) {
      this.waiterCalls = this.waiterCalls.slice(0, 100);
    }

    return {
      success: true,
      isExisting: false,
      message: `Pelayan berhasil dipanggil ke Meja ${table.tableNumber}!`,
      call: newCall,
    };
  }

  async getActiveWaiterCalls(outletId: string) {
    return this.waiterCalls.filter(
      (c) => c.outletId === outletId && c.status === 'PENDING'
    );
  }

  async resolveWaiterCall(callId: string, outletId: string) {
    const call = this.waiterCalls.find((c) => c.id === callId && c.outletId === outletId);
    if (call) {
      call.status = 'RESOLVED';
      return { success: true, message: 'Panggilan pelayan telah diselesaikan.' };
    }
    return { success: false, message: 'Panggilan tidak ditemukan atau sudah selesai.' };
  }

  async getTableCallStatus(tableIdOrToken: string) {
    const table = await this.prisma.table.findFirst({
      where: {
        OR: [
          { id: tableIdOrToken },
          { qrToken: tableIdOrToken },
          { qrCode: { token: tableIdOrToken } },
        ],
      },
    });

    if (!table) return null;

    const activeCall = this.waiterCalls.find(
      (c) => c.tableId === table.id && c.status === 'PENDING'
    );
    return activeCall || null;
  }
}