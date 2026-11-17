import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async create(createDiscountDto: CreateDiscountDto, outletId: string) {
    if (!outletId) {
      throw new BadRequestException('Outlet ID is required');
    }

    const { productIds, ...discountData } = createDiscountDto;

    return this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          name: discountData.name,
          description: discountData.description,
          code: discountData.code ? discountData.code.trim().toUpperCase() : null,
          type: discountData.type,
          value: new Prisma.Decimal(discountData.value),
          scope: discountData.scope,
          minOrderAmount: discountData.minOrderAmount !== undefined && discountData.minOrderAmount !== null
            ? new Prisma.Decimal(discountData.minOrderAmount)
            : 0,
          maxDiscount: discountData.maxDiscount !== undefined && discountData.maxDiscount !== null
            ? new Prisma.Decimal(discountData.maxDiscount)
            : null,
          startDate: discountData.startDate ? new Date(discountData.startDate) : null,
          endDate: discountData.endDate ? new Date(discountData.endDate) : null,
          isActive: discountData.isActive !== undefined ? discountData.isActive : true,
          outletId,
        },
      });

      if (discountData.scope === 'SPECIFIC_PRODUCTS' && productIds && productIds.length > 0) {
        await tx.discountProduct.createMany({
          data: productIds.map((productId) => ({
            discountId: discount.id,
            productId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.discount.findUnique({
        where: { id: discount.id },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  image: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll(outletId?: string, companyId?: string) {
    const where: any = {};
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      return [];
    }

    return this.prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                image: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async findActive(outletId?: string, companyId?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      return [];
    }

    return this.prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });
  }

  async findById(id: string, outletId?: string, companyId?: string) {
    const where: any = { id };
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    }

    const discount = await this.prisma.discount.findFirst({
      where,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                image: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Diskon tidak ditemukan');
    }

    return discount;
  }

  async update(id: string, outletId: string, updateDiscountDto: UpdateDiscountDto) {
    const existing = await this.findById(id, outletId);
    if (!existing) {
      throw new NotFoundException('Diskon tidak ditemukan');
    }

    const { productIds, ...discountData } = updateDiscountDto;

    return this.prisma.$transaction(async (tx) => {
      const updatePayload: any = {};

      if (discountData.name !== undefined) updatePayload.name = discountData.name;
      if (discountData.description !== undefined) updatePayload.description = discountData.description;
      if (discountData.code !== undefined) {
        updatePayload.code = discountData.code ? discountData.code.trim().toUpperCase() : null;
      }
      if (discountData.type !== undefined) updatePayload.type = discountData.type;
      if (discountData.value !== undefined) updatePayload.value = new Prisma.Decimal(discountData.value);
      if (discountData.scope !== undefined) updatePayload.scope = discountData.scope;
      if (discountData.minOrderAmount !== undefined) {
        updatePayload.minOrderAmount = discountData.minOrderAmount !== null
          ? new Prisma.Decimal(discountData.minOrderAmount)
          : 0;
      }
      if (discountData.maxDiscount !== undefined) {
        updatePayload.maxDiscount = discountData.maxDiscount !== null
          ? new Prisma.Decimal(discountData.maxDiscount)
          : null;
      }
      if (discountData.startDate !== undefined) {
        updatePayload.startDate = discountData.startDate ? new Date(discountData.startDate) : null;
      }
      if (discountData.endDate !== undefined) {
        updatePayload.endDate = discountData.endDate ? new Date(discountData.endDate) : null;
      }
      if (discountData.isActive !== undefined) updatePayload.isActive = discountData.isActive;

      await tx.discount.update({
        where: { id },
        data: updatePayload,
      });

      // Update linked products if scope or productIds changed
      if (discountData.scope === 'ALL_ITEMS') {
        await tx.discountProduct.deleteMany({ where: { discountId: id } });
      } else if (productIds !== undefined) {
        await tx.discountProduct.deleteMany({ where: { discountId: id } });
        if (productIds.length > 0) {
          await tx.discountProduct.createMany({
            data: productIds.map((productId) => ({
              discountId: id,
              productId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.discount.findUnique({
        where: { id },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  image: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
    });
  }

  async toggleStatus(id: string, outletId: string) {
    const existing = await this.findById(id, outletId);
    if (!existing) {
      throw new NotFoundException('Diskon tidak ditemukan');
    }

    return this.prisma.discount.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  async remove(id: string, outletId: string) {
    const existing = await this.findById(id, outletId);
    if (!existing) {
      throw new NotFoundException('Diskon tidak ditemukan');
    }

    return this.prisma.discount.delete({
      where: { id },
    });
  }
}

