'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import {
  Ingredient,
  UnitOfMeasure,
  StockMovement,
  StockMovementType,
  Product,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/lib/utils';
import {
  Boxes,
  Package,
  ChefHat,
  History,
  AlertTriangle,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface RecipeProductItem {
  id: string;
  sku?: string;
  name: string;
  category: string;
  image?: string;
  basePrice: number;
  cogs: number;
  profit: number;
  marginPercent: number;
  hasRecipe: boolean;
  recipeItems: Array<{
    id: string;
    ingredientId: string;
    quantity: number;
    notes?: string;
    ingredient: Ingredient;
  }>;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    hasCustomRecipe: boolean;
    cogs: number;
    profit: number;
    marginPercent: number;
    recipeItems: Array<{
      id: string;
      ingredientId: string;
      quantity: number;
      notes?: string;
      ingredient: Ingredient;
    }>;
  }>;
}

interface LowStockAlert {
  inventoryId: string;
  ingredientId: string;
  name: string;
  category?: string;
  currentStock: number;
  minStock: number;
  unit: string;
  isOutOfStock: boolean;
}

export default function AdminInventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Active Tab: 'stock' | 'ingredients' | 'recipes' | 'movements'
  const [activeTab, setActiveTab] = useState<'stock' | 'ingredients' | 'recipes' | 'movements'>('stock');

  // Main Data States
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [recipeProducts, setRecipeProducts] = useState<RecipeProductItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notifications / Feedback
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // ----------------------------------------------------
  // FILTER STATES
  // ----------------------------------------------------
  const [searchStock, setSearchStock] = useState('');
  const [selectedStockCategory, setSelectedStockCategory] = useState('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const [searchRecipe, setSearchRecipe] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [movementIngredientFilter, setMovementIngredientFilter] = useState<string>('ALL');

  // ----------------------------------------------------
  // MODAL STATES
  // ----------------------------------------------------
  // 1. Add / Edit Ingredient Modal
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingFormName, setIngFormName] = useState('');
  const [ingFormSku, setIngFormSku] = useState('');
  const [ingFormCategory, setIngFormCategory] = useState('Bahan Baku');
  const [ingFormUnitId, setIngFormUnitId] = useState('');
  const [ingFormCostPerUnit, setIngFormCostPerUnit] = useState<number | string>('');
  const [ingFormMinStock, setIngFormMinStock] = useState<number | string>('10');
  const [ingFormInitialStock, setIngFormInitialStock] = useState<number | string>('0');
  const [isSubmittingIngredient, setIsSubmittingIngredient] = useState(false);

  // 2. Adjust Stock / Stock Opname / Waste Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetIngredient, setAdjustTargetIngredient] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>('IN_PURCHASE');
  const [adjustQty, setAdjustQty] = useState<number | string>('');
  const [adjustIsAbsolute, setAdjustIsAbsolute] = useState(false);
  const [adjustUnitCost, setAdjustUnitCost] = useState<number | string>('');
  const [adjustRefNo, setAdjustRefNo] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // 3. Recipe Builder Modal
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeTargetProduct, setRecipeTargetProduct] = useState<RecipeProductItem | null>(null);
  const [recipeSelectedVariantId, setRecipeSelectedVariantId] = useState<string>('');
  const [recipeLines, setRecipeLines] = useState<Array<{
    ingredientId: string;
    quantity: number | string;
    notes?: string;
  }>>([]);
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);

  // 4. Units Management Modal
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [isSubmittingUnit, setIsSubmittingUnit] = useState(false);

  // ----------------------------------------------------
  // AUTH GUARD
  // ----------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const fetchAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setActionError('');
    try {
      const [ingsRes, unitsRes, alertsRes, recipesRes, movsRes] = await Promise.all([
        api.get<Ingredient[]>('/inventory/ingredients').catch(() => []),
        api.get<UnitOfMeasure[]>('/inventory/units').catch(() => []),
        api.get<LowStockAlert[]>('/inventory/alerts').catch(() => []),
        api.get<RecipeProductItem[]>('/inventory/recipes').catch(() => []),
        api.get<StockMovement[]>('/inventory/movements?limit=100').catch(() => []),
      ]);

      if (Array.isArray(ingsRes)) setIngredients(ingsRes);
      if (Array.isArray(unitsRes)) {
        setUnits(unitsRes);
        if (unitsRes.length > 0 && !ingFormUnitId) {
          setIngFormUnitId(unitsRes[0].id);
        }
      }
      if (Array.isArray(alertsRes)) setAlerts(alertsRes);
      if (Array.isArray(recipesRes)) setRecipeProducts(recipesRes);
      if (Array.isArray(movsRes)) setMovements(movsRes);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setActionError(err.message || 'Gagal memuat data inventori.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // ----------------------------------------------------
  // COMPUTED STATS
  // ----------------------------------------------------
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    ingredients.forEach((ing) => {
      if (ing.category) set.add(ing.category);
    });
    return Array.from(set);
  }, [ingredients]);

  const totalAssetValue = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + (ing.totalStockValue || 0), 0);
  }, [ingredients]);

  const lowStockCount = useMemo(() => {
    return alerts.length;
  }, [alerts]);

  const outOfStockCount = useMemo(() => {
    return alerts.filter((a) => a.isOutOfStock).length;
  }, [alerts]);

  // Filtered Stock Table
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchQuery =
        ing.name.toLowerCase().includes(searchStock.toLowerCase()) ||
        (ing.sku && ing.sku.toLowerCase().includes(searchStock.toLowerCase()));
      const matchCat =
        selectedStockCategory === 'ALL' || ing.category === selectedStockCategory;
      const matchLowStock = !filterLowStockOnly || (ing.currentStock || 0) <= (ing.minStock || 0);
      return matchQuery && matchCat && matchLowStock;
    });
  }, [ingredients, searchStock, selectedStockCategory, filterLowStockOnly]);

  // Filtered Recipes Table
  const filteredRecipes = useMemo(() => {
    return recipeProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchRecipe.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchRecipe.toLowerCase()))
      );
    });
  }, [recipeProducts, searchRecipe]);

  // Filtered Movements Table
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchType = movementTypeFilter === 'ALL' || m.type === movementTypeFilter;
      const matchIng =
        movementIngredientFilter === 'ALL' ||
        m.inventory?.ingredient?.id === movementIngredientFilter;
      return matchType && matchIng;
    });
  }, [movements, movementTypeFilter, movementIngredientFilter]);

  // ----------------------------------------------------
  // INGREDIENT ACTIONS (CREATE / EDIT / DELETE)
  // ----------------------------------------------------
  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIngFormName('');
    setIngFormSku('');
    setIngFormCategory('Bahan Baku');
    setIngFormUnitId(units[0]?.id || '');
    setIngFormCostPerUnit('');
    setIngFormMinStock('10');
    setIngFormInitialStock('0');
    setIsIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngFormName(ing.name);
    setIngFormSku(ing.sku || '');
    setIngFormCategory(ing.category || 'Bahan Baku');
    setIngFormUnitId(ing.unitId || ing.unit?.id || '');
    setIngFormCostPerUnit(ing.costPerUnit || 0);
    setIngFormMinStock(ing.minStockAlert || 10);
    setIngFormInitialStock(ing.currentStock || 0);
    setIsIngredientModalOpen(true);
  };

  const handleSubmitIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingFormName.trim() || !ingFormUnitId) {
      alert('Nama bahan baku dan satuan wajib diisi.');
      return;
    }

    setIsSubmittingIngredient(true);
    try {
      if (editingIngredient) {
        // UPDATE
        await api.put(`/inventory/ingredients/${editingIngredient.id}`, {
          name: ingFormName.trim(),
          sku: ingFormSku.trim() || undefined,
          category: ingFormCategory.trim() || 'Bahan Baku',
          unitId: ingFormUnitId,
          costPerUnit: Number(ingFormCostPerUnit) || 0,
          minStockAlert: Number(ingFormMinStock) || 0,
        });
        showSuccess(`Bahan baku "${ingFormName}" berhasil diperbarui.`);
      } else {
        // CREATE
        await api.post('/inventory/ingredients', {
          name: ingFormName.trim(),
          sku: ingFormSku.trim() || undefined,
          category: ingFormCategory.trim() || 'Bahan Baku',
          unitId: ingFormUnitId,
          costPerUnit: Number(ingFormCostPerUnit) || 0,
          minStockAlert: Number(ingFormMinStock) || 0,
          initialStock: Number(ingFormInitialStock) || 0,
        });
        showSuccess(`Bahan baku "${ingFormName}" berhasil ditambahkan.`);
      }
      setIsIngredientModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan bahan baku.');
    } finally {
      setIsSubmittingIngredient(false);
    }
  };

  const handleDeleteIngredient = async (ing: Ingredient) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan bahan "${ing.name}"?`)) return;
    try {
      await api.delete(`/inventory/ingredients/${ing.id}`);
      showSuccess(`Bahan baku "${ing.name}" telah dinonaktifkan.`);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menonaktifkan bahan baku.');
    }
  };

  // ----------------------------------------------------
  // STOCK ADJUSTMENT ACTIONS
  // ----------------------------------------------------
  const handleOpenAdjustModal = (
    ing?: Ingredient,
    defaultType: StockMovementType = 'IN_PURCHASE'
  ) => {
    const target = ing || ingredients[0] || null;
    setAdjustTargetIngredient(target);
    setAdjustType(defaultType);
    setAdjustQty('');
    setAdjustIsAbsolute(false);
    setAdjustUnitCost(target?.costPerUnit || '');
    setAdjustRefNo('');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSubmitAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetIngredient) return;
    const qtyNum = parseFloat(String(adjustQty));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      alert('Jumlah (quantity) harus lebih besar dari 0.');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      await api.post('/inventory/stocks/adjust', {
        ingredientId: adjustTargetIngredient.id,
        type: adjustType,
        quantity: qtyNum,
        isSetAbsolute: adjustIsAbsolute,
        unitCost: adjustUnitCost ? parseFloat(String(adjustUnitCost)) : undefined,
        referenceNumber: adjustRefNo.trim() || undefined,
        notes: adjustNotes.trim() || undefined,
      });

      showSuccess(`Penyesuaian stok untuk "${adjustTargetIngredient.name}" berhasil dicatat.`);
      setIsAdjustModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyesuaikan stok.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // ----------------------------------------------------
  // RECIPE BUILDER ACTIONS
  // ----------------------------------------------------
  const handleOpenRecipeModal = (product: RecipeProductItem) => {
    setRecipeTargetProduct(product);
    const defaultVariant = product.variants.length > 0 ? product.variants[0].id : '';
    setRecipeSelectedVariantId(defaultVariant);

    // Populate existing recipe items
    let existingItems = product.recipeItems;
    if (defaultVariant) {
      const v = product.variants.find((vr) => vr.id === defaultVariant);
      if (v && v.recipeItems.length > 0) {
        existingItems = v.recipeItems;
      }
    }

    if (existingItems && existingItems.length > 0) {
      setRecipeLines(
        existingItems.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          notes: item.notes || '',
        }))
      );
    } else {
      setRecipeLines([]);
    }

    setIsRecipeModalOpen(true);
  };

  const handleVariantChangeInRecipe = (variantId: string) => {
    setRecipeSelectedVariantId(variantId);
    if (!recipeTargetProduct) return;

    if (!variantId) {
      // Product base recipe
      setRecipeLines(
        recipeTargetProduct.recipeItems.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          notes: item.notes || '',
        }))
      );
    } else {
      const variant = recipeTargetProduct.variants.find((v) => v.id === variantId);
      if (variant && variant.recipeItems.length > 0) {
        setRecipeLines(
          variant.recipeItems.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            notes: item.notes || '',
          }))
        );
      } else {
        // Fallback to base product recipe or empty
        setRecipeLines(
          recipeTargetProduct.recipeItems.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            notes: item.notes || '',
          }))
        );
      }
    }
  };

  const handleAddRecipeLine = () => {
    if (ingredients.length === 0) {
      alert('Belum ada bahan baku. Tambahkan bahan baku terlebih dahulu.');
      return;
    }
    setRecipeLines([
      ...recipeLines,
      {
        ingredientId: ingredients[0].id,
        quantity: 1,
        notes: '',
      },
    ]);
  };

  const handleRemoveRecipeLine = (index: number) => {
    setRecipeLines(recipeLines.filter((_, i) => i !== index));
  };

  const handleUpdateRecipeLine = (
    index: number,
    field: 'ingredientId' | 'quantity' | 'notes',
    value: any
  ) => {
    const updated = [...recipeLines];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeLines(updated);
  };

  // Recipe Builder Realtime Cost Calculation
  const recipeCalculatedHpp = useMemo(() => {
    return recipeLines.reduce((acc, line) => {
      const ing = ingredients.find((i) => i.id === line.ingredientId);
      const qty = parseFloat(String(line.quantity)) || 0;
      const unitCost = ing ? Number(ing.costPerUnit) : 0;
      return acc + qty * unitCost;
    }, 0);
  }, [recipeLines, ingredients]);

  const recipeTargetPrice = useMemo(() => {
    if (!recipeTargetProduct) return 0;
    if (recipeSelectedVariantId) {
      const v = recipeTargetProduct.variants.find((vr) => vr.id === recipeSelectedVariantId);
      return v ? v.price : recipeTargetProduct.basePrice;
    }
    return recipeTargetProduct.basePrice;
  }, [recipeTargetProduct, recipeSelectedVariantId]);

  const recipeEstimatedProfit = recipeTargetPrice - recipeCalculatedHpp;
  const recipeEstimatedMargin =
    recipeTargetPrice > 0 ? (recipeEstimatedProfit / recipeTargetPrice) * 100 : 0;

  const handleSubmitRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeTargetProduct) return;

    // Validate lines
    for (const line of recipeLines) {
      const q = parseFloat(String(line.quantity));
      if (isNaN(q) || q <= 0) {
        alert('Setiap takaran bahan harus bernilai angka lebih dari 0.');
        return;
      }
    }

    setIsSubmittingRecipe(true);
    try {
      await api.post('/inventory/recipes', {
        productId: recipeTargetProduct.id,
        productVariantId: recipeSelectedVariantId || undefined,
        items: recipeLines.map((line) => ({
          ingredientId: line.ingredientId,
          quantity: parseFloat(String(line.quantity)),
          notes: line.notes || undefined,
        })),
      });

      showSuccess(`Resep untuk "${recipeTargetProduct.name}" berhasil disimpan.`);
      setIsRecipeModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan resep.');
    } finally {
      setIsSubmittingRecipe(false);
    }
  };

  // ----------------------------------------------------
  // UNIT MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitSymbol.trim()) return;

    setIsSubmittingUnit(true);
    try {
      const created = await api.post<UnitOfMeasure>('/inventory/units', {
        name: newUnitName.trim(),
        symbol: newUnitSymbol.trim().toLowerCase(),
      });
      setUnits([...units, created]);
      setNewUnitName('');
      setNewUnitSymbol('');
      showSuccess(`Satuan "${created.name} (${created.symbol})" berhasil dibuat.`);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat satuan.');
    } finally {
      setIsSubmittingUnit(false);
    }
  };

  // ----------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------
  const renderMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'IN_PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ArrowDownRight className="w-3.5 h-3.5" /> Pembelian / Masuk
          </span>
        );
      case 'OUT_SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <ArrowUpRight className="w-3.5 h-3.5" /> Penjualan POS
          </span>
        );
      case 'IN_RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <ArrowDownRight className="w-3.5 h-3.5" /> Retur Pembatalan
          </span>
        );
      case 'OUT_WASTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            <ArrowUpRight className="w-3.5 h-3.5" /> Waste / Basi / Rusak
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            <Scale className="w-3.5 h-3.5" /> Opname / Penyesuaian
          </span>
        );
      default:
        return <span className="text-xs">{type}</span>;
    }
  };

  return (
    <ModernStaffLayout>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Boxes className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              Inventori & Resep (BOM)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pengelolaan bahan baku kafe, stok per outlet, kalkulasi HPP otomatis, dan resep menu.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              title="Perbarui Data"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
              Segarkan
            </button>

            <button
              onClick={() => handleOpenAdjustModal(undefined, 'IN_PURCHASE')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <ArrowDownRight className="w-4 h-4" />
              + Stok Masuk
            </button>

            <button
              onClick={() => handleOpenAdjustModal(undefined, 'ADJUSTMENT')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
            >
              <Scale className="w-4 h-4" />
              Opname Stok
            </button>

            <button
              onClick={handleOpenAddIngredient}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Bahan
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span className="text-sm font-medium">{actionError}</span>
          </div>
        )}

        {/* LOW STOCK ALERT BANNER */}
        {alerts.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    Peringatan: {alerts.length} Bahan Baku Menipis atau Habis!
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Beberapa stok bahan baku berada di bawah ambang batas minimum. Segera lakukan
                    pembelian ulang (restock) agar operasional tidak terganggu:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {alerts.map((al) => (
                      <span
                        key={al.ingredientId}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          al.isOutOfStock
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border border-red-300 dark:border-red-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {al.name}: <strong>{al.currentStock} {al.unit}</strong> (Min: {al.minStock})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('stock');
                  setFilterLowStockOnly(true);
                }}
                className="text-xs font-bold text-amber-800 dark:text-amber-200 underline hover:no-underline whitespace-nowrap"
              >
                Lihat Semua &rarr;
              </button>
            </div>
          </div>
        )}

        {/* SUMMARY STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Jenis Bahan
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {ingredients.length}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Bahan baku terdaftar</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Stok Menipis / Habis
              </p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {lowStockCount}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {outOfStockCount > 0 ? `${outOfStockCount} bahan habis total` : 'Perlu perhatian'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Menu Memiliki Resep
              </p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {recipeProducts.filter((p) => p.hasRecipe).length} / {recipeProducts.length}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Terkoneksi auto-deduct</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ChefHat className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Nilai Aset Stok Outlet
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(totalAssetValue)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Berdasarkan harga satuan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-3 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'stock'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Stok & Peringatan Bahan
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-3 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ingredients'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Master Bahan & Satuan
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`pb-3 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'recipes'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Resep & Kalkulasi HPP Menu
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 text-sm font-semibold whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Riwayat Mutasi Stok
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: STOK & PERINGATAN BAHAN */}
        {/* ======================================================== */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchStock}
                    onChange={(e) => setSearchStock(e.target.value)}
                    placeholder="Cari bahan baku atau SKU..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                  {searchStock && (
                    <button
                      onClick={() => setSearchStock('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={selectedStockCategory}
                  onChange={(e) => setSelectedStockCategory(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Low Stock Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={filterLowStockOnly}
                    onChange={(e) => setFilterLowStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 dark:bg-slate-800 border-slate-300"
                  />
                  <span>Hanya Stok Menipis</span>
                </label>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Menampilkan <strong>{filteredIngredients.length}</strong> bahan
              </div>
            </div>

            {/* Table of Stocks */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Nama Bahan</th>
                      <th className="px-4 py-3.5">Kategori</th>
                      <th className="px-4 py-3.5 text-right">Stok Fisik Saat Ini</th>
                      <th className="px-4 py-3.5 text-right">Min. Batas</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Nilai Total Stok</th>
                      <th className="px-5 py-3.5 text-center">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                          Memuat data stok inventori...
                        </td>
                      </tr>
                    ) : filteredIngredients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          Tidak ada bahan baku yang sesuai dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredIngredients.map((ing) => {
                        const stock = ing.currentStock || 0;
                        const min = ing.minStock || 0;
                        const isZero = stock <= 0;
                        const isLow = stock <= min;

                        return (
                          <tr
                            key={ing.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {ing.name}
                              </div>
                              {ing.sku && (
                                <div className="text-xs font-mono text-slate-400">
                                  SKU: {ing.sku}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                {ing.category || 'Umum'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span
                                className={`font-mono text-base font-bold ${
                                  isZero
                                    ? 'text-red-600 dark:text-red-400'
                                    : isLow
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {stock}
                              </span>{' '}
                              <span className="text-xs text-slate-500">
                                {ing.unit?.symbol || ''}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right text-xs text-slate-500 font-mono">
                              {min} {ing.unit?.symbol || ''}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {isZero ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                  Habis
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  Menipis
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  Aman
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-slate-900 dark:text-white">
                              {formatRupiah(ing.totalStockValue || 0)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenAdjustModal(ing, 'IN_PURCHASE')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                                  title="Tambah Stok Masuk"
                                >
                                  + Masuk
                                </button>
                                <button
                                  onClick={() => handleOpenAdjustModal(ing, 'ADJUSTMENT')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 transition-colors"
                                  title="Penyesuaian / Opname"
                                >
                                  Opname
                                </button>
                                <button
                                  onClick={() => {
                                    setMovementIngredientFilter(ing.id);
                                    setActiveTab('movements');
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                  title="Lihat Mutasi Bahan"
                                >
                                  <History className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MASTER BAHAN BAKU & SATUAN */}
        {/* ======================================================== */}
        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Bahan Baku & Standar Biaya
                </h3>
                <p className="text-xs text-slate-500">
                  Definisikan bahan baku mentah, satuan ukuran, harga pembelian standar per satuan,
                  dan batas peringatan stok.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUnitModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  Kelola Satuan ({units.length})
                </button>
                <button
                  onClick={handleOpenAddIngredient}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Bahan Baru
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Nama Bahan</th>
                      <th className="px-4 py-3.5">SKU / Kode</th>
                      <th className="px-4 py-3.5">Kategori</th>
                      <th className="px-4 py-3.5">Satuan Ukur</th>
                      <th className="px-4 py-3.5 text-right">Biaya Standar</th>
                      <th className="px-4 py-3.5 text-right">Peringatan Min.</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ingredients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          Belum ada bahan baku terdaftar. Silakan klik tombol "Tambah Bahan Baru".
                        </td>
                      </tr>
                    ) : (
                      ingredients.map((ing) => (
                        <tr
                          key={ing.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                            {ing.name}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                            {ing.sku || '-'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {ing.category || 'Bahan Baku'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {ing.unit?.name} ({ing.unit?.symbol})
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-slate-900 dark:text-white">
                            {formatRupiah(ing.costPerUnit || 0)} / {ing.unit?.symbol}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500">
                            {ing.minStockAlert} {ing.unit?.symbol}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditIngredient(ing)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Bahan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteIngredient(ing)}
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Hapus / Nonaktifkan Bahan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RESEP & KALKULASI HPP MENU */}
        {/* ======================================================== */}
        {activeTab === 'recipes' && (
          <div className="space-y-4">
            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 text-blue-900 dark:text-blue-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-sm">Bagaimana Resep & HPP Bekerja?</p>
                <p className="mt-0.5">
                  Setiap menu dihubungkan dengan satu atau beberapa bahan baku (misal: 18g Biji Kopi
                  + 180ml Susu UHT + 1 Paper Cup). Saat kasir menyelesaikan pesanan (Status: PAID /
                  CONFIRMED), sistem akan <strong>secara otomatis memotong stok bahan baku</strong>{' '}
                  terkait di outlet kasir tersebut. Jika pesanan dibatalkan/refund, stok dikembalikan
                  otomatis ke outlet. HPP (COGS) dan margin keuntungan kotor akan dikalkulasi secara
                  realtime berdasarkan harga bahan terkini.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchRecipe}
                  onChange={(e) => setSearchRecipe(e.target.value)}
                  placeholder="Cari menu untuk mengatur resep..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div className="text-xs text-slate-500">
                Total Menu: <strong>{filteredRecipes.length}</strong>
              </div>
            </div>

            {/* Recipe Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((p) => {
                const marginColor =
                  p.marginPercent >= 70
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200'
                    : p.marginPercent >= 50
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200'
                    : p.marginPercent >= 30
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200'
                    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200';

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {p.category}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                            {p.name}
                          </h4>
                          {p.sku && (
                            <p className="text-xs font-mono text-slate-400">SKU: {p.sku}</p>
                          )}
                        </div>

                        {p.hasRecipe ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Resep Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Tanpa Resep
                          </span>
                        )}
                      </div>

                      {/* Pricing and Margin Metrics */}
                      <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                            Harga Jual
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {formatRupiah(p.basePrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                            HPP Bahan Baku
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {formatRupiah(p.cogs)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                            Laba Kotor / Porsi
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(p.profit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                            Gross Margin
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded font-bold border text-[11px] ${marginColor}`}
                          >
                            {p.marginPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Recipe Items Preview */}
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Bahan Baku ({p.recipeItems?.length || 0}):
                        </p>
                        {p.recipeItems && p.recipeItems.length > 0 ? (
                          <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                            {p.recipeItems.slice(0, 3).map((item) => (
                              <li key={item.id} className="flex items-center justify-between">
                                <span className="line-clamp-1">{item.ingredient.name}</span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {item.quantity} {item.ingredient.unit?.symbol}
                                </span>
                              </li>
                            ))}
                            {p.recipeItems.length > 3 && (
                              <li className="text-[11px] text-amber-600 italic">
                                + {p.recipeItems.length - 3} bahan lainnya...
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Belum ada takaran bahan baku diatur.
                          </p>
                        )}
                      </div>

                      {/* Variants Preview */}
                      {p.variants && p.variants.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                          {p.variants.length} Varian tersedia (
                          {p.variants.map((v) => v.name).join(', ')})
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleOpenRecipeModal(p)}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        {p.hasRecipe ? 'Edit Takaran Resep' : 'Buat Resep Baru'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RIWAYAT MUTASI STOK */}
        {/* ======================================================== */}
        {activeTab === 'movements' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Movement Type Filter */}
                <select
                  value={movementTypeFilter}
                  onChange={(e) => setMovementTypeFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  <option value="ALL">Semua Jenis Mutasi</option>
                  <option value="IN_PURCHASE">Pembelian / Masuk (IN_PURCHASE)</option>
                  <option value="OUT_SALE">Penjualan POS (OUT_SALE)</option>
                  <option value="IN_RETURN">Retur Pembatalan (IN_RETURN)</option>
                  <option value="OUT_WASTE">Waste / Basi (OUT_WASTE)</option>
                  <option value="ADJUSTMENT">Penyesuaian / Opname (ADJUSTMENT)</option>
                </select>

                {/* Filter by Ingredient */}
                <select
                  value={movementIngredientFilter}
                  onChange={(e) => setMovementIngredientFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  <option value="ALL">Semua Bahan Baku</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>

                {(movementTypeFilter !== 'ALL' || movementIngredientFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setMovementTypeFilter('ALL');
                      setMovementIngredientFilter('ALL');
                    }}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Menampilkan <strong>{filteredMovements.length}</strong> mutasi terakhir
              </div>
            </div>

            {/* Movements Ledger Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Waktu</th>
                      <th className="px-4 py-3.5">Bahan Baku</th>
                      <th className="px-4 py-3.5">Tipe Mutasi</th>
                      <th className="px-4 py-3.5 text-right">Perubahan Qty</th>
                      <th className="px-4 py-3.5 text-right">Saldo (Awal &rarr; Akhir)</th>
                      <th className="px-4 py-3.5">No. Referensi / Order</th>
                      <th className="px-5 py-3.5">Catatan / Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                          Belum ada catatan mutasi stok yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((mov) => {
                        const dateStr = new Date(mov.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const ingName = mov.inventory?.ingredient?.name || 'Bahan';
                        const unitSym = mov.inventory?.ingredient?.unit?.symbol || '';
                        const isPositive =
                          mov.type === 'IN_PURCHASE' || mov.type === 'IN_RETURN';

                        return (
                          <tr
                            key={mov.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {ingName}
                            </td>
                            <td className="px-4 py-3">{renderMovementBadge(mov.type)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold">
                              <span
                                className={
                                  isPositive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {isPositive ? '+' : '-'}
                                {Math.abs(mov.quantity)} {unitSym}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              {mov.balanceBefore} &rarr; <strong>{mov.balanceAfter}</strong>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500">
                              {mov.referenceNumber || mov.orderId?.slice(0, 8) || '-'}
                            </td>
                            <td className="px-5 py-3">
                              <div className="text-slate-800 dark:text-slate-200">
                                {mov.notes || '-'}
                              </div>
                              {mov.createdBy?.fullName && (
                                <div className="text-[10px] text-slate-400">
                                  Oleh: {mov.createdBy.fullName}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: TAMBAH / EDIT BAHAN BAKU */}
      {/* ======================================================== */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] sm:max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                {editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsIngredientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmitIngredient} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 space-y-4 text-sm flex-1 overscroll-contain">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Bahan Baku *
                  </label>
                  <input
                    type="text"
                    required
                    value={ingFormName}
                    onChange={(e) => setIngFormName(e.target.value)}
                    placeholder="Contoh: Biji Kopi Espresso Blend, Susu Segar UHT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SKU / Kode Bahan
                    </label>
                    <input
                      type="text"
                      value={ingFormSku}
                      onChange={(e) => setIngFormSku(e.target.value)}
                      placeholder="ING-KOP-01"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Bahan
                    </label>
                    <input
                      type="text"
                      value={ingFormCategory}
                      onChange={(e) => setIngFormCategory(e.target.value)}
                      placeholder="Biji Kopi, Dairy, Packaging..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Satuan Ukuran Dasar *
                    </label>
                    <select
                      required
                      value={ingFormUnitId}
                      onChange={(e) => setIngFormUnitId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Biaya Standar per Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ingFormCostPerUnit}
                      onChange={(e) => setIngFormCostPerUnit(e.target.value)}
                      placeholder="250"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Peringatan Minimum Stok
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ingFormMinStock}
                      onChange={(e) => setIngFormMinStock(e.target.value)}
                      placeholder="10"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Muncul alert jika stok &le; angka ini
                    </p>
                  </div>

                  {!editingIngredient && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Stok Awal di Outlet Ini
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={ingFormInitialStock}
                        onChange={(e) => setIngFormInitialStock(e.target.value)}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIngredient}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingIngredient && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingIngredient ? 'Perbarui Bahan' : 'Simpan Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PENYESUAIAN STOK / STOK MASUK / OPNAME */}
      {/* ======================================================== */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] sm:max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                {adjustType === 'IN_PURCHASE'
                  ? 'Catat Stok Masuk (Pembelian)'
                  : adjustType === 'OUT_WASTE'
                  ? 'Catat Waste / Bahan Rusak'
                  : 'Stok Opname / Penyesuaian'}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmitAdjustStock} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 space-y-4 text-sm flex-1 overscroll-contain">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Bahan Baku *
                  </label>
                  <select
                    required
                    value={adjustTargetIngredient?.id || ''}
                    onChange={(e) => {
                      const found = ingredients.find((i) => i.id === e.target.value);
                      setAdjustTargetIngredient(found || null);
                      if (found) setAdjustUnitCost(found.costPerUnit || '');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-medium"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} (Stok Saat Ini: {ing.currentStock || 0} {ing.unit?.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Tindakan
                    </label>
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-medium"
                    >
                      <option value="IN_PURCHASE">Pembelian / Stok Masuk</option>
                      <option value="ADJUSTMENT">Stok Opname (Penyesuaian)</option>
                      <option value="OUT_WASTE">Waste / Basi / Terbuang</option>
                      <option value="IN_RETURN">Pengembalian / Retur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah ({adjustTargetIngredient?.unit?.symbol || 'Unit'}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.001"
                      step="0.001"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder="Contoh: 1000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Opname Mode Checkbox */}
                {adjustType === 'ADJUSTMENT' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-lg">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-purple-900 dark:text-purple-200">
                      <input
                        type="checkbox"
                        checked={adjustIsAbsolute}
                        onChange={(e) => setAdjustIsAbsolute(e.target.checked)}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span>Atur sebagai Stok Akhir Nyata (Hasil Hitung Fisik Opname)</span>
                        <p className="text-[11px] font-normal text-purple-700 dark:text-purple-300 mt-0.5">
                          Jika dicentang, stok akan langsung diset ke angka di atas, dan selisihnya
                          dihitung otomatis.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Harga Beli Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adjustUnitCost}
                      onChange={(e) => setAdjustUnitCost(e.target.value)}
                      placeholder="Harga satuan terkini"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      No. Bukti / PO / Faktur
                    </label>
                    <input
                      type="text"
                      value={adjustRefNo}
                      onChange={(e) => setAdjustRefNo(e.target.value)}
                      placeholder="PO-2026-001"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan / Keterangan
                  </label>
                  <textarea
                    rows={2}
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="Misal: Pembelian dari Supplier Kopi Jaya, atau Susu tumpah saat operasional..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingAdjust && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Mutasi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECIPE BUILDER (BILL OF MATERIALS) */}
      {/* ======================================================== */}
      {isRecipeModalOpen && recipeTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Pengaturan Resep (Bill of Materials)
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {recipeTargetProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variant Selector if present */}
            {recipeTargetProduct.variants.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Pilih Lingkup Resep:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Menu ini memiliki {recipeTargetProduct.variants.length} varian. Anda dapat
                    mengatur resep khusus untuk setiap varian.
                  </p>
                </div>
                <select
                  value={recipeSelectedVariantId}
                  onChange={(e) => handleVariantChangeInRecipe(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  <option value="">Resep Standar (Base Menu)</option>
                  {recipeTargetProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      Varian: {v.name} ({formatRupiah(v.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipe Ingredient Lines (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {recipeLines.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <ChefHat className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Belum ada bahan baku dalam resep ini.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Klik tombol "+ Tambah Bahan" di bawah untuk menentukan takaran.
                  </p>
                </div>
              ) : (
                recipeLines.map((line, idx) => {
                  const currentIng = ingredients.find((i) => i.id === line.ingredientId);
                  const lineCost =
                    (parseFloat(String(line.quantity)) || 0) * (currentIng?.costPerUnit || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      {/* Ingredient Picker */}
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Bahan Baku
                        </label>
                        <select
                          value={line.ingredientId}
                          onChange={(e) =>
                            handleUpdateRecipeLine(idx, 'ingredientId', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-medium"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit?.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-28">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Takaran ({currentIng?.unit?.symbol || 'Qty'})
                        </label>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={line.quantity}
                          onChange={(e) =>
                            handleUpdateRecipeLine(idx, 'quantity', e.target.value)
                          }
                          placeholder="18"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono font-bold"
                        />
                      </div>

                      {/* Line Cost Display */}
                      <div className="w-28 text-right">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Biaya Bahan
                        </label>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {formatRupiah(lineCost)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="flex sm:items-end justify-end pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Hapus baris bahan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              <button
                type="button"
                onClick={handleAddRecipeLine}
                className="w-full py-2.5 text-xs font-bold rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Bahan Baku ke Resep
              </button>
            </div>

            {/* Footer Summary (COGS, Selling Price, Margin) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Harga Jual Menu</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {formatRupiah(recipeTargetPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Total HPP Bahan Baku</span>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                    {formatRupiah(recipeCalculatedHpp)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Estimasi Laba Kotor</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(recipeEstimatedProfit)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Gross Profit Margin</span>
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    {Math.round(recipeEstimatedMargin * 10) / 10}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRecipe}
                  disabled={isSubmittingRecipe}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingRecipe && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Resep Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: KELOLA SATUAN UKURAN (UoM) */}
      {/* ======================================================== */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] sm:max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Kelola Satuan Ukur (Unit)
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-5 space-y-4 text-sm flex-1 overscroll-contain">
              {/* Current Units List */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Daftar Satuan Aktif:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {units.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {u.name}
                      </span>
                      <span className="font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                        {u.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Add Form */}
              <form
                onSubmit={handleAddUnit}
                className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
              >
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tambah Satuan Baru:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Nama (e.g. Bungkus)"
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                  <input
                    type="text"
                    required
                    value={newUnitSymbol}
                    onChange={(e) => setNewUnitSymbol(e.target.value)}
                    placeholder="Simbol (e.g. bks)"
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingUnit}
                  className="w-full py-2.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmittingUnit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  + Simpan Satuan
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </ModernStaffLayout>
  );
}

