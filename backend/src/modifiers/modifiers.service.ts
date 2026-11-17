import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { ModifierGroup, ModifierOption } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  // Modifier Group methods
  async createGroup(productId: string, createModifierGroupDto: CreateModifierGroupDto): Promise<ModifierGroup> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const maxSortOrder = await this.prisma.modifierGroup.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    return this.prisma.modifierGroup.create({
      data: {
        ...createModifierGroupDto,
        productId,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
      include: { options: true },
    });
  }

  async findAllGroups(productId: string): Promise<ModifierGroup[]> {
    return this.prisma.modifierGroup.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
      include: { options: true },
    });
  }

  async findActiveGroups(productId: string): Promise<ModifierGroup[]> {
    return this.prisma.modifierGroup.findMany({
      where: { productId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        options: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findGroupById(id: string): Promise<ModifierGroup | null> {
    return this.prisma.modifierGroup.findUnique({
      where: { id },
      include: { options: true },
    });
  }

  async updateGroup(id: string, updateModifierGroupDto: UpdateModifierGroupDto): Promise<ModifierGroup> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return this.prisma.modifierGroup.update({
      where: { id },
      data: updateModifierGroupDto,
      include: { options: true },
    });
  }

  async removeGroup(id: string): Promise<ModifierGroup> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    const orderItemsCount = await this.prisma.orderItemModifier.count({
      where: { modifierGroupId: id },
    });

    if (orderItemsCount > 0) {
      throw new ConflictException('Cannot delete modifier group with existing orders');
    }

    return this.prisma.modifierGroup.delete({
      where: { id },
    });
  }

  async reorderGroups(productId: string, groupIds: string[]): Promise<void> {
    for (let i = 0; i < groupIds.length; i++) {
      await this.prisma.modifierGroup.update({
        where: { id: groupIds[i] },
        data: { sortOrder: i + 1 },
      });
    }
  }

  // Modifier Option methods
  async createOption(groupId: string, createModifierOptionDto: CreateModifierOptionDto): Promise<ModifierOption> {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    const maxSortOrder = await this.prisma.modifierOption.aggregate({
      where: { modifierGroupId: groupId },
      _max: { sortOrder: true },
    });

    return this.prisma.modifierOption.create({
      data: {
        ...createModifierOptionDto,
        modifierGroupId: groupId,
        price: new Decimal(createModifierOptionDto.price ?? 0),
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });
  }

  async findAllOptions(groupId: string): Promise<ModifierOption[]> {
    return this.prisma.modifierOption.findMany({
      where: { modifierGroupId: groupId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActiveOptions(groupId: string): Promise<ModifierOption[]> {
    return this.prisma.modifierOption.findMany({
      where: { modifierGroupId: groupId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOptionById(id: string): Promise<ModifierOption | null> {
    return this.prisma.modifierOption.findUnique({
      where: { id },
    });
  }

  async updateOption(id: string, updateModifierOptionDto: UpdateModifierOptionDto): Promise<ModifierOption> {
    const option = await this.findOptionById(id);
    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    const data: any = { ...updateModifierOptionDto };
    if (updateModifierOptionDto.price !== undefined) {
      data.price = new Decimal(updateModifierOptionDto.price);
    }

    return this.prisma.modifierOption.update({
      where: { id },
      data,
    });
  }

  async removeOption(id: string): Promise<ModifierOption> {
    const option = await this.findOptionById(id);
    if (!option) {
      throw new NotFoundException('Modifier option not found');
    }

    const orderItemsCount = await this.prisma.orderItemModifier.count({
      where: { modifierOptionId: id },
    });

    if (orderItemsCount > 0) {
      throw new ConflictException('Cannot delete modifier option with existing orders');
    }

    return this.prisma.modifierOption.delete({
      where: { id },
    });
  }

  async reorderOptions(groupId: string, optionIds: string[]): Promise<void> {
    for (let i = 0; i < optionIds.length; i++) {
      await this.prisma.modifierOption.update({
        where: { id: optionIds[i] },
        data: { sortOrder: i + 1 },
      });
    }
  }
}