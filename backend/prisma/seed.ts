import { PrismaClient, UserRole, UserStatus, ProductStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Cocok untuk kafe kecil atau kedai kopi baru',
      priceMonthly: 99000,
      priceYearly: 990000,
      maxProducts: 20,
      maxStaffAccounts: 2,
      features: ['20 Menu Produk', '2 Akun Staf/Kasir', 'QR Code Meja Dinamis', 'Laporan Penjualan Dasar'],
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      description: 'Untuk kafe dengan volume pesanan menengah yang berkembang',
      priceMonthly: 199000,
      priceYearly: 1990000,
      maxProducts: 100,
      maxStaffAccounts: 10,
      features: ['100 Menu Produk', '10 Akun Staf/Kasir', 'QR Ordering & POS', 'Display Dapur & Pelayan', 'Laporan Finansial Lengkap'],
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Akses tanpa batas untuk restoran dan jaringan kafe profesional',
      priceMonthly: 399000,
      priceYearly: 3990000,
      maxProducts: -1,
      maxStaffAccounts: -1,
      features: ['Unlimited Menu Produk', 'Unlimited Akun Staf', 'Branding Kustom Lengkap', 'Multi-Outlet Siap Pakai', 'Dukungan Prioritas 24/7'],
    },
  });
  console.log('✅ Subscription plans created: Starter, Pro, Enterprise');

  // 2. Create Global Platform Superadmin
  const superadminPassword = await bcrypt.hash('superadmin123', 12);
  const superadmin = await prisma.user.upsert({
    where: { companyId_email: { companyId: '', email: 'superadmin@cafepos.com' } },
    update: {},
    create: {
      email: 'superadmin@cafepos.com',
      passwordHash: superadminPassword,
      fullName: 'Platform Superadmin',
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('✅ Superadmin created:', superadmin.email);

  // 3. Create default company (Tenant)
  const company = await prisma.company.upsert({
    where: { slug: 'demo-cafe' },
    update: {
      tagline: 'Artisanal Coffee & Gourmet Bistro',
      receiptFooter: 'Terima kasih atas kunjungan Anda! Follow IG: @democafe',
      status: 'ACTIVE',
    },
    create: {
      name: 'Demo Cafe',
      slug: 'demo-cafe',
      tagline: 'Artisanal Coffee & Gourmet Bistro',
      address: 'Jl. Senopati No. 45, Jakarta Selatan',
      phone: '+62 21 555-0199',
      email: 'info@democafe.com',
      receiptFooter: 'Terima kasih atas kunjungan Anda! Follow IG: @democafe',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Company created:', company.name);

  // 4. Assign Active Enterprise Subscription to Demo Cafe
  const existingSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: company.id },
  });
  if (!existingSub) {
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    await prisma.tenantSubscription.create({
      data: {
        tenantId: company.id,
        planId: enterprisePlan.id,
        startDate: new Date(),
        endDate: oneYearLater,
        status: 'ACTIVE',
        autoRenew: true,
        notes: 'Default seeded subscription',
      },
    });
    console.log('✅ Tenant subscription assigned to Demo Cafe');
  }

  // Create default outlet
  const outlet = await prisma.outlet.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MAIN' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Main Outlet',
      code: 'MAIN',
      address: '123 Demo Street',
      phone: '+62211234567',
      email: 'main@democafe.com',
      taxRate: 11,
      serviceCharge: 5,
    },
  });
  console.log('✅ Outlet created:', outlet.name);

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'admin@democafe.com' } },
    update: {},
    create: {
      companyId: company.id,
      outletId: outlet.id,
      email: 'admin@democafe.com',
      passwordHash,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create categories
  const coffeeCategory = await prisma.category.upsert({
    where: { outletId_name: { outletId: outlet.id, name: 'Coffee' } },
    update: {},
    create: { outletId: outlet.id, name: 'Coffee', description: 'Freshly brewed coffee', sortOrder: 1 },
  });

  const nonCoffeeCategory = await prisma.category.upsert({
    where: { outletId_name: { outletId: outlet.id, name: 'Non Coffee' } },
    update: {},
    create: { outletId: outlet.id, name: 'Non Coffee', description: 'Non-coffee beverages', sortOrder: 2 },
  });

  const foodCategory = await prisma.category.upsert({
    where: { outletId_name: { outletId: outlet.id, name: 'Food' } },
    update: {},
    create: { outletId: outlet.id, name: 'Food', description: 'Food items', sortOrder: 3 },
  });

  const snackCategory = await prisma.category.upsert({
    where: { outletId_name: { outletId: outlet.id, name: 'Snack' } },
    update: {},
    create: { outletId: outlet.id, name: 'Snack', description: 'Light snacks', sortOrder: 4 },
  });

  console.log('✅ Categories created');

  // Create products
  const products = [
    { sku: 'ESP-001', name: 'Espresso', description: 'Single shot espresso', basePrice: 20000, costPrice: 8000, categoryId: coffeeCategory.id },
    { sku: 'LAT-001', name: 'Caffe Latte', description: 'Espresso with steamed milk', basePrice: 30000, costPrice: 12000, categoryId: coffeeCategory.id },
    { sku: 'ICL-001', name: 'Iced Latte', description: 'Espresso with cold milk and ice', basePrice: 35000, costPrice: 13000, categoryId: coffeeCategory.id },
    { sku: 'CAP-001', name: 'Cappuccino', description: 'Espresso with steamed milk and foam', basePrice: 30000, costPrice: 12000, categoryId: coffeeCategory.id },
    { sku: 'AMR-001', name: 'Americano', description: 'Espresso with hot water', basePrice: 25000, costPrice: 9000, categoryId: coffeeCategory.id },
    { sku: 'MOC-001', name: 'Mocha', description: 'Espresso with chocolate and milk', basePrice: 38000, costPrice: 15000, categoryId: coffeeCategory.id },
    { sku: 'TGR-001', name: 'Teh Tarik', description: 'Pulled milk tea', basePrice: 22000, costPrice: 8000, categoryId: nonCoffeeCategory.id },
    { sku: 'MTG-001', name: 'Matcha Latte', description: 'Japanese green tea with milk', basePrice: 35000, costPrice: 14000, categoryId: nonCoffeeCategory.id },
    { sku: 'CHC-001', name: 'Chocolate', description: 'Hot chocolate', basePrice: 28000, costPrice: 11000, categoryId: nonCoffeeCategory.id },
    { sku: 'NFG-001', name: 'Nasi Goreng', description: 'Indonesian fried rice', basePrice: 45000, costPrice: 20000, categoryId: foodCategory.id },
    { sku: 'MGG-001', name: 'Mie Goreng', description: 'Indonesian fried noodles', basePrice: 40000, costPrice: 18000, categoryId: foodCategory.id },
    { sku: 'SGG-001', name: 'Sate Ayam', description: 'Chicken satay with peanut sauce', basePrice: 50000, costPrice: 25000, categoryId: foodCategory.id },
    { sku: 'FRF-001', name: 'French Fries', description: 'Crispy french fries', basePrice: 25000, costPrice: 10000, categoryId: snackCategory.id },
    { sku: 'OSR-001', name: 'Onion Rings', description: 'Crispy onion rings', basePrice: 28000, costPrice: 12000, categoryId: snackCategory.id },
    { sku: 'CKW-001', name: 'Chicken Wings', description: 'Crispy chicken wings', basePrice: 40000, costPrice: 18000, categoryId: snackCategory.id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { outletId_sku: { outletId: outlet.id, sku: product.sku } },
      update: {},
      create: {
        outletId: outlet.id,
        categoryId: product.categoryId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        costPrice: product.costPrice,
        status: ProductStatus.AVAILABLE,
        isActive: true,
      },
    });
  }
  console.log('✅ Products created:', products.length);

  // Create variants for Iced Latte
  const icedLatte = await prisma.product.findFirst({ where: { sku: 'ICL-001', outletId: outlet.id } });
  if (icedLatte) {
    await prisma.productVariant.upsert({
      where: { id: 'variant-regular' },
      update: {},
      create: { id: 'variant-regular', productId: icedLatte.id, name: 'Regular', price: 0, sortOrder: 1 },
    });
    await prisma.productVariant.upsert({
      where: { id: 'variant-large' },
      update: {},
      create: { id: 'variant-large', productId: icedLatte.id, name: 'Large', price: 5000, sortOrder: 2 },
    });
    console.log('✅ Variants created for Iced Latte');
  }

  // Create modifier groups
  const sugarGroup = await prisma.modifierGroup.upsert({
    where: { id: 'mod-sugar' },
    update: {},
    create: {
      id: 'mod-sugar',
      productId: icedLatte?.id || '',
      name: 'Sugar Level',
      minSelect: 1,
      maxSelect: 1,
      isRequired: true,
      sortOrder: 1,
    },
  });

  const iceGroup = await prisma.modifierGroup.upsert({
    where: { id: 'mod-ice' },
    update: {},
    create: {
      id: 'mod-ice',
      productId: icedLatte?.id || '',
      name: 'Ice Level',
      minSelect: 1,
      maxSelect: 1,
      isRequired: true,
      sortOrder: 2,
    },
  });

  const toppingGroup = await prisma.modifierGroup.upsert({
    where: { id: 'mod-topping' },
    update: {},
    create: {
      id: 'mod-topping',
      productId: icedLatte?.id || '',
      name: 'Toppings',
      minSelect: 0,
      maxSelect: 3,
      isRequired: false,
      sortOrder: 3,
    },
  });

  // Create modifier options
  const sugarOptions = [
    { modifierGroupId: sugarGroup.id, name: 'Normal', price: 0, sortOrder: 1 },
    { modifierGroupId: sugarGroup.id, name: 'Less Sugar', price: 0, sortOrder: 2 },
    { modifierGroupId: sugarGroup.id, name: 'No Sugar', price: 0, sortOrder: 3 },
  ];

  const iceOptions = [
    { modifierGroupId: iceGroup.id, name: 'Normal', price: 0, sortOrder: 1 },
    { modifierGroupId: iceGroup.id, name: 'Less Ice', price: 0, sortOrder: 2 },
    { modifierGroupId: iceGroup.id, name: 'No Ice', price: 0, sortOrder: 3 },
  ];

  const toppingOptions = [
    { modifierGroupId: toppingGroup.id, name: 'Extra Shot', price: 8000, sortOrder: 1 },
    { modifierGroupId: toppingGroup.id, name: 'Whipped Cream', price: 5000, sortOrder: 2 },
    { modifierGroupId: toppingGroup.id, name: 'Caramel Drizzle', price: 3000, sortOrder: 3 },
  ];

  for (const opt of [...sugarOptions, ...iceOptions, ...toppingOptions]) {
    const optId = `mod-opt-${opt.modifierGroupId}-${opt.name.replace(/\s/g, '-').toLowerCase()}`;
    await prisma.modifierOption.upsert({
      where: { id: optId },
      update: {},
      create: { ...opt, id: optId },
    });
  }
  console.log('✅ Modifiers created');

  // Create tables
  for (let i = 1; i <= 10; i++) {
    const tableNumber = `T${i.toString().padStart(2, '0')}`;
    await prisma.table.upsert({
      where: { outletId_tableNumber: { outletId: outlet.id, tableNumber } },
      update: {},
      create: {
        outletId: outlet.id,
        tableNumber,
        name: `Table ${i}`,
        capacity: i <= 2 ? 2 : i <= 6 ? 4 : 6,
      },
    });
  }
  console.log('✅ Tables created: 10');

  // Generate QR codes for tables
  const tables = await prisma.table.findMany({ where: { outletId: outlet.id } });
  for (const table of tables) {
    const token = randomUUID();
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:3001/order';
    await prisma.qRCode.upsert({
      where: { tableId: table.id },
      update: {},
      create: {
        tableId: table.id,
        token,
        url: `${baseUrl}/${token}`,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✅ QR codes generated for', tables.length, 'tables');

  // ========================================================
  // 6. Seed Inventory Units, Ingredients & Recipes for Demo Cafe
  // ========================================================
  console.log('📦 Seeding Inventory & Recipe data...');
  const unitG = await prisma.unitOfMeasure.upsert({
    where: { companyId_symbol: { companyId: company.id, symbol: 'g' } },
    update: {},
    create: { companyId: company.id, name: 'Gram', symbol: 'g', baseUnit: 'g', conversionFactor: 1 },
  });
  const unitMl = await prisma.unitOfMeasure.upsert({
    where: { companyId_symbol: { companyId: company.id, symbol: 'ml' } },
    update: {},
    create: { companyId: company.id, name: 'Mililiter', symbol: 'ml', baseUnit: 'ml', conversionFactor: 1 },
  });
  const unitPcs = await prisma.unitOfMeasure.upsert({
    where: { companyId_symbol: { companyId: company.id, symbol: 'pcs' } },
    update: {},
    create: { companyId: company.id, name: 'Pieces / Buah', symbol: 'pcs', baseUnit: 'pcs', conversionFactor: 1 },
  });
  const unitShot = await prisma.unitOfMeasure.upsert({
    where: { companyId_symbol: { companyId: company.id, symbol: 'shot' } },
    update: {},
    create: { companyId: company.id, name: 'Espresso Shot', symbol: 'shot', baseUnit: 'shot', conversionFactor: 1 },
  });

  // Create Ingredients
  const ingKopi = await prisma.ingredient.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Biji Kopi Arabika House Blend' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Biji Kopi Arabika House Blend',
      sku: 'ING-KOP-001',
      category: 'Kopi & Teh',
      unitId: unitG.id,
      costPerUnit: 250, // Rp 250 / gram (Rp 250.000 / kg)
      minStockAlert: 500,
    },
  });

  const ingSusu = await prisma.ingredient.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Susu UHT Fresh Milk' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Susu UHT Fresh Milk',
      sku: 'ING-DAI-001',
      category: 'Dairy & Milk',
      unitId: unitMl.id,
      costPerUnit: 20, // Rp 20 / ml (Rp 20.000 / liter)
      minStockAlert: 1000,
    },
  });

  const ingKaramel = await prisma.ingredient.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Sirup Karamel Gourmet' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Sirup Karamel Gourmet',
      sku: 'ING-SRP-001',
      category: 'Sirup & Flavour',
      unitId: unitMl.id,
      costPerUnit: 80, // Rp 80 / ml
      minStockAlert: 200,
    },
  });

  const ingCup = await prisma.ingredient.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Paper Cup Takeaway 12oz' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Paper Cup Takeaway 12oz',
      sku: 'ING-PKG-001',
      category: 'Packaging',
      unitId: unitPcs.id,
      costPerUnit: 850, // Rp 850 / pcs
      minStockAlert: 50,
    },
  });

  // Seed Initial Stock in Outlet
  const stockItems = [
    { ingredientId: ingKopi.id, stock: 2500, min: 500, cost: 250 },
    { ingredientId: ingSusu.id, stock: 12000, min: 2000, cost: 20 },
    { ingredientId: ingKaramel.id, stock: 1500, min: 300, cost: 80 },
    { ingredientId: ingCup.id, stock: 350, min: 50, cost: 850 },
  ];

  for (const s of stockItems) {
    await prisma.outletInventory.upsert({
      where: {
        outletId_ingredientId: {
          outletId: outlet.id,
          ingredientId: s.ingredientId,
        },
      },
      update: {
        currentStock: s.stock,
        minStock: s.min,
        costPrice: s.cost,
      },
      create: {
        outletId: outlet.id,
        ingredientId: s.ingredientId,
        currentStock: s.stock,
        minStock: s.min,
        costPrice: s.cost,
      },
    });
  }
  console.log('✅ Inventory ingredients & stocks seeded');

  // Seed Recipes for existing products
  const allProducts = await prisma.product.findMany({ where: { outletId: outlet.id } });
  for (const prod of allProducts) {
    const pName = prod.name.toLowerCase();
    await prisma.recipeItem.deleteMany({ where: { productId: prod.id } });

    if (pName.includes('espresso')) {
      await prisma.recipeItem.create({
        data: {
          productId: prod.id,
          ingredientId: ingKopi.id,
          quantity: 18, // 18 gram coffee
          unitId: unitG.id,
          notes: 'Standard Double Shot Espresso',
        },
      });
    } else if (pName.includes('latte') || pName.includes('cappuccino')) {
      await prisma.recipeItem.createMany({
        data: [
          { productId: prod.id, ingredientId: ingKopi.id, quantity: 18, unitId: unitG.id, notes: 'Espresso base' },
          { productId: prod.id, ingredientId: ingSusu.id, quantity: 180, unitId: unitMl.id, notes: 'Steamed milk' },
          { productId: prod.id, ingredientId: ingCup.id, quantity: 1, unitId: unitPcs.id, notes: '12oz cup' },
        ],
      });
    } else if (pName.includes('caramel') || pName.includes('macchiato')) {
      await prisma.recipeItem.createMany({
        data: [
          { productId: prod.id, ingredientId: ingKopi.id, quantity: 18, unitId: unitG.id, notes: 'Espresso base' },
          { productId: prod.id, ingredientId: ingSusu.id, quantity: 160, unitId: unitMl.id, notes: 'Steamed milk' },
          { productId: prod.id, ingredientId: ingKaramel.id, quantity: 20, unitId: unitMl.id, notes: 'Caramel syrup' },
          { productId: prod.id, ingredientId: ingCup.id, quantity: 1, unitId: unitPcs.id, notes: '12oz cup' },
        ],
      });
    }
  }
  console.log('✅ Standard recipes attached to menu items');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });