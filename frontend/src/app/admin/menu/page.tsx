/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { Product, Category, ProductVariant } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatRupiah, getImageUrl, formatCurrencyInput, parseCurrencyInput, terbilangRupiah } from '@/lib/utils';
import {
  Utensils,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Tag,
  DollarSign,
  Coffee,
  Calculator,
  ToggleLeft,
  ToggleRight,
  FolderPlus,
  Tags,
  Upload,
  Image as ImageIcon,
  Layers,
  Check,
} from 'lucide-react';

export default function AdminMenuPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Form Fields
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBasePrice, setFormBasePrice] = useState<number | string>('');
  const [formCostPrice, setFormCostPrice] = useState<number | string>('');
  const [formStatus, setFormStatus] = useState<'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED'>('AVAILABLE');
  const [formImage, setFormImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Variant Modal State
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantError, setVariantError] = useState('');
  const [variantSuccess, setVariantSuccess] = useState('');

  // Add Variant Form State
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState<string>('');
  const [newVariantIsActive, setNewVariantIsActive] = useState(true);
  const [isSubmittingVariant, setIsSubmittingVariant] = useState(false);

  // Edit Variant State
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVariantName, setEditVariantName] = useState('');
  const [editVariantPrice, setEditVariantPrice] = useState<string>('');
  const [editVariantIsActive, setEditVariantIsActive] = useState(true);
  const [isUpdatingVariant, setIsUpdatingVariant] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const outletQuery = user?.outletId ? `&outletId=${user.outletId}` : '';
      const catQuery = user?.outletId ? `?outletId=${user.outletId}` : '';
      const [prodsRes, catsRes] = await Promise.all([
        api.get<Product[]>(`/products?includeInactive=true${outletQuery}`),
        api.get<Category[]>(`/categories${catQuery}`),
      ]);

      if (Array.isArray(prodsRes)) setProducts(prodsRes);
      if (Array.isArray(catsRes)) {
        setCategories(catsRes);
        if (!formCategoryId && catsRes.length > 0) {
          setFormCategoryId(catsRes[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching menu data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Hanya file gambar (JPG, PNG, WEBP, GIF, SVG) yang diperbolehkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran gambar maksimal 5MB');
      return;
    }

    setIsUploadingImage(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.upload<{ url: string }>('/uploads/image?folder=products', formData);
      if (res?.url) {
        setFormImage(res.url);
      }
    } catch (err: any) {
      console.error('Error uploading product image:', err);
      setFormError(err?.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormSku(`PRD-${Date.now().toString().slice(-4)}`);
    setFormName('');
    setFormDescription('');
    if (categories.length > 0) setFormCategoryId(categories[0].id);
    setFormBasePrice('');
    setFormCostPrice('');
    setFormStatus('AVAILABLE');
    setFormImage('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormCategoryId(product.categoryId);
    setFormBasePrice(formatCurrencyInput(product.basePrice));
    setFormCostPrice(product.costPrice ? formatCurrencyInput(product.costPrice) : '');
    const safeStatus = (['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'] as const).includes(product.status as any)
      ? (product.status as 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED')
      : 'DISCONTINUED';
    setFormStatus(safeStatus);
    setFormImage(product.image || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Auto-decimal Price Change Handlers
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormBasePrice(formatCurrencyInput(e.target.value));
  };

  const handleCostPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormCostPrice(formatCurrencyInput(e.target.value));
  };

  const adjustBasePrice = (delta: number) => {
    const current = parseCurrencyInput(formBasePrice);
    const nextVal = Math.max(0, current + delta);
    setFormBasePrice(nextVal > 0 ? formatCurrencyInput(nextVal) : '');
  };

  const adjustCostPrice = (delta: number) => {
    const current = parseCurrencyInput(formCostPrice);
    const nextVal = Math.max(0, current + delta);
    setFormCostPrice(nextVal > 0 ? formatCurrencyInput(nextVal) : '');
  };

  const numericBasePrice = parseCurrencyInput(formBasePrice);
  const numericCostPrice = formCostPrice ? parseCurrencyInput(formCostPrice) : 0;
  const estimatedProfit = numericBasePrice - numericCostPrice;
  const estimatedMargin = numericBasePrice > 0 ? Math.round((estimatedProfit / numericBasePrice) * 1000) / 10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama menu wajib diisi');
      return;
    }

    const parsedBasePrice = parseCurrencyInput(formBasePrice);
    const parsedCostPrice = formCostPrice ? parseCurrencyInput(formCostPrice) : undefined;

    if (!parsedBasePrice || parsedBasePrice <= 0) {
      setFormError('Harga jual harus berupa angka lebih dari 0');
      return;
    }
    if (!formCategoryId) {
      setFormError('Pilih kategori untuk menu ini');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingProduct) {
        // Update product
        await api.put(`/products/${editingProduct.id}`, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          categoryId: formCategoryId,
          basePrice: parsedBasePrice,
          costPrice: parsedCostPrice,
          status: formStatus,
          image: formImage || undefined,
        });
        setActionSuccess(`Menu "${formName}" dan harga berhasil diperbarui!`);
      } else {
        // Create product
        await api.post('/products', {
          sku: formSku.trim().toUpperCase(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          categoryId: formCategoryId,
          basePrice: parsedBasePrice,
          costPrice: parsedCostPrice,
          status: formStatus,
          image: formImage || undefined,
          isActive: true,
        });
        setActionSuccess(`Menu "${formName}" berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
    try {
      await api.put(`/products/${product.id}/status`, { status: nextStatus });
      setActionSuccess(`Status "${product.name}" diubah menjadi ${nextStatus === 'AVAILABLE' ? 'Tersedia' : 'Habis'}`);
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah status produk');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Hapus menu "${product.name}" secara permanen?`)) return;

    try {
      await api.delete(`/products/${product.id}`);
      setActionSuccess(`Menu "${product.name}" berhasil dihapus.`);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus produk. Produk mungkin terhubung dengan transaksi pesanan sebelumnya.');
    }
  };

  const openCategoryModal = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError('Nama kategori wajib diisi');
      return;
    }

    setIsSubmittingCategory(true);
    setCategoryError('');

    try {
      await api.post('/categories', {
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
        isActive: true,
      });

      setActionSuccess(`Kategori "${categoryName.trim()}" berhasil dibuat!`);
      setIsCategoryModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchData();
    } catch (err: any) {
      setCategoryError(err?.message || 'Gagal membuat kategori');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Variant Handlers
  const openVariantModal = async (product: Product) => {
    setVariantModalProduct(product);
    setVariantError('');
    setVariantSuccess('');
    setEditingVariantId(null);
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantIsActive(true);
    setLoadingVariants(true);

    try {
      const res = await api.get<ProductVariant[]>(`/products/${product.id}/variants`);
      if (Array.isArray(res)) {
        setProductVariants(res);
      } else {
        setProductVariants(product.variants || []);
      }
    } catch (err: any) {
      console.error('Error fetching variants:', err);
      setProductVariants(product.variants || []);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantModalProduct) return;
    if (!newVariantName.trim()) {
      setVariantError('Nama varian wajib diisi (contoh: Regular, Large, Ice, Hot)');
      return;
    }

    const parsedPrice = parseCurrencyInput(newVariantPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setVariantError('Harga varian tidak valid');
      return;
    }

    setIsSubmittingVariant(true);
    setVariantError('');
    setVariantSuccess('');

    try {
      const created = await api.post<ProductVariant>(`/products/${variantModalProduct.id}/variants`, {
        name: newVariantName.trim(),
        price: parsedPrice,
        isActive: newVariantIsActive,
      });

      setProductVariants((prev) => [...prev, created]);
      setNewVariantName('');
      setNewVariantPrice('');
      setNewVariantIsActive(true);
      setVariantSuccess(`Varian "${created.name}" berhasil ditambahkan!`);
      setTimeout(() => setVariantSuccess(''), 3000);
      await fetchData();
    } catch (err: any) {
      setVariantError(err?.message || 'Gagal menambahkan varian');
    } finally {
      setIsSubmittingVariant(false);
    }
  };

  const handleStartEditVariant = (variant: ProductVariant) => {
    setEditingVariantId(variant.id);
    setEditVariantName(variant.name);
    setEditVariantPrice(formatCurrencyInput(variant.price));
    setEditVariantIsActive(variant.isActive);
    setVariantError('');
    setVariantSuccess('');
  };

  const handleCancelEditVariant = () => {
    setEditingVariantId(null);
    setEditVariantName('');
    setEditVariantPrice('');
  };

  const handleSaveEditVariant = async (variantId: string) => {
    if (!variantModalProduct) return;
    if (!editVariantName.trim()) {
      setVariantError('Nama varian tidak boleh kosong');
      return;
    }

    const parsedPrice = parseCurrencyInput(editVariantPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setVariantError('Harga varian tidak valid');
      return;
    }

    setIsUpdatingVariant(true);
    setVariantError('');
    setVariantSuccess('');

    try {
      const updated = await api.put<ProductVariant>(`/products/${variantModalProduct.id}/variants/${variantId}`, {
        name: editVariantName.trim(),
        price: parsedPrice,
        isActive: editVariantIsActive,
      });

      setProductVariants((prev) => prev.map((v) => (v.id === variantId ? updated : v)));
      setEditingVariantId(null);
      setVariantSuccess(`Varian "${updated.name}" berhasil diperbarui!`);
      setTimeout(() => setVariantSuccess(''), 3000);
      await fetchData();
    } catch (err: any) {
      setVariantError(err?.message || 'Gagal memperbarui varian');
    } finally {
      setIsUpdatingVariant(false);
    }
  };

  const handleToggleVariantActive = async (variant: ProductVariant) => {
    if (!variantModalProduct) return;
    try {
      const updated = await api.put<ProductVariant>(`/products/${variantModalProduct.id}/variants/${variant.id}`, {
        isActive: !variant.isActive,
      });
      setProductVariants((prev) => prev.map((v) => (v.id === variant.id ? updated : v)));
      await fetchData();
    } catch (err: any) {
      setVariantError(err?.message || 'Gagal mengubah status varian');
    }
  };

  const handleDeleteVariant = async (variant: ProductVariant) => {
    if (!variantModalProduct) return;
    if (!confirm(`Hapus varian "${variant.name}"?`)) return;

    try {
      await api.delete(`/products/${variantModalProduct.id}/variants/${variant.id}`);
      setProductVariants((prev) => prev.filter((v) => v.id !== variant.id));
      setVariantSuccess(`Varian "${variant.name}" berhasil dihapus.`);
      setTimeout(() => setVariantSuccess(''), 3000);
      await fetchData();
    } catch (err: any) {
      setVariantError(err?.message || 'Gagal menghapus varian. Varian mungkin terhubung dengan transaksi pesanan.');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <ModernStaffLayout>

      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Manajemen Menu & Harga
              </h1>
              <p className="text-xs text-gray-500">
                Tambah menu baru, atur harga jual, dan kelola ketersediaan stok produk
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
              <span>Perbarui</span>
            </button>

            <button
              onClick={openCategoryModal}
              className="py-2 px-3.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-xs cursor-pointer border border-amber-300"
            >
              <FolderPlus className="w-4 h-4 text-amber-700" />
              <span>+ Kategori Baru</span>
            </button>

            <button
              onClick={openAddModal}
              className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}

            <button
              onClick={openCategoryModal}
              title="Tambah Kategori Baru"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-50 border border-dashed border-amber-300 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kategori</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama menu / SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Menu Tidak Ditemukan</h3>
            <p className="text-xs text-gray-500 mb-4">
              Tidak ada produk yang cocok dengan pencarian atau filter kategori saat ini.
            </p>
            <button
              onClick={openAddModal}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'Menu';

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Row: Category & Status */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {categoryName}
                      </span>

                      <button
                        onClick={() => handleToggleStatus(product)}
                        title="Klik untuk ubah status ketersediaan"
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition ${
                          product.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : product.status === 'OUT_OF_STOCK'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {product.status === 'AVAILABLE' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Tersedia</span>
                          </>
                        ) : product.status === 'OUT_OF_STOCK' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Habis</span>
                          </>
                        ) : (
                          <span>Nonaktif</span>
                        )}
                      </button>
                    </div>

                    {/* Product Image Thumbnail */}
                    <div className="relative w-full h-36 bg-stone-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center border border-gray-100">
                      {product.image ? (
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                          <Coffee className="w-8 h-8 stroke-1" />
                          <span className="text-[10px] font-medium text-gray-400 mt-1">Tanpa Foto</span>
                        </div>
                      )}
                    </div>

                    {/* Product Name & SKU */}
                    <h3 className="text-base font-extrabold text-gray-900 tracking-tight leading-snug">
                      {product.name}
                    </h3>
                    <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                      SKU: {product.sku}
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing and Actions Bottom Row */}
                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Harga Jual</span>
                        <span className="text-lg font-black text-amber-600 tracking-tight">
                          {formatRupiah(product.basePrice)}
                        </span>
                      </div>
                      {product.costPrice && (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Modal</span>
                          <span className="text-xs font-semibold text-gray-500">
                            {formatRupiah(product.costPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Ubah Menu</span>
                      </button>

                      <button
                        onClick={() => openVariantModal(product)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border ${
                          (product.variants?.length || 0) > 0
                            ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                        title="Kelola Varian Menu (Ukuran, Rasa, Suhu, dll)"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{(product.variants?.length || 0) > 0 ? `${product.variants?.length} Varian` : '+ Varian'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1.5 border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-600 rounded-xl transition"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Form: Tambah / Edit Menu & Harga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85dvh] sm:max-h-[90vh] my-auto overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  {editingProduct ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingProduct ? 'Ubah Menu & Harga' : 'Tambah Menu Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Kode SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    placeholder="Contoh: KOP-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Menu / Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Caramel Macchiato"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Harga Jual Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Harga Jual <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="Contoh: 28.000"
                        value={formBasePrice}
                        onChange={handleBasePriceChange}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-base font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    {/* Live Terbilang & Human-readable Preview */}
                    {numericBasePrice > 0 ? (
                      <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
                        <div className="font-semibold flex items-center gap-1 text-[11px] text-amber-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatRupiah(numericBasePrice)}</span>
                        </div>
                        <p className="text-[11px] font-medium text-amber-800 italic mt-0.5 leading-tight">
                          &ldquo;{terbilangRupiah(numericBasePrice)}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400">
                        Format angka otomatis (titik pemisah ribuan)
                      </p>
                    )}

                    {/* Quick Increment Buttons */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium mr-0.5">+Cepat:</span>
                      <button
                        type="button"
                        onClick={() => adjustBasePrice(1000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +1rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustBasePrice(5000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +5rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustBasePrice(10000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +10rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustBasePrice(50000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +50rb
                      </button>
                      {numericBasePrice > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormBasePrice('')}
                          className="px-1.5 py-0.5 rounded-md text-red-500 hover:bg-red-50 text-[10px] font-semibold transition"
                          title="Hapus / Reset"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Harga Modal Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Harga Modal (Opsional)
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 12.000"
                        value={formCostPrice}
                        onChange={handleCostPriceChange}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-base font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    {/* Live Terbilang & Human-readable Preview */}
                    {numericCostPrice > 0 ? (
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 text-xs">
                        <div className="font-semibold flex items-center gap-1 text-[11px] text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatRupiah(numericCostPrice)}</span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-600 italic mt-0.5 leading-tight">
                          &ldquo;{terbilangRupiah(numericCostPrice)}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400">
                        Opsional, untuk kalkulasi laba kotor
                      </p>
                    )}

                    {/* Quick Increment Buttons */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium mr-0.5">+Cepat:</span>
                      <button
                        type="button"
                        onClick={() => adjustCostPrice(1000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +1rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustCostPrice(5000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +5rb
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustCostPrice(10000)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-600 transition"
                      >
                        +10rb
                      </button>
                      {numericCostPrice > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormCostPrice('')}
                          className="px-1.5 py-0.5 rounded-md text-red-500 hover:bg-red-50 text-[10px] font-semibold transition"
                          title="Hapus / Reset"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Profit & Margin Estimation Card */}
                {numericBasePrice > 0 && numericCostPrice > 0 && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      estimatedProfit >= 0
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-red-50/70 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">
                          {estimatedProfit >= 0 ? 'Estimasi Laba Kotor per Porsi' : 'Peringatan: Harga Jual Rugi!'}
                        </span>
                        <span className="text-[11px] text-gray-600">
                          {formatRupiah(numericBasePrice)} - {formatRupiah(numericCostPrice)} ={' '}
                          <strong className={estimatedProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                            {formatRupiah(estimatedProfit)}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] block uppercase font-bold text-gray-500">Margin</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                          estimatedMargin >= 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : estimatedMargin > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {estimatedMargin}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Status Ketersediaan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('AVAILABLE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      formStatus === 'AVAILABLE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Tersedia
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('OUT_OF_STOCK')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      formStatus === 'OUT_OF_STOCK'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Stok Habis
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('DISCONTINUED')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      formStatus === 'DISCONTINUED'
                        ? 'bg-gray-200 border-gray-500 text-gray-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Nonaktif
                  </button>
                </div>
              </div>

              {/* Foto / Gambar Menu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Foto / Gambar Menu (Opsional)</span>
                  {isUploadingImage && (
                    <span className="text-[11px] text-amber-600 flex items-center gap-1 font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-20 h-20 rounded-2xl bg-stone-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {formImage ? (
                      <>
                        <img
                          src={getImageUrl(formImage)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold"
                          title="Hapus gambar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center">
                        <ImageIcon className="w-6 h-6 stroke-1" />
                        <span className="text-[9px] text-gray-400 mt-0.5">Kosong</span>
                      </div>
                    )}
                  </div>

                  {/* Upload button & Info */}
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center space-x-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formImage ? 'Ganti Foto' : 'Pilih Foto Menu'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="ml-2 text-xs text-red-600 hover:text-red-700 font-medium underline"
                      >
                        Hapus
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400 leading-tight">
                      Format JPG, PNG, WEBP, atau SVG. Maksimal 5MB. Foto akan tampil di katalog QR meja dan POS.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Deskripsi Menu (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan bahan, rasa, atau penyajian..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              {/* Shortcut Banner to Manage Variants if Editing */}
              {editingProduct && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Varian Menu ({editingProduct.variants?.length || 0})
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Atur pilihan ukuran, suhu, atau varian harga khusus
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      openVariantModal(editingProduct);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Kelola Varian</span>
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Simpan Perubahan' : 'Tambah Menu'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Tambah Kategori Baru</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleCreateCategory} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 space-y-4 flex-1 overscroll-contain">
                {categoryError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{categoryError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dessert, Mocktail, Pasta, Pastry"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Deskripsi Kategori (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan singkat tentang kelompok menu ini..."
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                >
                  {isSubmittingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Kategori</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kelola Varian Produk */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-xs flex min-h-full items-center justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85dvh] sm:max-h-[90vh] my-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    Kelola Varian: {variantModalProduct.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Harga dasar menu: <span className="font-semibold text-gray-700">{formatRupiah(variantModalProduct.basePrice)}</span> • SKU: <span className="font-mono">{variantModalProduct.sku}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications */}
            {variantError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{variantError}</span>
              </div>
            )}
            {variantSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{variantSuccess}</span>
              </div>
            )}

            {/* Modal Body: Scrollable */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Existing Variants List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Daftar Varian ({productVariants.length})
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    Harga varian akan menggantikan harga dasar saat varian dipilih pelanggan
                  </span>
                </div>

                {loadingVariants ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mb-2" />
                    <span className="text-xs">Memuat data varian...</span>
                  </div>
                ) : productVariants.length === 0 ? (
                  <div className="p-6 bg-stone-50 border border-dashed border-gray-200 rounded-2xl text-center">
                    <Layers className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-gray-600">Belum Ada Varian</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-0.5">
                      Menu ini saat ini hanya menggunakan harga dasar ({formatRupiah(variantModalProduct.basePrice)}). Tambahkan varian seperti Regular, Large, Panas, atau Dingin di form bawah.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productVariants.map((variant) => {
                      const isEditing = editingVariantId === variant.id;

                      if (isEditing) {
                        return (
                          <div
                            key={variant.id}
                            className="p-3.5 bg-amber-50/60 border border-amber-300 rounded-2xl space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-amber-800">Edit Varian</span>
                              <button
                                type="button"
                                onClick={handleCancelEditVariant}
                                className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                  Nama Varian
                                </label>
                                <input
                                  type="text"
                                  value={editVariantName}
                                  onChange={(e) => setEditVariantName(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                                  placeholder="Contoh: Large"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                  Harga Varian (Rp)
                                </label>
                                <input
                                  type="text"
                                  value={editVariantPrice}
                                  onChange={(e) => setEditVariantPrice(formatCurrencyInput(e.target.value))}
                                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-700"
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editVariantIsActive}
                                  onChange={(e) => setEditVariantIsActive(e.target.checked)}
                                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                                />
                                <span className="font-semibold text-[11px]">Aktif (Dapat Dipilih)</span>
                              </label>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEditVariant}
                                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingVariant}
                                  onClick={() => handleSaveEditVariant(variant.id)}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  {isUpdatingVariant ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>Simpan Perubahan</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={variant.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                            variant.isActive
                              ? 'bg-white border-gray-200 hover:border-amber-300'
                              : 'bg-gray-50/70 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              variant.isActive ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {variant.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-gray-900">{variant.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVariantActive(variant)}
                                  title="Klik untuk ubah status aktif/nonaktif"
                                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer transition ${
                                    variant.isActive
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                  }`}
                                >
                                  {variant.isActive ? 'Aktif' : 'Nonaktif'}
                                </button>
                              </div>
                              <span className="text-xs font-black text-amber-600 block mt-0.5">
                                {formatRupiah(variant.price)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditVariant(variant)}
                              className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                              title="Edit Varian"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(variant)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                              title="Hapus Varian"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Tambah Varian Baru */}
              <div className="bg-stone-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Tambah Varian Baru
                  </h4>
                </div>

                <form onSubmit={handleCreateVariant} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Nama Varian *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Hot, Ice, Large, 1 Liter..."
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Harga Varian *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                          Rp
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="0"
                          value={newVariantPrice}
                          onChange={(e) => setNewVariantPrice(formatCurrencyInput(e.target.value))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                      {newVariantPrice && (
                        <p className="text-[10px] text-gray-400 italic mt-0.5 font-medium">
                          {terbilangRupiah(parseCurrencyInput(newVariantPrice))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newVariantIsActive}
                        onChange={(e) => setNewVariantIsActive(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-[11px] font-semibold">Tersedia untuk dipesan (Aktif)</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingVariant}
                      className="py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      {isSubmittingVariant ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Varian</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                className="py-2 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernStaffLayout>
  );
}
