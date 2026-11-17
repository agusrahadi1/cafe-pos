import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Permission } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, description?: string, permissionIds?: string[]): Promise<Role> {
    const existingRole = await this.prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    return this.prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds ? { connect: permissionIds.map((id) => ({ id })) } : undefined,
      },
      include: { permissions: true },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
      include: { permissions: true },
    });
  }

  async update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (data.name && data.name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({ where: { name: data.name } });
      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissionIds
          ? { set: data.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async remove(id: string): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is assigned to any user
    const userCount = await this.prisma.user.count({ where: { role: role.name as any } });
    if (userCount > 0) {
      throw new ConflictException('Cannot delete role assigned to users');
    }

    return this.prisma.role.delete({ where: { id } });
  }
}