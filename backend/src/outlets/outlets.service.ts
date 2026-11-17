import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { Outlet } from '@prisma/client';

@Injectable()
export class OutletsService {
  constructor(private prisma: PrismaService) {}

  async create(createOutletDto: CreateOutletDto, companyId: string): Promise<Outlet> {
    const existingOutlet = await this.prisma.outlet.findFirst({
      where: {
        companyId,
        code: createOutletDto.code,
      },
    });

    if (existingOutlet) {
      throw new ConflictException('Outlet code already exists in this company');
    }

    return this.prisma.outlet.create({
      data: {
        ...createOutletDto,
        companyId,
      },
    });
  }

  async findAll(companyId: string): Promise<Outlet[]> {
    return this.prisma.outlet.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tables: true, users: true, products: true, orders: true },
        },
      },
    });
  }

  async findById(id: string, companyId: string): Promise<Outlet | null> {
    return this.prisma.outlet.findFirst({
      where: { id, companyId },
      include: {
        tables: true,
        _count: {
          select: { tables: true, users: true, products: true, orders: true },
        },
      },
    });
  }

  async update(id: string, companyId: string, updateOutletDto: UpdateOutletDto): Promise<Outlet> {
    const outlet = await this.findById(id, companyId);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    if (updateOutletDto.code && updateOutletDto.code !== outlet.code) {
      const existingOutlet = await this.prisma.outlet.findFirst({
        where: {
          companyId,
          code: updateOutletDto.code,
          NOT: { id },
        },
      });

      if (existingOutlet) {
        throw new ConflictException('Outlet code already exists');
      }
    }

    return this.prisma.outlet.update({
      where: { id },
      data: updateOutletDto,
    });
  }

  async remove(id: string, companyId: string): Promise<Outlet> {
    const outlet = await this.findById(id, companyId);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    return this.prisma.outlet.delete({
      where: { id },
    });
  }

  async getSettings(id: string, companyId: string) {
    const outlet = await this.findById(id, companyId);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    return {
      taxRate: outlet.taxRate,
      serviceCharge: outlet.serviceCharge,
      currency: outlet.currency,
      timezone: outlet.timezone,
      settings: outlet.settings,
    };
  }

  async updateSettings(id: string, companyId: string, settings: any) {
    const outlet = await this.findById(id, companyId);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    return this.prisma.outlet.update({
      where: { id },
      data: { settings },
    });
  }
}