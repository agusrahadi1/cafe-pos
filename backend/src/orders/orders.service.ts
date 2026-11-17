import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderStatus, OrderItem, Payment, PaymentStatus, PaymentMethod, ProductStatus, Prisma, TableStatus, ShiftStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  async generateOrderNumber(outletId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastOrder = await this.prisma.order.findFirst({
      where: { outletId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.slice(-4), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `A${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  async create(createOrderDto: CreateOrderDto, outletId?: string, userId?: string): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      let resolvedOutletId = outletId;

      // Validate table if provided
      if (createOrderDto.tableId) {
        const table = await tx.table.findFirst({
          where: { id: createOrderDto.tableId, ...(outletId ? { outletId } : {}) },
        });
        if (!table) {
          throw new NotFoundException('Table not found');
        }
        resolvedOutletId = table.outletId;
      }

      if (!resolvedOutletId && createOrderDto.items && createOrderDto.items.length > 0) {
        const prod = await tx.product.findUnique({ where: { id: createOrderDto.items[0].productId } });
        if (prod) resolvedOutletId = prod.outletId;
      }

      if (!resolvedOutletId) {
        throw new BadRequestException('Could not determine outlet for order');
      }

      // Validate session if provided
      if (createOrderDto.sessionId) {
        const session = await tx.customerSession.findFirst({
          where: { id: createOrderDto.sessionId, tableId: createOrderDto.tableId, isActive: true },
        });
        if (!session) {
          throw new NotFoundException('Invalid session');
        }
      }

      // Calculate totals and validate items
      let subtotal = new Prisma.Decimal(0);
      const orderItemsData = [];

      for (const itemDto of createOrderDto.items) {
        const product = await tx.product.findFirst({
          where: { id: itemDto.productId, outletId: resolvedOutletId },
          include: { variants: true, modifiers: { include: { options: true } } },
        });

        if (!product) {
          throw new NotFoundException(`Product ${itemDto.productId} not found`);
        }

        if (!product.isActive || product.status !== ProductStatus.AVAILABLE) {
          throw new ConflictException(`Product ${product.name} is not available`);
        }

        let unitPrice = product.basePrice;
        let variantName: string | undefined;

        if (itemDto.variantId) {
          const variant = product.variants.find(v => v.id === itemDto.variantId);
          if (!variant) {
            throw new NotFoundException(`Variant ${itemDto.variantId} not found for product ${product.name}`);
          }
          unitPrice = variant.price;
          variantName = variant.name;
        }

        // Validate modifiers
        let modifierPrice = new Prisma.Decimal(0);
        const modifierData = [];

        if (itemDto.modifiers && itemDto.modifiers.length > 0) {
          for (const modDto of itemDto.modifiers) {
            const modifierGroup = product.modifiers.find(g => g.id === modDto.modifierGroupId);
            if (!modifierGroup) {
              throw new NotFoundException(`Modifier group ${modDto.modifierGroupId} not found`);
            }

            const modifierOption = modifierGroup.options.find(o => o.id === modDto.modifierOptionId);
            if (!modifierOption) {
              throw new NotFoundException(`Modifier option ${modDto.modifierOptionId} not found`);
            }

            modifierPrice = modifierPrice.add(modifierOption.price);
            modifierData.push({
              modifierGroupId: modDto.modifierGroupId,
              modifierOptionId: modDto.modifierOptionId,
              price: modifierOption.price,
            });
          }
        }

        const finalUnitPrice = unitPrice.add(modifierPrice);
        const totalPrice = finalUnitPrice.mul(itemDto.quantity);
        subtotal = subtotal.add(totalPrice);

        orderItemsData.push({
          productId: itemDto.productId,
          variantId: itemDto.variantId,
          productName: product.name,
          variantName,
          quantity: itemDto.quantity,
          unitPrice: finalUnitPrice,
          discountAmount: new Prisma.Decimal(itemDto.discountAmount || 0),
          totalPrice,
          notes: itemDto.notes,
          modifiers: { create: modifierData },
        });
      }

      const taxRate = await this.getTaxRate(resolvedOutletId);
      const serviceChargeRate = await this.getServiceChargeRate(resolvedOutletId);

      const taxAmount = subtotal.mul(taxRate).div(100);
      const serviceChargeAmount = subtotal.mul(serviceChargeRate).div(100);
      const discountAmount = new Prisma.Decimal(createOrderDto.discountAmount || 0);
      const totalAmount = subtotal.add(taxAmount).add(serviceChargeAmount).sub(discountAmount);

      const orderNumber = await this.generateOrderNumber(resolvedOutletId);

      let activeShiftId: string | undefined = undefined;
      if (userId) {
        const activeShift = await tx.shift.findFirst({
          where: { cashierId: userId, outletId: resolvedOutletId, status: ShiftStatus.OPEN },
        });
        if (activeShift) {
          activeShiftId = activeShift.id;
        }
      } else if (resolvedOutletId) {
        // Self-order by customer via table QR: link to the open shift at this outlet
        const activeShift = await tx.shift.findFirst({
          where: { outletId: resolvedOutletId, status: ShiftStatus.OPEN },
          orderBy: { createdAt: 'desc' },
        });
        if (activeShift) {
          activeShiftId = activeShift.id;
        }
      }

      const paymentDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const paymentRandom = Math.floor(1000 + Math.random() * 9000);
      const isBorderPay = createOrderDto.paymentMethod === PaymentMethod.BORDERPAY || createOrderDto.paymentMethod === PaymentMethod.QRIS;
      const isXendit = createOrderDto.paymentMethod === PaymentMethod.XENDIT;
      const isMidtrans = createOrderDto.paymentMethod === PaymentMethod.MIDTRANS;

      const order = await tx.order.create({
        data: {
          outletId: resolvedOutletId,
          tableId: createOrderDto.tableId,
          sessionId: createOrderDto.sessionId,
          orderNumber,
          customerName: createOrderDto.customerName,
          customerPhone: createOrderDto.customerPhone,
          customerNotes: createOrderDto.customerNotes,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal,
          taxAmount,
          serviceChargeAmount,
          discountAmount,
          totalAmount,
          paidAmount: new Prisma.Decimal(0),
          createdById: userId,
          shiftId: activeShiftId,
          items: { create: orderItemsData },
          payments: {
            create: {
              paymentNumber: `PAY${paymentDateStr}${paymentRandom}`,
              outletId: resolvedOutletId,
              amount: totalAmount,
              method: createOrderDto.paymentMethod || PaymentMethod.CASH,
              status: PaymentStatus.PENDING_PAYMENT,
              provider: isBorderPay ? 'borderpay' : isXendit ? 'xendit' : isMidtrans ? 'midtrans' : 'cash',
            },
          },
        },
        include: {
          items: { include: { modifiers: true } },
          payments: true,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.DRAFT,
          toStatus: order.status,
          changedById: userId,
          reason: 'Order created',
        },
      });

      // Update table status
      if (createOrderDto.tableId) {
        await tx.table.update({
          where: { id: createOrderDto.tableId },
          data: { status: 'ORDERING' },
        });
      }

      // Deduct inventory if order is already confirmed or paid (e.g. Cash)
      if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PAID) {
        await this.inventoryService.deductStockForOrder(order.id, tx);
      }

      return order;
    });
  }

  async findAll(outletId: string, filters?: any): Promise<Order[]> {
    const where: any = { outletId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.tableId) where.tableId = filters.tableId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (typeof filters.dateFrom === 'string' && filters.dateFrom.length <= 10) {
          from.setHours(0, 0, 0, 0);
        }
        where.createdAt.gte = from;
      }
      if (filters?.dateTo) {
        const to = new Date(filters.dateTo);
        if (typeof filters.dateTo === 'string' && filters.dateTo.length <= 10) {
          to.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = to;
      }
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        outlet: {
          include: {
            company: true,
          },
        },
        table: true,
        items: { include: { modifiers: true } },
        payments: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async findById(id: string, outletId?: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: { id, ...(outletId ? { outletId } : {}) },
      include: {
        outlet: {
          include: {
            company: true,
          },
        },
        table: true,
        session: true,
        items: { include: { modifiers: true } },
        payments: true,
        statusHistory: { include: { changedBy: { select: { id: true, fullName: true } } } },
        createdBy: { select: { id: true, fullName: true } },
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async findByOrderNumber(orderNumber: string, outletId: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: { orderNumber, outletId },
      include: {
        table: true,
        items: { include: { modifiers: true } },
        payments: true,
      },
    });
  }

  async update(id: string, outletId: string, updateOrderDto: UpdateOrderDto, userId?: string): Promise<Order> {
    const order = await this.findById(id, outletId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only allow certain updates based on status
    const allowedStatusesForUpdate: OrderStatus[] = [OrderStatus.DRAFT, OrderStatus.PENDING_PAYMENT];
    if (!allowedStatusesForUpdate.includes(order.status)) {
      throw new ConflictException(`Cannot update order in ${order.status} status`);
    }

    const { items, paymentMethod, paymentStatus, ...orderData } = updateOrderDto;

    return this.prisma.order.update({
      where: { id },
      data: {
        ...orderData,
        updatedById: userId,
      },
      include: { items: { include: { modifiers: true } } },
    });
  }

  async updateStatus(id: string, outletId: string, status: OrderStatus, userId?: string, reason?: string): Promise<Order> {
    const order = await this.findById(id, outletId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new ConflictException(`Invalid status transition from ${order.status} to ${status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      let shiftIdToAssign: string | undefined = undefined;
      if (!order.shiftId && (status === OrderStatus.PAID || status === OrderStatus.CONFIRMED)) {
        if (userId) {
          const activeShift = await tx.shift.findFirst({
            where: { cashierId: userId, outletId, status: ShiftStatus.OPEN },
          });
          if (activeShift) {
            shiftIdToAssign = activeShift.id;
          }
        }
        if (!shiftIdToAssign && outletId) {
          const activeShift = await tx.shift.findFirst({
            where: { outletId, status: ShiftStatus.OPEN },
            orderBy: { createdAt: 'desc' },
          });
          if (activeShift) {
            shiftIdToAssign = activeShift.id;
          }
        }
      }

      const isPaidOrConfirmed = status === OrderStatus.PAID || status === OrderStatus.CONFIRMED;

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          updatedById: userId,
          ...(shiftIdToAssign && { shiftId: shiftIdToAssign }),
          ...(isPaidOrConfirmed && {
            confirmedAt: order.confirmedAt || new Date(),
            paidAmount: order.totalAmount,
          }),
          ...(status === OrderStatus.COMPLETED && { completedAt: new Date() }),
          ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date(), cancellationReason: reason }),
        },
        include: { items: { include: { modifiers: true } } },
      });

      if (isPaidOrConfirmed) {
        const existingPayments = await tx.payment.findMany({
          where: { orderId: id },
        });

        if (existingPayments.length > 0) {
          await tx.payment.updateMany({
            where: { orderId: id, status: PaymentStatus.PENDING_PAYMENT },
            data: { status: PaymentStatus.PAID, paidAt: new Date() },
          });
        } else {
          const paymentDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const paymentRandom = Math.floor(1000 + Math.random() * 9000);
          await tx.payment.create({
            data: {
              paymentNumber: `PAY${paymentDateStr}${paymentRandom}`,
              orderId: id,
              outletId,
              amount: order.totalAmount,
              method: PaymentMethod.CASH,
              status: PaymentStatus.PAID,
              paidAt: new Date(),
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: status,
          changedById: userId,
          reason,
        },
      });

      // Update table status based on order status
      if (order.tableId) {
        const tableStatus = this.getTableStatusForOrderStatus(status);
        if (tableStatus) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: tableStatus },
          });
        }
      }

      // Manage inventory stock deduction / return
      const stockDeductibleStatuses: OrderStatus[] = [
        OrderStatus.CONFIRMED,
        OrderStatus.PAID,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
      ];
      if (stockDeductibleStatuses.includes(status)) {
        await this.inventoryService.deductStockForOrder(order.id, tx);
      } else if (status === OrderStatus.CANCELLED) {
        await this.inventoryService.returnStockForOrder(order.id, reason, tx);
      }

      return updatedOrder;
    });
  }

  async cancel(id: string, outletId: string, reason: string, userId?: string): Promise<Order> {
    return this.updateStatus(id, outletId, OrderStatus.CANCELLED, userId, reason);
  }

  async getDashboardData(outletId: string): Promise<any> {
    const [newOrders, preparingOrders, readyOrders, deliveringOrders, todayStats] = await Promise.all([
      this.prisma.order.findMany({
        where: { outletId, status: { in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CONFIRMED] } },
        orderBy: { createdAt: 'asc' },
        include: { table: true, items: true, payments: true },
      }),
      this.prisma.order.findMany({
        where: { outletId, status: OrderStatus.PREPARING },
        orderBy: { createdAt: 'asc' },
        include: { table: true, items: true },
      }),
      this.prisma.order.findMany({
        where: { outletId, status: OrderStatus.READY },
        orderBy: { createdAt: 'asc' },
        include: { table: true, items: true },
      }),
      this.prisma.order.findMany({
        where: { outletId, status: OrderStatus.OUT_FOR_DELIVERY },
        orderBy: { createdAt: 'asc' },
        include: { table: true, items: true },
      }),
      this.getTodayStats(outletId),
    ]);

    return {
      newOrders,
      preparingOrders,
      readyOrders,
      deliveringOrders,
      stats: todayStats,
    };
  }

  async getKitchenOrders(outletId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        outletId,
        status: { in: [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: true,
        items: { include: { modifiers: true } },
      },
    });
  }

  async getWaiterOrders(outletId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        outletId,
        status: { in: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: true,
        items: { include: { modifiers: true } },
      },
    });
  }

  private async getTodayStats(outletId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [orders, revenue] = await Promise.all([
      this.prisma.order.count({
        where: {
          outletId,
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED] },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          outletId,
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED] },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      ordersCount: orders,
      revenue: revenue._sum.totalAmount || new Prisma.Decimal(0),
      averageOrderValue: orders > 0 ? revenue._sum.totalAmount?.div(orders) || new Prisma.Decimal(0) : new Prisma.Decimal(0),
    };
  }

  private async getTaxRate(outletId: string): Promise<Prisma.Decimal> {
    const outlet = await this.prisma.outlet.findUnique({ where: { id: outletId }, select: { taxRate: true } });
    return outlet?.taxRate || new Prisma.Decimal(0);
  }

  private async getServiceChargeRate(outletId: string): Promise<Prisma.Decimal> {
    const outlet = await this.prisma.outlet.findUnique({ where: { id: outletId }, select: { serviceCharge: true } });
    return outlet?.serviceCharge || new Prisma.Decimal(0);
  }

  private isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    if (from === to) return true;

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      DRAFT: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
      PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.PAYMENT_FAILED, OrderStatus.EXPIRED, OrderStatus.CANCELLED],
      PAID: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      DELIVERED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
      PAYMENT_FAILED: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
      EXPIRED: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
      REFUNDED: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  private getTableStatusForOrderStatus(orderStatus: OrderStatus): TableStatus | null {
    const statusMap: Record<OrderStatus, TableStatus | null> = {
      DRAFT: null,
      PENDING_PAYMENT: TableStatus.ORDERING,
      PAID: TableStatus.ORDERING,
      CONFIRMED: TableStatus.PREPARING,
      PREPARING: TableStatus.PREPARING,
      READY: TableStatus.WAITING_DELIVERY,
      OUT_FOR_DELIVERY: TableStatus.WAITING_DELIVERY,
      DELIVERED: TableStatus.COMPLETED,
      COMPLETED: TableStatus.AVAILABLE,
      CANCELLED: TableStatus.AVAILABLE,
      PAYMENT_FAILED: TableStatus.ORDERING,
      EXPIRED: TableStatus.AVAILABLE,
      REFUNDED: TableStatus.AVAILABLE,
    };
    return statusMap[orderStatus] || null;
  }
}