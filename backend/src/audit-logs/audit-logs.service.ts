import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLog } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    companyId?: string;
    outletId?: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(companyId: string, filters?: any) {
    const where: any = { companyId };

    if (filters?.outletId) where.outletId = filters.outletId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.action) where.action = filters.action;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        outlet: { select: { id: true, name: true } },
      },
    });
  }

  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findAllGlobal(filters?: any) {
    const where: any = {};

    if (filters?.companyId) where.companyId = filters.companyId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.action) where.action = filters.action;
    if (filters?.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entity: { contains: filters.search, mode: 'insensitive' } },
        { company: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(filters?.limit) || 50,
        skip: Number(filters?.offset) || 0,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, fullName: true, email: true, role: true } },
          outlet: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      data: logs,
    };
  }
}