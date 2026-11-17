'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, ModifierOption } from '@/types';
import { useCart, SelectedModifier } from '@/context/CartContext';
import { formatRupiah, getImageUrl } from '@/lib/utils';
import { X, Plus, Minus, Check, Coffee } from 'lucide-react';

interface ModifierModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ModifierModal({ product, onClose }: ModifierModalProps) {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      // Pre-select first variant if available
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setSelectedModifiers([]);
      setQuantity(1);
      setNotes('');
      setValidationError(null);
    }
  }, [product]);

  if (!product) return null;

  const handleModifierToggle = (
    group: { id: string; name: string; minSelect: number; maxSelect: number },
    option: ModifierOption
  ) => {
    const isSingleSelect = group.maxSelect === 1;

    setSelectedModifiers((prev) => {
      const isAlreadySelected = prev.some((m) => m.modifierOptionId === option.id);

      if (isSingleSelect) {
        // Filter out other options from this group
        const withoutGroup = prev.filter((m) => m.modifierGroupId !== group.id);
        if (isAlreadySelected) {
          // If required (minSelect >= 1), do not deselect
          if (group.minSelect >= 1) return prev;
          return withoutGroup;
        }
        return [
          ...withoutGroup,
          {
            modifierGroupId: group.id,
            modifierGroupName: group.name,
            modifierOptionId: option.id,
            modifierOptionName: option.name,
            price: Number(option.price),
          },
        ];
      } else {
        // Multi-select
        if (isAlreadySelected) {
          return prev.filter((m) => m.modifierOptionId !== option.id);
        } else {
          // Check maxSelect limit
          const currentGroupCount = prev.filter((m) => m.modifierGroupId === group.id).length;
          if (currentGroupCount >= group.maxSelect) {
            return prev;
          }
          return [
            ...prev,
            {
              modifierGroupId: group.id,
              modifierGroupName: group.name,
              modifierOptionId: option.id,
              modifierOptionName: option.name,
              price: Number(option.price),
            },
          ];
        }
      }
    });
  };

  const currentBasePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.basePrice);
  const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const unitPrice = currentBasePrice + modifiersPrice;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    // Validate required modifier groups
    if (product.modifiers) {
      for (const group of product.modifiers) {
        if (group.isRequired || group.minSelect > 0) {
          const selectedInGroup = selectedModifiers.filter((m) => m.modifierGroupId === group.id);
          if (selectedInGroup.length < group.minSelect) {
            setValidationError(`Silakan pilih opsi untuk "${group.name}" (minimal ${group.minSelect})`);
            return;
          }
        }
      }
    }

    addItem(product, selectedVariant, selectedModifiers, quantity, notes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative select-none pb-safe"
      >
        {/* Flutter Drag Handle Pill */}
        <div className="pt-3 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            {product.image ? (
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 shrink-0 flex items-center justify-center">
                <Coffee className="w-6 h-6 stroke-1 text-amber-600" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-black text-stone-900 text-base truncate">{product.name}</h3>
              <p className="text-xs text-stone-500 line-clamp-1">
                {product.description || 'Pilih kustomisasi pesanan Anda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200/80 transition active:scale-90 cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-4 overflow-y-auto space-y-5 flex-1 no-scrollbar">
          {validationError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100">
              {validationError}
            </div>
          )}

          {/* Variants Section */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-black text-stone-900 uppercase tracking-wider mb-2">
                Pilih Varian
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-2xl border text-left flex justify-between items-center transition-all duration-150 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-2xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                      }`}
                    >
                      <span className="text-xs">{variant.name}</span>
                      <span className="text-[11px] text-amber-800 font-extrabold">{formatRupiah(variant.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups Section */}
          {product.modifiers &&
            product.modifiers.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    {group.name}
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {group.isRequired ? (
                      <span className="text-red-500 font-bold">Wajib • </span>
                    ) : (
                      'Opsional • '
                    )}
                    {group.maxSelect === 1 ? 'Pilih 1' : `Maks ${group.maxSelect}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.options.map((option) => {
                    const isSelected = selectedModifiers.some((m) => m.modifierOptionId === option.id);
                    const optPrice = Number(option.price);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleModifierToggle(group, option)}
                        className={`w-full p-2.5 rounded-2xl border text-left flex justify-between items-center transition-all duration-150 active:scale-[0.99] cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/60 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-500/20'
                            : 'border-stone-200/80 hover:border-stone-300 text-stone-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-4 h-4 ${
                              group.maxSelect === 1 ? 'rounded-full' : 'rounded-lg'
                            } border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-semibold">{option.name}</span>
                        </div>

                        {optPrice > 0 && (
                          <span className="text-xs text-amber-800 font-black">
                            +{formatRupiah(optPrice)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-black text-stone-900 uppercase tracking-wider mb-1.5">
              Catatan Menu (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Jangan terlalu manis, less ice, pedas sedang, dll."
              rows={2}
              className="w-full text-xs p-3 bg-stone-100/80 border border-transparent rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition resize-none font-medium"
            />
          </div>
        </div>

        {/* Bottom Bar: Quantity & Add Button */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center border border-stone-200 rounded-2xl bg-white p-1 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 disabled:opacity-30 transition active:scale-75 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xs font-black text-stone-900">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-amber-700 hover:bg-amber-50 transition active:scale-75 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-amber-600/25 flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
          >
            <span>Tambah ke Keranjang</span>
            <span className="font-black text-sm">{formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
