import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, outletId?: string, companyId?: string): Promise<Category> {
    let targetOutletId = outletId;
    if (!targetOutletId && companyId) {
      const defaultOutlet = await this.prisma.outlet.findFirst({
        where: { companyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultOutlet) {
        targetOutletId = defaultOutlet.id;
      }
    }

    if (!targetOutletId) {
      throw new ConflictException('Outlet ID tidak ditemukan atau belum terdaftar.');
    }

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        outletId: targetOutletId,
        name: createCategoryDto.name,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists in this outlet');
    }

    const maxSortOrder = await this.prisma.category.aggregate({
      where: { outletId: targetOutletId },
      _max: { sortOrder: true },
    });

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        outletId: targetOutletId,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async findAll(outletId?: string, companyId?: string): Promise<Category[]> {
    const where: any = {};
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      // Unauthenticated request without outletId: MUST NOT leak categories across tenants
      return [];
    }

    return this.prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async findActive(outletId?: string, companyId?: string): Promise<Category[]> {
    const where: any = {
      isActive: true,
    };
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      return [];
    }

    return this.prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isActive: true, status: 'AVAILABLE' },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findById(id: string, outletId?: string, companyId?: string): Promise<Category | null> {
    const where: any = { id };
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    }

    return this.prisma.category.findFirst({
      where,
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, outletId: string, updateCategoryDto: UpdateCategoryDto, companyId?: string): Promise<Category> {
    const category = await this.findById(id, outletId, companyId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const targetOutletId = outletId || category.outletId;

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          outletId: targetOutletId,
          name: updateCategoryDto.name,
          NOT: { id },
        },
      });

      if (existingCategory) {
        throw new ConflictException('Category name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string, outletId: string, companyId?: string): Promise<Category> {
    const category = await this.findById(id, outletId, companyId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException('Cannot delete category with existing products');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async reorder(outletId: string, categoryIds: string[], companyId?: string): Promise<void> {
    for (let i = 0; i < categoryIds.length; i++) {
      await this.prisma.category.updateMany({
        where: {
          id: categoryIds[i],
          ...(outletId ? { outletId } : companyId ? { outlet: { companyId } } : {}),
        },
        data: { sortOrder: i + 1 },
      });
    }
  }
}