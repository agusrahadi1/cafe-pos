'use client';

import React from 'react';
import { Product } from '@/types';
import { formatRupiah, getImageUrl } from '@/lib/utils';
import { Plus, Coffee, Sparkles, ChevronRight, ArrowRight, TrendingUp } from 'lucide-react';

interface PopularProductsWidgetProps {
  products: Product[];
  onOpenNewOrder: () => void;
  onSelectProduct?: (product: Product) => void;
}

export default function PopularProductsWidget({
  products,
  onOpenNewOrder,
  onSelectProduct,
}: PopularProductsWidgetProps) {
  // Take top 5 available products or default list
  const popularItems = products.filter((p) => p.status === 'AVAILABLE').slice(0, 5);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* 1. Menu Populer List Card */}
      <div className="flex-1 bg-white rounded-3xl border border-stone-200/80 p-4 flex flex-col justify-between shadow-2xs overflow-hidden">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-xs text-stone-900 tracking-tight">
                Menu Populer
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenNewOrder}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* List of items */}
          <div className="space-y-2.5 overflow-y-auto max-h-[320px] pr-0.5 scrollbar-none">
            {popularItems.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Belum ada data menu
              </div>
            ) : (
              popularItems.map((item, idx) => {
                const rankNumber = String(idx + 1).padStart(2, '0');
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectProduct?.(item)}
                    className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-stone-50 transition cursor-pointer group"
                  >
                    {/* Rank */}
                    <span className="text-xs font-mono font-bold text-stone-400 w-5 text-center shrink-0">
                      {rankNumber}
                    </span>

                    {/* Image / Icon */}
                    <div className="w-11 h-11 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center border border-stone-100">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Coffee className="w-5 h-5 text-stone-400" />
                      )}
                    </div>

                    {/* Name & Price */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-stone-800 truncate group-hover:text-orange-600 transition">
                        {item.name}
                      </p>
                      <p className="font-mono text-[11px] font-extrabold text-stone-900 mt-0.5">
                        {formatRupiah(item.basePrice)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Primary Big Action Button */}
        <div className="pt-3 border-t border-stone-100 mt-2">
          <button
            type="button"
            onClick={onOpenNewOrder}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-2xl transition shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Pesanan Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}

