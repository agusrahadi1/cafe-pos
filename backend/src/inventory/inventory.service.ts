import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, StockMovementType } from '@prisma/client';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SaveRecipeDto } from './dto/save-recipe.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 1. UNIT OF MEASURE (UoM)
  // ==========================================
  async getUnits(companyId: string) {
    let units = await this.prisma.unitOfMeasure.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });

    // Auto-seed default units if company has none yet
    if (units.length === 0) {
      const defaultUnits = [
        { name: 'Gram', symbol: 'g', baseUnit: 'g', conversionFactor: 1 },
        { name: 'Kilogram', symbol: 'kg', baseUnit: 'g', conversionFactor: 1000 },
        { name: 'Mililiter', symbol: 'ml', baseUnit: 'ml', conversionFactor: 1 },
        { name: 'Liter', symbol: 'l', baseUnit: 'ml', conversionFactor: 1000 },
        { name: 'Pieces / Buah', symbol: 'pcs', baseUnit: 'pcs', conversionFactor: 1 },
        { name: 'Espresso Shot', symbol: 'shot', baseUnit: 'shot', conversionFactor: 1 },
        { name: 'Porsi / Sachet', symbol: 'porsi', baseUnit: 'porsi', conversionFactor: 1 },
      ];

      for (const u of defaultUnits) {
        await this.prisma.unitOfMeasure.upsert({
          where: { companyId_symbol: { companyId, symbol: u.symbol } },
          update: {},
          create: { ...u, companyId },
        });
      }

      units = await this.prisma.unitOfMeasure.findMany({
        where: { companyId, isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    return units;
  }

  async createUnit(companyId: string, dto: CreateUnitDto) {
    const existing = await this.prisma.unitOfMeasure.findFirst({
      where: { companyId, symbol: dto.symbol.trim() },
    });

    if (existing) {
      throw new ConflictException(`Satuan dengan simbol "${dto.symbol}" sudah ada.`);
    }

    return this.prisma.unitOfMeasure.create({
      data: {
        companyId,
        name: dto.name.trim(),
        symbol: dto.symbol.trim(),
        baseUnit: dto.baseUnit?.trim() || dto.symbol.trim(),
        conversionFactor: dto.conversionFactor ? new Prisma.Decimal(dto.conversionFactor) : new Prisma.Decimal(1),
      },
    });
  }

  // ==========================================
  // 2. INGREDIENTS & OUTLET INVENTORY
  // ==========================================
  async getIngredients(companyId: string, outletId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { companyId, isActive: true },
      include: {
        unit: true,
        stocks: {
          where: { outletId },
        },
      },
      orderBy: { name: 'asc' },
    });

    return ingredients.map((ing) => {
      const stock = ing.stocks[0];
      const currentStock = stock ? Number(stock.currentStock) : 0;
      const minStock = stock ? Number(stock.minStock) : Number(ing.minStockAlert);
      const isLowStock = currentStock <= minStock;
      const isOutOfStock = currentStock <= 0;

      return {
        id: ing.id,
        name: ing.name,
        sku: ing.sku,
        category: ing.category,
        unit: ing.unit,
        costPerUnit: Number(ing.costPerUnit),
        minStockAlert: Number(ing.minStockAlert),
        inventoryId: stock?.id || null,
        currentStock,
        minStock,
        isLowStock,
        isOutOfStock,
        costPrice: stock ? Number(stock.costPrice) : Number(ing.costPerUnit),
        totalStockValue: currentStock * (stock ? Number(stock.costPrice) : Number(ing.costPerUnit)),
      };
    });
  }

  async createIngredient(companyId: string, outletId: string, dto: CreateIngredientDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ingredient.findFirst({
        where: { companyId, name: dto.name.trim() },
      });

      if (existing) {
        throw new ConflictException(`Bahan baku "${dto.name}" sudah terdaftar.`);
      }

      const costPerUnit = new Prisma.Decimal(dto.costPerUnit || 0);
      const minStockAlert = new Prisma.Decimal(dto.minStockAlert || 0);
      const initialStock = new Prisma.Decimal(dto.initialStock || 0);

      const ingredient = await tx.ingredient.create({
        data: {
          companyId,
          name: dto.name.trim(),
          sku: dto.sku?.trim() || undefined,
          category: dto.category?.trim() || 'Umum',
          unitId: dto.unitId,
          costPerUnit,
          minStockAlert,
        },
        include: { unit: true },
      });

      // Initialize inventory for all outlets of the company
      const outlets = await tx.outlet.findMany({
        where: { companyId },
        select: { id: true },
      });

      for (const out of outlets) {
        const isCurrentOutlet = out.id === outletId;
        const stockQty = isCurrentOutlet ? initialStock : new Prisma.Decimal(0);

        const inventory = await tx.outletInventory.create({
          data: {
            outletId: out.id,
            ingredientId: ingredient.id,
            currentStock: stockQty,
            minStock: minStockAlert,
            costPrice: costPerUnit,
          },
        });

        // If there's initial stock in current outlet, record movement
        if (isCurrentOutlet && Number(initialStock) > 0) {
          await tx.stockMovement.create({
            data: {
              inventoryId: inventory.id,
              type: StockMovementType.IN_PURCHASE,
              quantity: initialStock,
              balanceBefore: new Prisma.Decimal(0),
              balanceAfter: initialStock,
              unitCost: costPerUnit,
              totalCost: initialStock.mul(costPerUnit),
              referenceNumber: 'INITIAL-STOCK',
              notes: 'Stok awal saat pendaftaran bahan baku',
              createdById: userId,
            },
          });
        }
      }

      return ingredient;
    });
  }

  async updateIngredient(companyId: string, id: string, dto: UpdateIngredientDto) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, companyId },
    });

    if (!ingredient) {
      throw new NotFoundException('Bahan baku tidak ditemukan.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ingredient.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          sku: dto.sku?.trim(),
          category: dto.category?.trim(),
          unitId: dto.unitId,
          costPerUnit: dto.costPerUnit !== undefined ? new Prisma.Decimal(dto.costPerUnit) : undefined,
          minStockAlert: dto.minStockAlert !== undefined ? new Prisma.Decimal(dto.minStockAlert) : undefined,
          isActive: dto.isActive,
        },
        include: { unit: true },
      });

      if (dto.minStockAlert !== undefined) {
        await tx.outletInventory.updateMany({
          where: { ingredientId: id },
          data: { minStock: new Prisma.Decimal(dto.minStockAlert) },
        });
      }

      return updated;
    });
  }

  async deleteIngredient(companyId: string, id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, companyId },
    });

    if (!ingredient) {
      throw new NotFoundException('Bahan baku tidak ditemukan.');
    }

    // Soft delete
    return this.prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==========================================
  // 3. STOCK ADJUSTMENT & MOVEMENTS
  // ==========================================
  async adjustStock(outletId: string, userId: string | undefined, dto: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      // Find or create OutletInventory
      let inventory = await tx.outletInventory.findUnique({
        where: {
          outletId_ingredientId: {
            outletId,
            ingredientId: dto.ingredientId,
          },
        },
        include: { ingredient: true },
      });

      if (!inventory) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: dto.ingredientId },
        });
        if (!ingredient) throw new NotFoundException('Bahan baku tidak ditemukan.');

        inventory = await tx.outletInventory.create({
          data: {
            outletId,
            ingredientId: dto.ingredientId,
            currentStock: new Prisma.Decimal(0),
            minStock: ingredient.minStockAlert,
            costPrice: ingredient.costPerUnit,
          },
          include: { ingredient: true },
        });
      }

      const current = new Prisma.Decimal(inventory.currentStock);
      const inputQty = new Prisma.Decimal(dto.quantity);
      let delta: Prisma.Decimal;
      let finalBalance: Prisma.Decimal;

      if (dto.isSetAbsolute) {
        // Physical stock opname: input is the new absolute stock
        finalBalance = inputQty;
        delta = finalBalance.sub(current);
      } else {
        if (dto.type === StockMovementType.IN_PURCHASE || dto.type === StockMovementType.IN_RETURN) {
          delta = inputQty;
          finalBalance = current.add(delta);
        } else if (dto.type === StockMovementType.OUT_SALE || dto.type === StockMovementType.OUT_WASTE) {
          delta = inputQty.negated();
          finalBalance = current.add(delta);
        } else {
          // ADJUSTMENT delta
          delta = inputQty;
          finalBalance = current.add(delta);
        }
      }

      const unitCost = dto.unitCost !== undefined ? new Prisma.Decimal(dto.unitCost) : inventory.costPrice;

      // Update inventory currentStock
      const updatedInventory = await tx.outletInventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: finalBalance,
          costPrice: dto.unitCost ? unitCost : undefined,
          lastStockTakeAt: dto.isSetAbsolute ? new Date() : undefined,
        },
      });

      // Record movement ledger
      const movement = await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type: dto.type,
          quantity: delta,
          balanceBefore: current,
          balanceAfter: finalBalance,
          unitCost,
          totalCost: delta.abs().mul(unitCost),
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
          createdById: userId,
        },
      });

      return {
        inventory: updatedInventory,
        movement,
      };
    });
  }

  async getStockMovements(outletId: string, filters?: { ingredientId?: string; type?: StockMovementType; limit?: number }) {
    const where: any = {
      inventory: { outletId },
    };

    if (filters?.ingredientId) {
      where.inventory.ingredientId = filters.ingredientId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      include: {
        inventory: {
          include: {
            ingredient: {
              include: { unit: true },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  async getLowStockAlerts(outletId: string) {
    const inventories = await this.prisma.outletInventory.findMany({
      where: {
        outletId,
        ingredient: { isActive: true },
      },
      include: {
        ingredient: {
          include: { unit: true },
        },
      },
    });

    return inventories
      .filter((inv) => Number(inv.currentStock) <= Number(inv.minStock))
      .map((inv) => ({
        inventoryId: inv.id,
        ingredientId: inv.ingredientId,
        name: inv.ingredient.name,
        category: inv.ingredient.category,
        currentStock: Number(inv.currentStock),
        minStock: Number(inv.minStock),
        unit: inv.ingredient.unit.symbol,
        isOutOfStock: Number(inv.currentStock) <= 0,
      }));
  }

  // ==========================================
  // 4. RECIPES & COGS / HPP CALCULATION
  // ==========================================
  async getRecipes(outletId: string) {
    const products = await this.prisma.product.findMany({
      where: { outletId, isActive: true },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          include: {
            recipeItems: {
              include: {
                ingredient: { include: { unit: true } },
              },
            },
          },
        },
        recipeItems: {
          where: { productVariantId: null, modifierOptionId: null },
          include: {
            ingredient: { include: { unit: true } },
          },
        },
        modifiers: {
          where: { isActive: true },
          include: {
            options: {
              where: { isActive: true },
              include: {
                recipeItems: {
                  include: {
                    ingredient: { include: { unit: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((prod) => {
      // Calculate Product-Level Base Recipe COGS
      const baseCost = prod.recipeItems.reduce((acc, item) => {
        return acc + Number(item.quantity) * Number(item.ingredient.costPerUnit);
      }, 0);

      const baseSellingPrice = Number(prod.basePrice);
      const baseProfit = baseSellingPrice - baseCost;
      const baseMarginPercent = baseSellingPrice > 0 ? (baseProfit / baseSellingPrice) * 100 : 0;

      // Variants with Recipe COGS
      const variants = prod.variants.map((v) => {
        const vRecipe = v.recipeItems.length > 0 ? v.recipeItems : prod.recipeItems;
        const vCost = vRecipe.reduce((acc, item) => {
          return acc + Number(item.quantity) * Number(item.ingredient.costPerUnit);
        }, 0);
        const vPrice = Number(v.price);
        const vProfit = vPrice - vCost;
        const vMarginPercent = vPrice > 0 ? (vProfit / vPrice) * 100 : 0;

        return {
          id: v.id,
          name: v.name,
          price: vPrice,
          hasCustomRecipe: v.recipeItems.length > 0,
          recipeItems: vRecipe,
          cogs: vCost,
          profit: vProfit,
          marginPercent: Math.round(vMarginPercent * 10) / 10,
        };
      });

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category?.name || 'Umum',
        image: prod.image,
        basePrice: baseSellingPrice,
        cogs: baseCost,
        profit: baseProfit,
        marginPercent: Math.round(baseMarginPercent * 10) / 10,
        hasRecipe: prod.recipeItems.length > 0 || variants.some((v) => v.hasCustomRecipe),
        recipeItems: prod.recipeItems,
        variants,
        modifiers: prod.modifiers,
      };
    });
  }

  async saveRecipe(dto: SaveRecipeDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('Produk tidak ditemukan.');

      // Clear existing recipe items for this specific scope
      await tx.recipeItem.deleteMany({
        where: {
          productId: dto.productId,
          productVariantId: dto.productVariantId || null,
          modifierOptionId: dto.modifierOptionId || null,
        },
      });

      // Insert new recipe items
      if (dto.items && dto.items.length > 0) {
        for (const item of dto.items) {
          await tx.recipeItem.create({
            data: {
              productId: dto.productId,
              productVariantId: dto.productVariantId || null,
              modifierOptionId: dto.modifierOptionId || null,
              ingredientId: item.ingredientId,
              quantity: new Prisma.Decimal(item.quantity),
              unitId: item.unitId || null,
              notes: item.notes,
            },
          });
        }
      }

      return { success: true, count: dto.items.length };
    });
  }

  // ==========================================
  // 5. AUTOMATED DEDUCTION & RESTOCK ON ORDERS
  // ==========================================
  async deductStockForOrder(orderId: string, externalTx?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              modifiers: true,
            },
          },
        },
      });

      if (!order || order.items.length === 0) return;

      // Check if stock already deducted for this order to prevent double deduction
      const existingMovement = await tx.stockMovement.findFirst({
        where: {
          orderId,
          type: StockMovementType.OUT_SALE,
        },
      });

      if (existingMovement) {
        return; // Already deducted
      }

      // Map to accumulate total ingredient requirements for this order
      const ingredientUsage = new Map<string, Prisma.Decimal>();

      for (const item of order.items) {
        const itemQty = new Prisma.Decimal(item.quantity);

        // 1. Find Recipe Items for Product/Variant
        let recipeItems = await tx.recipeItem.findMany({
          where: {
            productId: item.productId,
            productVariantId: item.variantId || null,
            modifierOptionId: null,
          },
        });

        // If variant recipe not specified, fallback to product-level base recipe
        if (recipeItems.length === 0 && item.variantId) {
          recipeItems = await tx.recipeItem.findMany({
            where: {
              productId: item.productId,
              productVariantId: null,
              modifierOptionId: null,
            },
          });
        }

        for (const r of recipeItems) {
          const totalReq = r.quantity.mul(itemQty);
          const prev = ingredientUsage.get(r.ingredientId) || new Prisma.Decimal(0);
          ingredientUsage.set(r.ingredientId, prev.add(totalReq));
        }

        // 2. Modifiers recipe deduction
        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            const modRecipes = await tx.recipeItem.findMany({
              where: {
                modifierOptionId: mod.modifierOptionId,
              },
            });

            for (const mr of modRecipes) {
              const totalReq = mr.quantity.mul(itemQty);
              const prev = ingredientUsage.get(mr.ingredientId) || new Prisma.Decimal(0);
              ingredientUsage.set(mr.ingredientId, prev.add(totalReq));
            }
          }
        }
      }

      // Apply deductions to OutletInventory and log StockMovement
      for (const [ingredientId, usedQty] of ingredientUsage.entries()) {
        let inventory = await tx.outletInventory.findUnique({
          where: {
            outletId_ingredientId: {
              outletId: order.outletId,
              ingredientId,
            },
          },
        });

        if (!inventory) {
          const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
          inventory = await tx.outletInventory.create({
            data: {
              outletId: order.outletId,
              ingredientId,
              currentStock: new Prisma.Decimal(0),
              minStock: ingredient?.minStockAlert || new Prisma.Decimal(0),
              costPrice: ingredient?.costPerUnit || new Prisma.Decimal(0),
            },
          });
        }

        const balanceBefore = new Prisma.Decimal(inventory.currentStock);
        const delta = usedQty.negated(); // Negative for OUT
        const balanceAfter = balanceBefore.add(delta);

        await tx.outletInventory.update({
          where: { id: inventory.id },
          data: { currentStock: balanceAfter },
        });

        await tx.stockMovement.create({
          data: {
            inventoryId: inventory.id,
            type: StockMovementType.OUT_SALE,
            quantity: delta,
            balanceBefore,
            balanceAfter,
            unitCost: inventory.costPrice,
            totalCost: usedQty.mul(inventory.costPrice),
            referenceNumber: order.orderNumber,
            orderId: order.id,
            notes: `Pengurangan otomatis penjualan meja / kasir #${order.orderNumber}`,
          },
        });
      }
    };

    if (externalTx) {
      await run(externalTx);
    } else {
      await this.prisma.$transaction(run);
    }
  }

  async returnStockForOrder(orderId: string, reason?: string, externalTx?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) => {
      // Find all OUT_SALE movements associated with this order
      const saleMovements = await tx.stockMovement.findMany({
        where: {
          orderId,
          type: StockMovementType.OUT_SALE,
        },
        include: { inventory: true },
      });

      if (saleMovements.length === 0) {
        return; // Nothing to return
      }

      // Check if already returned
      const existingReturn = await tx.stockMovement.findFirst({
        where: {
          orderId,
          type: StockMovementType.IN_RETURN,
        },
      });

      if (existingReturn) {
        return; // Already restocked
      }

      for (const sm of saleMovements) {
        const inventory = sm.inventory;
        const returnQty = sm.quantity.abs(); // positive return
        const balanceBefore = new Prisma.Decimal(inventory.currentStock);
        const balanceAfter = balanceBefore.add(returnQty);

        await tx.outletInventory.update({
          where: { id: inventory.id },
          data: { currentStock: balanceAfter },
        });

        await tx.stockMovement.create({
          data: {
            inventoryId: inventory.id,
            type: StockMovementType.IN_RETURN,
            quantity: returnQty,
            balanceBefore,
            balanceAfter,
            unitCost: sm.unitCost,
            totalCost: sm.totalCost,
            referenceNumber: sm.referenceNumber,
            orderId,
            notes: reason || `Pengembalian stok pembatalan pesanan #${sm.referenceNumber}`,
          },
        });
      }
    };

    if (externalTx) {
      await run(externalTx);
    } else {
      await this.prisma.$transaction(run);
    }
  }
}

