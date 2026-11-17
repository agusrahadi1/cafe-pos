import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ShiftStatus, OrderStatus, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cashier opens a new shift. Only 1 active shift per cashier allowed.
   */
  async openShift(cashierId: string, outletId: string, dto: OpenShiftDto) {
    // Check if cashier already has an open shift
    const existingOpenShift = await this.prisma.shift.findFirst({
      where: {
        cashierId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingOpenShift) {
      throw new ConflictException(
        `Anda masih memiliki shift aktif (${existingOpenShift.shiftName}) yang belum ditutup. Silakan tutup shift terlebih dahulu.`
      );
    }

    const initialCash = new Prisma.Decimal(dto.initialCash || 0);

    return this.prisma.shift.create({
      data: {
        cashierId,
        outletId,
        shiftName: dto.shiftName,
        initialCash,
        expectedCash: initialCash,
        status: ShiftStatus.OPEN,
      },
      include: {
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get active shift for cashier with real-time financial stats
   */
  async getCurrentShift(cashierId: string, outletId?: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        cashierId,
        ...(outletId && { outletId }),
        status: ShiftStatus.OPEN,
      },
      include: {
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!shift) {
      return null;
    }

    const summary = await this.calculateShiftTotals(shift.id, Number(shift.initialCash));
    return {
      ...shift,
      summary,
    };
  }

  /**
   * Live summary calculation of a shift before or during closing
   */
  async getShiftSummary(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    const summary = await this.calculateShiftTotals(shift.id, Number(shift.initialCash));
    return {
      shift,
      summary,
    };
  }

  /**
   * Helper to compute real-time totals from orders and payments
   */
  private async calculateShiftTotals(shiftId: string, initialCash: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      select: { outletId: true, startTime: true, endTime: true },
    });

    // Eligible orders in this shift:
    // 1. Orders directly linked to shiftId
    // 2. OR unassigned orders from the same outlet created during this shift's window (e.g. customer QR self-orders)
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { shiftId },
          ...(shift?.outletId
            ? [
                {
                  shiftId: null,
                  outletId: shift.outletId,
                  createdAt: {
                    gte: shift.startTime,
                    ...(shift.endTime ? { lte: shift.endTime } : {}),
                  },
                },
              ]
            : []),
        ],
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED],
        },
      },
      include: {
        payments: true,
      },
    });

    let totalSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalService = 0;
    let totalCash = 0;
    let totalNonCash = 0;

    const paymentBreakdown: Record<string, { count: number; total: number }> = {};

    for (const order of orders) {
      totalSales += Number(order.totalAmount || 0);
      totalDiscount += Number(order.discountAmount || 0);
      totalTax += Number(order.taxAmount || 0);
      totalService += Number(order.serviceChargeAmount || 0);

      const isSettledOrActive = (
        [
          OrderStatus.PAID,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ] as OrderStatus[]
      ).includes(order.status);

      // Prioritize PAID payments
      let validPayments = order.payments.filter((p) => p.status === PaymentStatus.PAID);

      // Fallback: If order is settled/active and has payment records, use them
      if (validPayments.length === 0 && isSettledOrActive && order.payments.length > 0) {
        validPayments = order.payments;
      }

      if (validPayments.length > 0) {
        for (const payment of validPayments) {
          const amount = Number(payment.amount || 0);
          const method = payment.method;

          // Record under exact method (e.g. BORDERPAY, CASH, DEBIT_CARD, etc.)
          if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { count: 0, total: 0 };
          }
          paymentBreakdown[method].count += 1;
          paymentBreakdown[method].total += amount;

          // BORDERPAY is the cafe's QRIS gateway. Rollup into QRIS breakdown for POS reports!
          if (method === PaymentMethod.BORDERPAY || payment.provider === 'borderpay') {
            if (!paymentBreakdown[PaymentMethod.QRIS]) {
              paymentBreakdown[PaymentMethod.QRIS] = { count: 0, total: 0 };
            }
            if (method !== PaymentMethod.QRIS) {
              paymentBreakdown[PaymentMethod.QRIS].count += 1;
              paymentBreakdown[PaymentMethod.QRIS].total += amount;
            }
          }

          if (method === PaymentMethod.CASH) {
            totalCash += amount;
          } else {
            totalNonCash += amount;
          }
        }
      } else if (isSettledOrActive) {
        // Fallback if no payment record at all
        const method = PaymentMethod.CASH;
        const amount = Number(order.totalAmount || 0);
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count += 1;
        paymentBreakdown[method].total += amount;
        totalCash += amount;
      }
    }

    const expectedCash = initialCash + totalCash;

    return {
      ordersCount: orders.length,
      totalSales,
      totalDiscount,
      totalTax,
      totalService,
      totalCash,
      totalNonCash,
      initialCash,
      expectedCash,
      paymentBreakdown,
    };
  }

  /**
   * Cashier closes the shift with cash reconciliation
   */
  async closeShift(shiftId: string, cashierId: string, dto: CloseShiftDto, isSuperOrAdmin = false) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    if (shift.status === ShiftStatus.CLOSED) {
      throw new BadRequestException('Shift ini sudah ditutup sebelumnya.');
    }

    if (!isSuperOrAdmin && shift.cashierId !== cashierId) {
      throw new BadRequestException('Anda hanya dapat menutup shift milik Anda sendiri.');
    }

    const initialCash = Number(shift.initialCash);
    const totals = await this.calculateShiftTotals(shiftId, initialCash);

    const actualCash = new Prisma.Decimal(dto.actualCash);
    const expectedCash = new Prisma.Decimal(totals.expectedCash);
    const cashDifference = new Prisma.Decimal(dto.actualCash - totals.expectedCash);

    // Retroactively link unassigned orders of this outlet created during this shift
    if (shift.outletId) {
      await this.prisma.order.updateMany({
        where: {
          shiftId: null,
          outletId: shift.outletId,
          createdAt: {
            gte: shift.startTime,
            lte: new Date(),
          },
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED],
          },
        },
        data: {
          shiftId: shift.id,
        },
      });
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.CLOSED,
        endTime: new Date(),
        ordersCount: totals.ordersCount,
        totalSales: new Prisma.Decimal(totals.totalSales),
        totalCash: new Prisma.Decimal(totals.totalCash),
        totalNonCash: new Prisma.Decimal(totals.totalNonCash),
        totalDiscount: new Prisma.Decimal(totals.totalDiscount),
        totalTax: new Prisma.Decimal(totals.totalTax),
        totalService: new Prisma.Decimal(totals.totalService),
        expectedCash,
        actualCash,
        cashDifference,
        notes: dto.notes || null,
      },
      include: {
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find all shifts (Admin / Manager view)
   */
  async findAll(outletId: string, query?: { status?: ShiftStatus; cashierId?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = { outletId };

    if (query?.status) {
      where.status = query.status;
    }
    if (query?.cashierId) {
      where.cashierId = query.cashierId;
    }
    if (query?.dateFrom || query?.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Shift detail by ID with associated orders
   */
  async findById(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        orders: {
          include: {
            table: true,
            payments: true,
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    const summary = await this.calculateShiftTotals(shift.id, Number(shift.initialCash));

    return {
      ...shift,
      summary,
    };
  }
}

