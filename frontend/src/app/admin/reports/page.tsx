'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { formatRupiah, formatDateTime, formatDate, formatTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  RotateCw,
  Award,
  Loader2,
  Calendar,
  Download,
  Printer,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Filter,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Clock,
  ChevronRight,
  X,
  FileText,
  PieChart,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

type PresetKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Helper date to string YYYY-MM-DD
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State: Filter Dates
  const [activePreset, setActivePreset] = useState<PresetKey>('today');
  const [startDate, setStartDate] = useState<string>(() => formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState<string>(() => formatLocalDate(new Date()));

  // State: Data
  const [salesData, setSalesData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [productData, setProductData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  // State: UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'payments' | 'products' | 'transactions'>('daily');

  // State: Transactions Filter & Search
  const [txStatusFilter, setTxStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // State: Modal Detail Struk
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !['ADMIN', 'OWNER', 'SUPERADMIN', 'CASHIER'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Handle Preset Click
  const handleSelectPreset = (preset: PresetKey) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (preset) {
      case 'today':
        start = new Date(now);
        end = new Date(now);
        break;
      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        end = new Date(start);
        break;
      case 'last7':
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        end = new Date(now);
        break;
      case 'last30':
        start = new Date(now);
        start.setDate(start.getDate() - 29);
        end = new Date(now);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'custom':
        // Keep current dates
        break;
    }

    const sStr = formatLocalDate(start);
    const eStr = formatLocalDate(end);
    setStartDate(sStr);
    setEndDate(eStr);
    setActivePreset(preset);
  };

  // Fetch all reports in parallel
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [salesRes, paymentsRes, productsRes, ordersRes] = await Promise.all([
        api.get<any>(`/reports/sales?dateFrom=${startDate}&dateTo=${endDate}`).catch((e) => {
          console.error('Failed sales:', e);
          return null;
        }),
        api.get<any>(`/reports/payments?dateFrom=${startDate}&dateTo=${endDate}`).catch((e) => {
          console.error('Failed payments:', e);
          return null;
        }),
        api.get<any>(`/reports/products?dateFrom=${startDate}&dateTo=${endDate}`).catch((e) => {
          console.error('Failed products:', e);
          return [];
        }),
        api.get<any[]>(`/orders?dateFrom=${startDate}&dateTo=${endDate}`).catch((e) => {
          console.error('Failed orders:', e);
          return [];
        }),
      ]);

      if (salesRes) setSalesData(salesRes);
      if (paymentsRes) setPaymentData(paymentsRes);
      if (Array.isArray(productsRes)) setProductData(productsRes);
      if (Array.isArray(ordersRes)) setOrdersData(ordersRes);
    } catch (err) {
      console.error('Error fetching financial reports:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [startDate, endDate]);

  // Filtered Orders for Transactions Tab
  const filteredOrders = useMemo(() => {
    return ordersData.filter((o) => {
      const matchesStatus =
        txStatusFilter === 'ALL'
          ? true
          : txStatusFilter === 'COMPLETED'
          ? ['PAID', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED'].includes(o.status)
          : ['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED', 'REFUNDED'].includes(o.status);

      const q = txSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.table?.name?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [ordersData, txStatusFilter, txSearchQuery]);

  // Filtered Products for Products Tab
  const filteredProducts = useMemo(() => {
    const q = productSearchQuery.toLowerCase().trim();
    if (!q) return productData;
    return productData.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  }, [productData, productSearchQuery]);

  // CSV Export Generator
  const handleExportCSV = () => {
    if (!salesData) return;

    const rows: string[] = [];
    rows.push('LAPORAN KEUANGAN & HASIL PENJUALAN KAFE');
    rows.push(`Periode Filter,${startDate} s/d ${endDate}`);
    rows.push(`Dicetak Pada,${new Date().toLocaleString('id-ID')}`);
    rows.push('');

    // 1. Ringkasan Finansial
    rows.push('--- 1. RINGKASAN FINANSIAL & OMZET ---');
    rows.push(`Total Pendapatan Bersih (Net Revenue),${salesData.revenue || 0}`);
    rows.push(`Penjualan Kotor (Gross Sales / Subtotal),${salesData.grossSales || 0}`);
    rows.push(`Total Diskon Diberikan,${salesData.totalDiscount || 0}`);
    rows.push(`Total Pajak (PPN),${salesData.totalTax || 0}`);
    rows.push(`Total Service Charge,${salesData.totalService || 0}`);
    rows.push(`Total Transaksi Sukses,${salesData.ordersCount || 0}`);
    rows.push(`Rata-rata Nilai Transaksi (AOV),${Math.round(salesData.averageOrderValue || 0)}`);
    rows.push(`Jumlah Transaksi Batal/Gagal,${salesData.cancelledOrdersCount || 0}`);
    rows.push(`Potensi Omzet Batal,${salesData.cancelledRevenue || 0}`);
    rows.push('');

    // 2. Metode Pembayaran
    rows.push('--- 2. REKAPITULASI METODE PEMBAYARAN ---');
    rows.push('Metode Pembayaran,Jumlah Transaksi,Total Nominal (Rp),Pangsa Pasar (%)');
    if (paymentData?.byMethod && paymentData.byMethod.length > 0) {
      paymentData.byMethod.forEach((m: any) => {
        rows.push(`"${m.method}",${m.count},${m.total},${m.percentage}%`);
      });
    } else {
      rows.push('Belum ada data pembayaran,-,-,-');
    }
    rows.push('');

    // 3. Penjualan Harian
    rows.push('--- 3. REKAPITULASI PENJUALAN HARIAN ---');
    rows.push('Tanggal,Jumlah Pesanan,Penjualan Kotor,Diskon,Pajak,Service,Pendapatan Bersih');
    if (salesData?.byDay && salesData.byDay.length > 0) {
      salesData.byDay.forEach((d: any) => {
        rows.push(`"${d.date}",${d.orders},${d.subtotal},${d.discount},${d.tax},${d.service},${d.revenue}`);
      });
    } else {
      rows.push('Belum ada transaksi harian,-,-,-,-,-,-');
    }
    rows.push('');

    // 4. Performa Menu
    rows.push('--- 4. PERFORMA PENJUALAN MENU ---');
    rows.push('Nama Menu,Kategori,Kuantitas Terjual,Rata-rata Harga,Total Pendapatan (Rp)');
    filteredProducts.forEach((p: any) => {
      rows.push(`"${p.name}","${p.category}",${p.quantity_sold},${p.avg_price},${p.revenue}`);
    });
    rows.push('');

    // 5. Log Transaksi
    rows.push('--- 5. LOG TRANSAKSI RINCI ---');
    rows.push('No Pesanan,Tanggal & Jam,Meja,Nama Pelanggan,Kasir,Metode Pembayaran,Status,Total Akhir');
    filteredOrders.forEach((o: any) => {
      const pm = o.payments?.[0]?.method || 'TUNAI';
      const kasir = o.createdBy?.fullName || 'Sistem';
      const meja = o.table?.name || 'Takeaway';
      rows.push(
        `"${o.orderNumber}","${new Date(o.createdAt).toLocaleString('id-ID')}","${meja}","${o.customerName || '-'}","${kasir}","${pm}","${o.status}",${o.totalAmount}`
      );
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Keuangan_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <Banknote className="w-3 h-3" /> Tunai
          </span>
        );
      case 'QRIS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
            <QrCode className="w-3 h-3" /> QRIS
          </span>
        );
      case 'DEBIT_CARD':
      case 'CREDIT_CARD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <CreditCard className="w-3 h-3" /> Kartu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <DollarSign className="w-3 h-3" /> {method}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (['PAID', 'COMPLETED', 'DELIVERED'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" /> Selesai
        </span>
      );
    }
    if (['CANCELLED', 'PAYMENT_FAILED', 'EXPIRED'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
          <XCircle className="w-3 h-3" /> Batal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
        <Clock className="w-3 h-3" /> {status}
      </span>
    );
  };

  if (authLoading || (loading && !salesData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-amber-600" />
        <p className="text-sm font-semibold text-gray-500">Memuat data keuangan...</p>
      </div>
    );
  }

  return (
    <ModernStaffLayout>

      {/* Main Header Banner */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5 print:border-none print:p-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 print:hidden">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Laporan & Analitik Keuangan
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3 h-3" /> Real-time
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Pantau omzet penjualan, laba kotor, metode pembayaran, performa menu, dan rekap transaksi kasir
              </p>
            </div>
          </div>

          {/* Action Buttons: Export & Print */}
          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="Perbarui Data"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">Perbarui</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-xs shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gray-900 hover:bg-black active:scale-95 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card (Presets & Custom Date Range) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 print:hidden">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Filter Periode Penjualan</span>
            </div>

            {/* Active Range Display */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-medium">
              <span>Periode:</span>
              <strong className="font-bold">{formatDate(startDate)}</strong>
              <span>s/d</span>
              <strong className="font-bold">{formatDate(endDate)}</strong>
            </div>
          </div>

          {/* Preset Buttons & Date Inputs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'today', label: 'Hari Ini' },
                { key: 'yesterday', label: 'Kemarin' },
                { key: 'last7', label: '7 Hari Terakhir' },
                { key: 'last30', label: '30 Hari Terakhir' },
                { key: 'thisMonth', label: 'Bulan Ini' },
                { key: 'lastMonth', label: 'Bulan Lalu' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleSelectPreset(p.key as PresetKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activePreset === p.key
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Picker */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-500 font-medium pl-1">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-gray-500 font-medium">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={() => fetchData(true)}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Printable Report Header (Visible only when printed) */}
        <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
          <h2 className="text-xl font-bold text-gray-900">LAPORAN KEUANGAN & PENJUALAN</h2>
          <p className="text-xs text-gray-600 mt-1">
            Periode: {formatDate(startDate)} s/d {formatDate(endDate)} | Dicetak: {new Date().toLocaleString('id-ID')}
          </p>
        </div>

        {/* 6 Executive Financial Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {/* 1. Net Revenue */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-amber-600 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-amber-600/25 flex flex-col justify-between border border-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100 block">
                  Total Pendapatan Bersih
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                  {formatRupiah(salesData?.revenue || 0)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-700/60 border border-amber-400/30 flex items-center justify-center text-white">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-500/60 flex items-center justify-between text-xs text-amber-100">
              <span className="font-medium">{salesData?.ordersCount || 0} Transaksi Sukses</span>
              <span className="font-bold text-white">AOV: {formatRupiah(salesData?.averageOrderValue || 0)}</span>
            </div>
          </div>

          {/* 2. Gross Sales */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Penjualan Kotor
                </span>
                <div className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mt-1">
                  {formatRupiah(salesData?.grossSales || salesData?.revenue || 0)}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-gray-400 border-t border-gray-100 pt-2">
              Subtotal sebelum diskon & pajak
            </p>
          </div>

          {/* 3. Total Discounts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                  Total Diskon
                </span>
                <div className="text-lg sm:text-xl font-black text-rose-600 tracking-tight mt-1">
                  - {formatRupiah(salesData?.totalDiscount || 0)}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-gray-400 border-t border-gray-100 pt-2">
              Potongan promo & diskon menu
            </p>
          </div>

          {/* 4. Tax & Service */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Pajak & Service
                </span>
                <div className="text-lg sm:text-xl font-black text-emerald-700 tracking-tight mt-1">
                  {formatRupiah((salesData?.totalTax || 0) + (salesData?.totalService || 0))}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-gray-400 border-t border-gray-100 pt-2 flex justify-between">
              <span>PPN: {formatRupiah(salesData?.totalTax || 0)}</span>
              <span>Svc: {formatRupiah(salesData?.totalService || 0)}</span>
            </div>
          </div>

          {/* 5. Cancelled Orders */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Pesanan Batal
                </span>
                <div className="text-lg sm:text-xl font-black text-gray-700 tracking-tight mt-1">
                  {salesData?.cancelledOrdersCount || 0}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-rose-500 border-t border-gray-100 pt-2 truncate font-medium">
              Hangus: {formatRupiah(salesData?.cancelledRevenue || 0)}
            </p>
          </div>
        </div>

        {/* Tab Navigation (Daily Trend, Payment Methods, Product Sales, Order Log) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="border-b border-gray-200 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 print:hidden">
            <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'daily'
                    ? 'bg-white text-amber-800 shadow-xs border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Tren Penjualan Harian</span>
                {salesData?.byDay?.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                    {salesData.byDay.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'bg-white text-amber-800 shadow-xs border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Metode Pembayaran</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-white text-amber-800 shadow-xs border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Award className="w-4 h-4 text-purple-600" />
                <span>Performa Menu Terjual</span>
                {productData.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                    {productData.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'bg-white text-amber-800 shadow-xs border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Log Transaksi Pesanan</span>
                {ordersData.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {ordersData.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: DAILY SALES BREAKDOWN TABLE */}
          {(activeTab === 'daily' || typeof window !== 'undefined') && (
            <div className={`${activeTab !== 'daily' ? 'hidden print:block' : 'block'} p-4 sm:p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Rekap Penjualan Berkala</h3>
                  <p className="text-xs text-gray-500">Rincian omzet, volume transaksi, dan rata-rata per hari</p>
                </div>
              </div>

              {(!salesData?.byDay || salesData.byDay.length === 0) ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Tidak ada data penjualan tercatat pada rentang tanggal ini.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4 text-center">Transaksi</th>
                        <th className="py-3 px-4 text-right">Penjualan Kotor</th>
                        <th className="py-3 px-4 text-right text-rose-600">Diskon</th>
                        <th className="py-3 px-4 text-right">Pajak / Service</th>
                        <th className="py-3 px-4 text-right">Pendapatan Bersih</th>
                        <th className="py-3 px-4 text-right">Rata-rata (AOV)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {salesData.byDay.map((d: any, idx: number) => {
                        const aov = d.orders > 0 ? Math.round(d.revenue / d.orders) : 0;
                        return (
                          <tr key={idx} className="hover:bg-amber-50/40 transition">
                            <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                              {formatDate(d.date)}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-gray-700">
                              {d.orders}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600 font-medium">
                              {formatRupiah(d.subtotal || d.revenue)}
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600 font-medium">
                              {d.discount > 0 ? `-${formatRupiah(d.discount)}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600 font-medium">
                              {formatRupiah((d.tax || 0) + (d.service || 0))}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-amber-900">
                              {formatRupiah(d.revenue)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-500 font-semibold">
                              {formatRupiah(aov)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Summary Footer */}
                    <tfoot className="bg-amber-50/60 font-bold text-gray-900 border-t-2 border-amber-200">
                      <tr>
                        <td className="py-3 px-4">TOTAL PERIODE</td>
                        <td className="py-3 px-4 text-center">{salesData.ordersCount}</td>
                        <td className="py-3 px-4 text-right">{formatRupiah(salesData.grossSales || salesData.revenue)}</td>
                        <td className="py-3 px-4 text-right text-rose-600">
                          {salesData.totalDiscount > 0 ? `-${formatRupiah(salesData.totalDiscount)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatRupiah((salesData.totalTax || 0) + (salesData.totalService || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-amber-900 text-sm">
                          {formatRupiah(salesData.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatRupiah(salesData.averageOrderValue || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYMENT METHODS BREAKDOWN */}
          {(activeTab === 'payments' || typeof window !== 'undefined') && (
            <div className={`${activeTab !== 'payments' ? 'hidden print:block' : 'block'} p-4 sm:p-6 space-y-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Penerimaan Berdasarkan Metode Pembayaran</h3>
                  <p className="text-xs text-gray-500">Distribusi kas tunai vs non-tunai (QRIS, Kartu, Transfer)</p>
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  Total Terverifikasi: <strong className="text-gray-900">{formatRupiah(paymentData?.totalRevenue || 0)}</strong>
                </div>
              </div>

              {(!paymentData?.byMethod || paymentData.byMethod.length === 0) ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Belum ada pembayaran yang tercatat pada rentang tanggal ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentData.byMethod.map((item: any, idx: number) => {
                    const percentage = item.percentage || 0;
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {getPaymentBadge(item.method)}
                          </div>
                          <span className="text-sm font-black text-amber-800">{percentage}%</span>
                        </div>

                        <div>
                          <div className="text-xl font-black text-gray-900">
                            {formatRupiah(item.total)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.count} Transaksi Pembayaran
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCT SALES BREAKDOWN */}
          {(activeTab === 'products' || typeof window !== 'undefined') && (
            <div className={`${activeTab !== 'products' ? 'hidden print:block' : 'block'} p-4 sm:p-6 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Performa Menu & Produk Terjual</h3>
                  <p className="text-xs text-gray-500">Urutan menu terlaris dan kontribusi omzet pada periode terpilih</p>
                </div>

                <div className="relative w-full sm:w-64 print:hidden">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama menu / kategori..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Tidak ada menu yang terjual pada rentang tanggal ini.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Nama Menu</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-center">Kuantitas</th>
                        <th className="py-3 px-4 text-right">Rata-rata Harga</th>
                        <th className="py-3 px-4 text-right">Total Penjualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredProducts.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-amber-50/40 transition">
                          <td className="py-3 px-4 text-center font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-black text-amber-800">
                            {item.quantity_sold} porsi
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600 font-medium">
                            {formatRupiah(item.avg_price)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-900">
                            {formatRupiah(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSACTION ORDER LOG */}
          {(activeTab === 'transactions' || typeof window !== 'undefined') && (
            <div className={`${activeTab !== 'transactions' ? 'hidden print:block' : 'block'} p-4 sm:p-6 space-y-4`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Rincian Transaksi Pesanan</h3>
                  <p className="text-xs text-gray-500">Semua tiket pesanan yang masuk dalam rentang tanggal terpilih</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                    {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setTxStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          txStatusFilter === st
                            ? 'bg-white text-gray-900 shadow-xs font-bold'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {st === 'ALL' ? 'Semua' : st === 'COMPLETED' ? 'Lunas / Selesai' : 'Dibatalkan'}
                      </button>
                    ))}
                  </div>

                  {/* Search box */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari order # atau pelanggan..."
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Tidak ada transaksi pesanan ditemukan untuk filter ini.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">No. Pesanan</th>
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Meja / Info</th>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Metode Bayar</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Total Pembayaran</th>
                        <th className="py-3 px-4 text-center print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredOrders.map((order: any) => {
                        const paymentMethod = order.payments?.[0]?.method || 'CASH';
                        const tableName = order.table?.name || 'Takeaway';
                        return (
                          <tr key={order.id} className="hover:bg-amber-50/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                              {order.orderNumber}
                            </td>
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">
                              {formatDateTime(order.createdAt)}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-700">
                              {tableName}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {order.customerName || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {getPaymentBadge(paymentMethod)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-gray-900">
                              {formatRupiah(order.totalAmount)}
                            </td>
                            <td className="py-3 px-4 text-center print:hidden">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                                title="Lihat Rincian Struk"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Detail Pesanan & Struk Digital */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Rincian Struk #{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-amber-100 hover:text-white p-1 rounded-lg hover:bg-amber-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-100 pb-3">
                <div>
                  <p>Tanggal: <span className="font-semibold text-gray-800">{formatDateTime(selectedOrder.createdAt)}</span></p>
                  <p>Meja: <span className="font-semibold text-gray-800">{selectedOrder.table?.name || 'Takeaway'}</span></p>
                </div>
                <div className="text-right">
                  <p>Pelanggan: <span className="font-semibold text-gray-800">{selectedOrder.customerName || '-'}</span></p>
                  <p>Kasir: <span className="font-semibold text-gray-800">{selectedOrder.createdBy?.fullName || 'Sistem POS'}</span></p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Pesanan</h4>
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="py-2 flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900">
                          {item.quantity}x {item.productName}
                          {item.variantName && (
                            <span className="text-xs text-amber-700 font-semibold ml-1">({item.variantName})</span>
                          )}
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[11px] text-gray-500">
                            {item.modifiers.map((m: any, mIdx: number) => (
                              <span key={mIdx}>+ {m.modifierOption?.name || 'Opsi'} </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-gray-400 italic">Catatan: {item.notes}</p>
                        )}
                      </div>
                      <div className="font-bold text-gray-900">
                        {formatRupiah(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Kotor</span>
                  <span>{formatRupiah(selectedOrder.subtotal)}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Potongan Diskon</span>
                    <span>- {formatRupiah(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                {Number(selectedOrder.taxAmount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Pajak (PPN)</span>
                    <span>{formatRupiah(selectedOrder.taxAmount)}</span>
                  </div>
                )}
                {Number(selectedOrder.serviceChargeAmount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Biaya Layanan</span>
                    <span>{formatRupiah(selectedOrder.serviceChargeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>TOTAL PEMBAYARAN</span>
                  <span className="text-amber-700 text-base">{formatRupiah(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 block">Metode Pembayaran:</span>
                  <strong className="text-gray-900">{selectedOrder.payments?.[0]?.method || 'CASH'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Status:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernStaffLayout>
  );
}
