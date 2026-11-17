import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerSession } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async getSessionWithCart(sessionToken: string) {
    const session = await this.prisma.customerSession.findUnique({
      where: { sessionToken, isActive: true, expiresAt: { gt: new Date() } },
      include: { table: { include: { outlet: true } } },
    });

    if (!session) {
      throw new NotFoundException('Session not found or expired');
    }

    // Get active cart from localStorage would be handled client-side
    // This just returns session info for validation
    return session;
  }

  async validateSessionForOrder(sessionToken: string): Promise<CustomerSession> {
    const session = await this.getSessionWithCart(sessionToken);
    
    if (!session.table.isActive) {
      throw new NotFoundException('Table is not active');
    }

    return session;
  }
}