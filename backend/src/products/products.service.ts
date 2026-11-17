import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, outletId?: string, companyId?: string): Promise<Product> {
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
      throw new BadRequestException('Outlet ID tidak ditemukan atau belum terdaftar.');
    }

    // Quota Enforcement: check maxProducts on active subscription
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: targetOutletId },
      include: {
        company: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { plan: true },
            },
          },
        },
      },
    });

    if (outlet?.company?.subscriptions?.[0]?.plan) {
      const plan = outlet.company.subscriptions[0].plan;
      if (plan.maxProducts !== -1) {
        const currentProductsCount = await this.prisma.product.count({
          where: { outlet: { companyId: outlet.companyId } },
        });
        if (currentProductsCount >= plan.maxProducts) {
          throw new BadRequestException(
            `Batas kuota produk untuk paket langganan (${plan.name}: maksimal ${plan.maxProducts} produk) telah tercapai. Silakan upgrade paket langganan Anda.`
          );
        }
      }
    }

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        outletId: targetOutletId,
        sku: createProductDto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product SKU already exists in this outlet');
    }

    const maxSortOrder = await this.prisma.product.aggregate({
      where: { outletId: targetOutletId },
      _max: { sortOrder: true },
    });

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        outletId: targetOutletId,
        basePrice: new Decimal(createProductDto.basePrice),
        costPrice: createProductDto.costPrice ? new Decimal(createProductDto.costPrice) : null,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
      include: {
        variants: true,
        modifiers: {
          include: { options: true },
        },
      },
    });
  }

  async findAll(outletId?: string, companyId?: string, includeInactive = false): Promise<Product[]> {
    const where: any = {};
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      // Unauthenticated request without outletId: MUST NOT leak products across tenants
      return [];
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        variants: includeInactive
          ? { orderBy: { sortOrder: 'asc' } }
          : { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        modifiers: {
          where: { isActive: true },
          include: { options: { where: { isActive: true } } },
        },
        category: true,
      },
    });
  }

  async findActive(outletId?: string, companyId?: string): Promise<Product[]> {
    const where: any = {
      isActive: true,
      status: ProductStatus.AVAILABLE,
    };
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      return [];
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        variants: { where: { isActive: true } },
        modifiers: {
          where: { isActive: true },
          include: { options: { where: { isActive: true } } },
        },
        category: true,
      },
    });
  }

  async findByCategory(outletId: string | undefined, categoryId: string, companyId?: string): Promise<Product[]> {
    const where: any = {
      categoryId,
      isActive: true,
      status: ProductStatus.AVAILABLE,
    };
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    } else {
      return [];
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        variants: { where: { isActive: true } },
        modifiers: {
          where: { isActive: true },
          include: { options: { where: { isActive: true } } },
        },
      },
    });
  }

  async findById(id: string, outletId?: string, companyId?: string): Promise<Product | null> {
    const where: any = { id };
    if (outletId) {
      where.outletId = outletId;
    } else if (companyId) {
      where.outlet = { companyId };
    }

    return this.prisma.product.findFirst({
      where,
      include: {
        variants: true,
        modifiers: {
          include: { options: true },
        },
        category: true,
      },
    });
  }

  async findBySku(sku: string, outletId: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { sku, outletId },
    });
  }

  async update(id: string, outletId: string, updateProductDto: UpdateProductDto, companyId?: string): Promise<Product> {
    const product = await this.findById(id, outletId, companyId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const targetOutletId = outletId || product.outletId;

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          outletId: targetOutletId,
          sku: updateProductDto.sku,
          NOT: { id },
        },
      });

      if (existingProduct) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    const data: any = { ...updateProductDto };
    if (updateProductDto.basePrice !== undefined) {
      data.basePrice = new Decimal(updateProductDto.basePrice);
    }
    if (updateProductDto.costPrice !== undefined) {
      data.costPrice = updateProductDto.costPrice ? new Decimal(updateProductDto.costPrice) : null;
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
        modifiers: {
          include: { options: true },
        },
      },
    });
  }

  async remove(id: string, outletId: string, companyId?: string): Promise<Product> {
    const product = await this.findById(id, outletId, companyId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const orderItemsCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      throw new ConflictException('Cannot delete product with existing orders');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, outletId: string, status: ProductStatus, companyId?: string): Promise<Product> {
    const product = await this.findById(id, outletId, companyId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status },
    });
  }

  async reorder(outletId: string, productIds: string[], companyId?: string): Promise<void> {
    for (let i = 0; i < productIds.length; i++) {
      await this.prisma.product.updateMany({
        where: {
          id: productIds[i],
          ...(outletId ? { outletId } : companyId ? { outlet: { companyId } } : {}),
        },
        data: { sortOrder: i + 1 },
      });
    }
  }

  async getProductForOrder(productId: string, outletId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, outletId },
      include: {
        variants: { where: { isActive: true } },
        modifiers: {
          where: { isActive: true },
          include: { options: { where: { isActive: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive || product.status !== ProductStatus.AVAILABLE) {
      throw new ConflictException('Product is not available');
    }

    return product;
  }
}