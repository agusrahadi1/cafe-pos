'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant, ModifierOption, Discount } from '@/types';

export interface SelectedModifier {
  modifierGroupId: string;
  modifierGroupName: string;
  modifierOptionId: string;
  modifierOptionName: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item id in cart
  product: Product;
  variant?: ProductVariant;
  selectedModifiers: SelectedModifier[];
  quantity: number;
  notes?: string;
  unitPrice: number;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  tableId: string | null;
  tableNumber: string | null;
  outletId: string | null;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  subtotal: number;
  taxRate: number;
  serviceRate: number;
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  appliedDiscount: Discount | null;
  activeDiscounts: Discount[];
  totalAmount: number;
  setActiveDiscounts: (discounts: Discount[]) => void;
  setTableInfo: (tableId: string, tableNumber: string, outletId: string, tax?: number, service?: number) => void;
  setCustomerInfo: (name: string, phone: string, notes: string) => void;
  addItem: (product: Product, variant?: ProductVariant, modifiers?: SelectedModifier[], quantity?: number, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0); // default 0% (driven by cafe settings)
  const [serviceRate, setServiceRate] = useState<number>(0); // default 0% (driven by cafe settings)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cafe_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setCustomerName(parsed.customerName || '');
      }
    } catch {}
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('cafe_cart', JSON.stringify({ items, customerName }));
    } catch {}
  }, [items, customerName]);

  const setTableInfo = (tId: string, tNum: string, oId: string, tax = 0, service = 0) => {
    setTableId(tId);
    setTableNumber(tNum);
    setOutletId(oId);
    setTaxRate(tax);
    setServiceRate(service);
  };

  const setCustomerInfo = (name: string, phone: string, notes: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    setCustomerNotes(notes);
  };

  const addItem = (
    product: Product,
    variant?: ProductVariant,
    modifiers: SelectedModifier[] = [],
    quantity = 1,
    notes = ''
  ) => {
    const basePrice = variant ? Number(variant.price) : Number(product.basePrice);
    const modTotal = modifiers.reduce((sum, m) => sum + m.price, 0);
    const unitPrice = basePrice + modTotal;
    const totalPrice = unitPrice * quantity;

    const uniqueId = `${product.id}-${variant?.id || 'none'}-${modifiers
      .map((m) => m.modifierOptionId)
      .sort()
      .join('_')}-${notes}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === uniqueId);
      if (existing) {
        return prev.map((item) =>
          item.id === uniqueId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: uniqueId,
          product,
          variant,
          selectedModifiers: modifiers,
          quantity,
          notes,
          unitPrice,
          totalPrice,
        },
      ];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Compute best active discount
  let bestDiscount: Discount | null = null;
  let maxCalculatedDiscount = 0;

  for (const d of activeDiscounts) {
    if (!d.isActive) continue;
    const minOrder = d.minOrderAmount ? Number(d.minOrderAmount) : 0;
    if (subtotal < minOrder) continue;

    let eligibleSubtotal = 0;
    if (d.scope === 'ALL_ITEMS') {
      eligibleSubtotal = subtotal;
    } else {
      const productIds = (d.products || []).map((p) => p.productId);
      eligibleSubtotal = items
        .filter((item) => productIds.includes(item.product.id))
        .reduce((sum, item) => sum + item.totalPrice, 0);
    }

    if (eligibleSubtotal <= 0) continue;

    let currentDiscount = 0;
    if (d.type === 'PERCENTAGE') {
      currentDiscount = eligibleSubtotal * (Number(d.value) / 100);
      if (d.maxDiscount && Number(d.maxDiscount) > 0) {
        currentDiscount = Math.min(currentDiscount, Number(d.maxDiscount));
      }
    } else {
      currentDiscount = Math.min(eligibleSubtotal, Number(d.value));
    }

    if (currentDiscount > maxCalculatedDiscount) {
      maxCalculatedDiscount = currentDiscount;
      bestDiscount = d;
    }
  }

  const discountAmount = Math.round(maxCalculatedDiscount);
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(subtotalAfterDiscount * taxRate);
  const serviceChargeAmount = Math.round(subtotalAfterDiscount * serviceRate);
  const totalAmount = subtotalAfterDiscount + taxAmount + serviceChargeAmount;

  return (
    <CartContext.Provider
      value={{
        items,
        tableId,
        tableNumber,
        outletId,
        customerName,
        customerPhone,
        customerNotes,
        subtotal,
        taxRate,
        serviceRate,
        taxAmount,
        serviceChargeAmount,
        discountAmount,
        appliedDiscount: bestDiscount,
        activeDiscounts,
        totalAmount,
        setActiveDiscounts,
        setTableInfo,
        setCustomerInfo,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

