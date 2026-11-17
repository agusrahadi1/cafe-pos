export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'OWNER' | 'CASHIER' | 'WAITER' | 'KITCHEN';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: UserRole;
  companyId?: string;
  outletId?: string;
  phone?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    logoUrl?: string;
    tagline?: string;
  };
  outlet?: {
    id: string;
    name: string;
  };
  workShift?: {
    name?: string;
    startTime?: string;
    endTime?: string;
  };
}

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  id: string;
  outletId: string;
  cashierId: string;
  shiftName: string;
  startTime: string;
  endTime?: string | null;
  initialCash: number | string;
  totalSales: number | string;
  totalCash: number | string;
  totalNonCash: number | string;
  totalDiscount: number | string;
  totalTax: number | string;
  totalService: number | string;
  ordersCount: number;
  expectedCash: number | string;
  actualCash?: number | string | null;
  cashDifference?: number | string | null;
  notes?: string | null;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
  cashier?: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
  summary?: {
    ordersCount: number;
    totalSales: number;
    totalDiscount: number;
    totalTax: number;
    totalService: number;
    totalCash: number;
    totalNonCash: number;
    initialCash: number;
    expectedCash: number;
    paymentBreakdown: Record<string, { count: number; total: number }>;
  };
}

export interface Table {
  id: string;
  outletId: string;
  tableNumber: string;
  name?: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'ORDERING' | 'PREPARING' | 'WAITING_DELIVERY' | 'COMPLETED' | 'RESERVED' | 'DISABLED';
  isActive: boolean;
  qrToken?: string;
  qrCode?: {
    id: string;
    token: string;
    url: string;
    status: string;
  };
}

export interface ModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  price: number | string;
  sortOrder: number;
  isActive: boolean;
}

export interface ModifierGroup {
  id: string;
  productId: string;
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: ModifierOption[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number | string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  outletId: string;
  categoryId: string;
  sku: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number | string;
  costPrice?: number | string;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'INACTIVE';
  sortOrder: number;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  };
  variants?: ProductVariant[];
  modifiers?: ModifierGroup[];
}

export interface Category {
  id: string;
  outletId: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  products?: Product[];
}

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'QRIS'
  | 'BORDERPAY'
  | 'XENDIT'
  | 'MIDTRANS'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'E_WALLET'
  | 'BANK_TRANSFER';

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type BalanceMutationType =
  | 'QRIS_SALE'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_FEE'
  | 'WITHDRAWAL_REFUND'
  | 'ADJUSTMENT';

export interface Withdrawal {
  id: string;
  companyId: string;
  amount: number | string;
  fee: number | string;
  netAmount: number | string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status: WithdrawalStatus;
  referenceId: string;
  disbursementId?: string | null;
  failReason?: string | null;
  notes?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    qrisBalance?: number | string;
  };
}

export interface BalanceMutation {
  id: string;
  companyId: string;
  type: BalanceMutationType;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface PayoutConfig {
  qrisBalance: number;
  totalWithdrawn: number;
  payoutFee: number;
  defaultBank: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
}

export type PaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface OrderItemModifier {
  id: string;
  modifierGroupId: string;
  modifierGroupName: string;
  modifierOptionId: string;
  modifierOptionName: string;
  price: number | string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number | string;
  quantity: number;
  totalPrice?: number | string;
  subtotal?: number | string;
  discountAmount?: number | string;
  notes?: string;
  modifiers?: OrderItemModifier[];
}

export interface Payment {
  id: string;
  orderId: string;
  paymentNumber: string;
  method: PaymentMethod;
  amount: number | string;
  status: PaymentStatus;
  provider?: string;
  reference?: string;
  metadata?: any;
  paidAt?: string;
}

export interface Order {
  id: string;
  outletId: string;
  tableId?: string;
  table?: Table;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  status: OrderStatus;
  subtotal: number | string;
  taxAmount: number | string;
  serviceChargeAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments?: Payment[];
  paymentMethod?: PaymentMethod;
  outlet?: any;
}

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  maxProducts: number;
  maxStaffAccounts: number;
  features?: string[];
  isActive: boolean;
  activeSubscribers?: number;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  notes?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  receiptFooter?: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  activeSubscription?: {
    id: string;
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
    plan: SubscriptionPlan;
  };
  owner?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
  };
  counts?: {
    outlets: number;
    staff: number;
    products: number;
    orders: number;
  };
  quotas?: {
    products: { used: number; max: number; isUnlimited: boolean };
    staff: { used: number; max: number; isUnlimited: boolean };
  };
}

export interface PlatformAnalytics {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    expired: number;
  };
  subscriptions: {
    active: number;
    total: number;
    mrr: number;
    arr: number;
  };
  ecosystem: {
    totalOrders: number;
    totalGmv: number;
  };
}

export type StockMovementType = 'IN_PURCHASE' | 'OUT_SALE' | 'IN_RETURN' | 'OUT_WASTE' | 'ADJUSTMENT';

export interface UnitOfMeasure {
  id: string;
  companyId: string;
  name: string;
  symbol: string;
  baseUnit?: string;
  conversionFactor: number;
  isActive: boolean;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  companyId: string;
  unitId: string;
  unit: UnitOfMeasure;
  sku?: string;
  name: string;
  category?: string;
  costPerUnit: number;
  minStockAlert: number;
  isActive: boolean;
  inventoryId?: string;
  currentStock?: number;
  minStock?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  costPrice?: number;
  totalStockValue?: number;
  createdAt?: string;
}

export interface OutletInventory {
  id: string;
  outletId: string;
  ingredientId: string;
  ingredient: Ingredient;
  currentStock: number;
  minStock: number;
  costPrice: number;
  lastStockTakeAt?: string;
}

export interface RecipeItem {
  id: string;
  productId: string;
  productVariantId?: string;
  modifierOptionId?: string;
  ingredientId: string;
  ingredient: Ingredient;
  unitId?: string;
  unit?: UnitOfMeasure;
  quantity: number;
  notes?: string;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  inventory: {
    outletId: string;
    ingredient: {
      id: string;
      name: string;
      category?: string;
      unit: UnitOfMeasure;
    };
  };
  type: StockMovementType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  unitCost?: number;
  totalCost?: number;
  referenceNumber?: string;
  orderId?: string;
  notes?: string;
  createdBy?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountScope = 'ALL_ITEMS' | 'SPECIFIC_PRODUCTS';

export interface DiscountProduct {
  id: string;
  discountId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    basePrice: number | string;
    image?: string | null;
    category?: { id: string; name: string };
  };
}

export interface Discount {
  id: string;
  outletId: string;
  name: string;
  description?: string | null;
  code?: string | null;
  type: DiscountType;
  value: number | string;
  scope: DiscountScope;
  minOrderAmount?: number | string | null;
  maxDiscount?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: DiscountProduct[];
}
