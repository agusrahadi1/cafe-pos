import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, description?: string): Promise<Permission> {
    const existingPermission = await this.prisma.permission.findUnique({ where: { name } });
    if (existingPermission) {
      throw new ConflictException('Permission name already exists');
    }

    return this.prisma.permission.create({ data: { name, description } });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { name } });
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Permission> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (data.name && data.name !== permission.name) {
      const existingPermission = await this.prisma.permission.findUnique({ where: { name: data.name } });
      if (existingPermission) {
        throw new ConflictException('Permission name already exists');
      }
    }

    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Permission> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.permission.delete({ where: { id } });
  }

  async seedDefaultPermissions() {
    const defaultPermissions = [
      // Company
      { name: 'company:create', description: 'Create company' },
      { name: 'company:read', description: 'Read company' },
      { name: 'company:update', description: 'Update company' },
      { name: 'company:delete', description: 'Delete company' },
      // Outlet
      { name: 'outlet:create', description: 'Create outlet' },
      { name: 'outlet:read', description: 'Read outlet' },
      { name: 'outlet:update', description: 'Update outlet' },
      { name: 'outlet:delete', description: 'Delete outlet' },
      // Users
      { name: 'user:create', description: 'Create user' },
      { name: 'user:read', description: 'Read user' },
      { name: 'user:update', description: 'Update user' },
      { name: 'user:delete', description: 'Delete user' },
      { name: 'user:manage_roles', description: 'Manage user roles' },
      // Tables
      { name: 'table:create', description: 'Create table' },
      { name: 'table:read', description: 'Read table' },
      { name: 'table:update', description: 'Update table' },
      { name: 'table:delete', description: 'Delete table' },
      { name: 'table:manage_qr', description: 'Manage QR codes' },
      // Categories
      { name: 'category:create', description: 'Create category' },
      { name: 'category:read', description: 'Read category' },
      { name: 'category:update', description: 'Update category' },
      { name: 'category:delete', description: 'Delete category' },
      // Products
      { name: 'product:create', description: 'Create product' },
      { name: 'product:read', description: 'Read product' },
      { name: 'product:update', description: 'Update product' },
      { name: 'product:delete', description: 'Delete product' },
      { name: 'product:manage_variants', description: 'Manage product variants' },
      { name: 'product:manage_modifiers', description: 'Manage product modifiers' },
      // Orders
      { name: 'order:create', description: 'Create order' },
      { name: 'order:read', description: 'Read order' },
      { name: 'order:update', description: 'Update order' },
      { name: 'order:delete', description: 'Delete order' },
      { name: 'order:manage_status', description: 'Manage order status' },
      { name: 'order:cancel', description: 'Cancel order' },
      // Payments
      { name: 'payment:create', description: 'Create payment' },
      { name: 'payment:read', description: 'Read payment' },
      { name: 'payment:refund', description: 'Refund payment' },
      // Reports
      { name: 'report:read', description: 'Read reports' },
      { name: 'report:export', description: 'Export reports' },
      // Audit Logs
      { name: 'audit:read', description: 'Read audit logs' },
      // Settings
      { name: 'settings:read', description: 'Read settings' },
      { name: 'settings:update', description: 'Update settings' },
    ];

    for (const perm of defaultPermissions) {
      await this.prisma.permission.upsert({
        where: { name: perm.name },
        update: { description: perm.description },
        create: perm,
      });
    }

    return this.findAll();
  }
}