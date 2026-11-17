import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(outletId: string, dateFrom: Date, dateTo: Date) {
    const where = {
      outletId,
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED] },
    };

    const cancelledWhere = {
      outletId,
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { in: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED] },
    };

    const [orders, aggregates, avgOrder, cancelledCount, cancelledAgg, byDayRaw] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: {
          totalAmount: true,
          subtotal: true,
          discountAmount: true,
          taxAmount: true,
          serviceChargeAmount: true,
        },
      }),
      this.prisma.order.aggregate({ where, _avg: { totalAmount: true } }),
      this.prisma.order.count({ where: cancelledWhere }),
      this.prisma.order.aggregate({ where: cancelledWhere, _sum: { totalAmount: true } }),
      this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM-DD') as date, 
          COUNT(*)::int as orders, 
          COALESCE(SUM("totalAmount"), 0)::numeric as revenue,
          COALESCE(SUM("subtotal"), 0)::numeric as subtotal,
          COALESCE(SUM("discountAmount"), 0)::numeric as discount,
          COALESCE(SUM("taxAmount"), 0)::numeric as tax,
          COALESCE(SUM("serviceChargeAmount"), 0)::numeric as service
        FROM "orders"
        WHERE "outletId" = ${outletId}
          AND "createdAt" >= ${dateFrom}
          AND "createdAt" <= ${dateTo}
          AND "status" NOT IN ('CANCELLED', 'PAYMENT_FAILED', 'EXPIRED')
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date ASC
      `,
    ]);

    const byDay = (byDayRaw as any[]).map((d) => ({
      date: d.date,
      orders: Number(d.orders || 0),
      revenue: Number(d.revenue || 0),
      subtotal: Number(d.subtotal || 0),
      discount: Number(d.discount || 0),
      tax: Number(d.tax || 0),
      service: Number(d.service || 0),
    }));

    return {
      ordersCount: orders,
      totalOrders: orders,
      revenue: Number(aggregates._sum.totalAmount || 0),
      totalRevenue: Number(aggregates._sum.totalAmount || 0),
      grossSales: Number(aggregates._sum.subtotal || 0),
      totalDiscount: Number(aggregates._sum.discountAmount || 0),
      totalTax: Number(aggregates._sum.taxAmount || 0),
      totalService: Number(aggregates._sum.serviceChargeAmount || 0),
      averageOrderValue: Number(avgOrder._avg.totalAmount || 0),
      cancelledOrdersCount: cancelledCount,
      cancelledRevenue: Number(cancelledAgg._sum.totalAmount || 0),
      byDay,
    };
  }

  async getProductReport(outletId: string, dateFrom: Date, dateTo: Date) {
    const result = await this.prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(c.name, 'Tanpa Kategori') as category,
        COALESCE(SUM(oi.quantity), 0)::int as quantity_sold,
        COALESCE(SUM(oi."totalPrice"), 0)::numeric as revenue,
        COALESCE(AVG(oi."unitPrice"), 0)::numeric as avg_price
      FROM "order_items" oi
      JOIN "orders" o ON oi."orderId" = o.id
      JOIN "products" p ON oi."productId" = p.id
      LEFT JOIN "categories" c ON p."categoryId" = c.id
      WHERE o."outletId" = ${outletId}
        AND o."createdAt" >= ${dateFrom}
        AND o."createdAt" <= ${dateTo}
        AND o."status" NOT IN ('CANCELLED', 'PAYMENT_FAILED', 'EXPIRED')
      GROUP BY p.id, p.name, p.sku, c.name
      ORDER BY quantity_sold DESC
    `;

    return (result as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      category: r.category,
      quantity_sold: Number(r.quantity_sold || 0),
      revenue: Number(r.revenue || 0),
      avg_price: Number(r.avg_price || 0),
    }));
  }

  async getPaymentReport(outletId: string, dateFrom: Date, dateTo: Date) {
    const where = {
      outletId,
      createdAt: { gte: dateFrom, lte: dateTo },
    };

    const [byMethod, byStatus, total] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { ...where, status: PaymentStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = Number(total._sum.amount || 0);

    return {
      byMethod: byMethod.map((m) => {
        const amount = Number(m._sum.amount || 0);
        return {
          method: m.method,
          count: m._count.id,
          total: amount,
          percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
        };
      }),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        total: Number(s._sum.amount || 0),
      })),
      totalRevenue,
    };
  }

  async getOperationalReport(outletId: string, dateFrom: Date, dateTo: Date) {
    const where = {
      outletId,
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED] },
    };

    const [prepTimes, deliveryTimes, completionTimes] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("confirmedAt" - "createdAt"))/60) as avg_prep_minutes
        FROM "orders"
        WHERE "outletId" = ${outletId}
          AND "createdAt" >= ${dateFrom}
          AND "createdAt" <= ${dateTo}
          AND "confirmedAt" IS NOT NULL
          AND "status" NOT IN ('CANCELLED', 'PAYMENT_FAILED', 'EXPIRED')
      `,
      this.prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "confirmedAt"))/60) as avg_completion_minutes
        FROM "orders"
        WHERE "outletId" = ${outletId}
          AND "createdAt" >= ${dateFrom}
          AND "createdAt" <= ${dateTo}
          AND "completedAt" IS NOT NULL
          AND "status" NOT IN ('CANCELLED', 'PAYMENT_FAILED', 'EXPIRED')
      `,
      this.prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt"))/60) as avg_total_minutes,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("completedAt" - "createdAt"))/60) as median_total_minutes
        FROM "orders"
        WHERE "outletId" = ${outletId}
          AND "createdAt" >= ${dateFrom}
          AND "createdAt" <= ${dateTo}
          AND "completedAt" IS NOT NULL
          AND "status" NOT IN ('CANCELLED', 'PAYMENT_FAILED', 'EXPIRED')
      `,
    ]);

    const prepList = prepTimes as any[];
    const deliveryList = deliveryTimes as any[];
    const completionList = completionTimes as any[];

    return {
      averagePreparationTime: prepList[0]?.avg_prep_minutes || 0,
      averageCompletionTime: deliveryList[0]?.avg_completion_minutes || 0,
      averageTotalTime: completionList[0]?.avg_total_minutes || 0,
      medianTotalTime: completionList[0]?.median_total_minutes || 0,
    };
  }

  async getDashboardSummary(outletId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats, weekStats, monthStats, topProducts] = await Promise.all([
      this.getSalesReport(outletId, today, tomorrow),
      this.getSalesReport(outletId, new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), tomorrow),
      this.getSalesReport(outletId, new Date(today.getFullYear(), today.getMonth(), 1), tomorrow),
      this.prisma.$queryRaw`
        SELECT p.name, SUM(oi.quantity) as quantity
        FROM "order_items" oi
        JOIN "orders" o ON oi."orderId" = o.id
        JOIN "products" p ON oi."productId" = p.id
        WHERE o."outletId" = ${outletId}
          AND o."createdAt" >= ${today}
          AND o."status" NOT IN ('CANCELLED', 'PAYMENT_FAILED', 'EXPIRED')
        GROUP BY p.id, p.name
        ORDER BY quantity DESC
        LIMIT 5
      `,
    ]);

    return {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
      topProducts,
    };
  }
}