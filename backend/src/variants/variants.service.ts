import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { ProductVariant } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  async create(productId: string, createVariantDto: CreateVariantDto): Promise<ProductVariant> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const maxSortOrder = await this.prisma.productVariant.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    return this.prisma.productVariant.create({
      data: {
        ...createVariantDto,
        productId,
        price: new Decimal(createVariantDto.price),
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async findAll(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActive(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({
      where: { productId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<ProductVariant | null> {
    return this.prisma.productVariant.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateVariantDto: UpdateVariantDto): Promise<ProductVariant> {
    const variant = await this.findById(id);
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const data: any = { ...updateVariantDto };
    if (updateVariantDto.price !== undefined) {
      data.price = new Decimal(updateVariantDto.price);
    }

    return this.prisma.productVariant.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<ProductVariant> {
    const variant = await this.findById(id);
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const orderItemsCount = await this.prisma.orderItem.count({
      where: { variantId: id },
    });

    if (orderItemsCount > 0) {
      throw new ConflictException('Cannot delete variant with existing orders');
    }

    return this.prisma.productVariant.delete({
      where: { id },
    });
  }

  async reorder(productId: string, variantIds: string[]): Promise<void> {
    for (let i = 0; i < variantIds.length; i++) {
      await this.prisma.productVariant.update({
        where: { id: variantIds[i] },
        data: { sortOrder: i + 1 },
      });
    }
  }
}