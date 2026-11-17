import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerSession } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async createSession(tableId: string, customerName?: string, phone?: string): Promise<CustomerSession> {
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4); // 4 hour session

    return this.prisma.customerSession.create({
      data: {
        tableId,
        sessionToken,
        customerName,
        phone,
        expiresAt,
        isActive: true,
      },
      include: { table: { include: { outlet: true } } },
    });
  }

  async findSessionByToken(sessionToken: string): Promise<CustomerSession | null> {
    return this.prisma.customerSession.findUnique({
      where: { sessionToken },
      include: { table: { include: { outlet: true } } },
    });
  }

  async findActiveSessionByTable(tableId: string): Promise<CustomerSession | null> {
    return this.prisma.customerSession.findFirst({
      where: { tableId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { startedAt: 'desc' },
    });
  }

  async updateSessionActivity(sessionId: string): Promise<CustomerSession> {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async endSession(sessionId: string): Promise<CustomerSession> {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async getSessionOrders(sessionId: string) {
    return this.prisma.order.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { modifiers: true } }, payments: true },
    });
  }

  async cleanupExpiredSessions() {
    return this.prisma.customerSession.updateMany({
      where: { expiresAt: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    });
  }
}