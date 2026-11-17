'use client';

import React, { useEffect, useState } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { Shift, ShiftStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatRupiah, formatDate, formatTime } from '@/lib/utils';
import {
  Clock,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Calendar,
  Banknote,
  TrendingUp,
  Receipt,
  Eye,
  AlertTriangle,
  User as UserIcon,
  ChevronRight,
  Coffee,
  Coins,
} from 'lucide-react';

export default function AdminShiftsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!authLoading && (!currentUser || !['ADMIN', 'OWNER', 'SUPERADMIN', 'CASHIER'].includes(currentUser.role))) {
      router.push('/pos');
    }
  }, [currentUser, authLoading, router]);

  const fetchShifts = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get<Shift[]>('/shifts');
      if (res && Array.isArray(res)) {
        setShifts(res);
      }
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const openDetailModal = async (shift: Shift) => {
    setLoadingDetail(true);
    try {
      const detail = await api.get<any>(`/shifts/${shift.id}`);
      setSelectedShiftDetail(detail);
    } catch (err: any) {
      alert(err?.message || 'Gagal memuat rincian shift');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredShifts = shifts.filter((s) => {
    if (selectedStatus === 'ALL') return true;
    return s.status === selectedStatus;
  });

  const activeShiftsCount = shifts.filter((s) => s.status === 'OPEN').length;
  const totalSalesAll = shifts.reduce((acc, s) => acc + Number(s.totalSales || 0), 0);
  const totalDiscrepancy = shifts.reduce((acc, s) => acc + Number(s.cashDifference || 0), 0);

  return (
    <ModernStaffLayout>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-amber-600" />
              <span>Shift Kasir & Rekonsiliasi</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pantau sesi kerja kasir, omzet per shift, dan selisih uang kas di laci kasir
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchShifts(true)}
              disabled={refreshing}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer"
              title="Perbarui Data"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shift Aktif</span>
              <div className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-2">
                <span>{activeShiftsCount} Kasir Bertugas</span>
                {activeShiftsCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center font-bold">
              <Coffee className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Omzet Shift</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{formatRupiah(totalSalesAll)}</div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Akumulasi Selisih Kas</span>
              <div
                className={`text-2xl font-black mt-1 ${
                  totalDiscrepancy === 0
                    ? 'text-gray-900'
                    : totalDiscrepancy < 0
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                {formatRupiah(totalDiscrepancy)}
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                totalDiscrepancy === 0
                  ? 'bg-gray-100 text-gray-600'
                  : totalDiscrepancy < 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              <Coins className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Status Shift:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSelectedStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedStatus === 'ALL'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Semua ({shifts.length})
              </button>
              <button
                onClick={() => setSelectedStatus('OPEN')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedStatus === 'OPEN'
                    ? 'bg-white text-amber-800 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Aktif / Berjalan ({shifts.filter((s) => s.status === 'OPEN').length})
              </button>
              <button
                onClick={() => setSelectedStatus('CLOSED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedStatus === 'CLOSED'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Ditutup ({shifts.filter((s) => s.status === 'CLOSED').length})
              </button>
            </div>
          </div>
        </div>

        {/* Shift Records Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-xs text-gray-500 font-medium">Memuat data shift...</p>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">Belum ada riwayat shift</p>
              <p className="text-xs text-gray-400 mt-1">Shift kasir akan otomatis tercatat saat kasir membuka shift di POS</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Kasir & Sesi Shift</th>
                    <th className="py-3.5 px-4">Waktu Mulai / Selesai</th>
                    <th className="py-3.5 px-4">Modal Awal</th>
                    <th className="py-3.5 px-4">Total Penjualan</th>
                    <th className="py-3.5 px-4">Tunai vs Non-Tunai</th>
                    <th className="py-3.5 px-4">Uang Fisik</th>
                    <th className="py-3.5 px-4">Selisih</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredShifts.map((s) => {
                    const diff = Number(s.cashDifference || 0);
                    return (
                      <tr key={s.id} className="hover:bg-amber-50/20 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{s.shiftName}</div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <UserIcon className="w-3 h-3 text-amber-700" />
                            <span>{s.cashier?.fullName || 'Kasir'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-gray-700 font-medium">
                            {formatDate(s.startTime)}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {formatTime(s.startTime)} -{' '}
                            {s.endTime ? formatTime(s.endTime) : <span className="text-amber-600 font-bold">Sedang Bertugas</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                          {formatRupiah(s.initialCash)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-gray-900">
                            {formatRupiah(s.totalSales)}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {s.ordersCount} pesanan
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[11px]">
                          <div className="text-emerald-700 font-medium">
                            Tunai: {formatRupiah(s.totalCash)}
                          </div>
                          <div className="text-blue-600">
                            Non-Tunai: {formatRupiah(s.totalNonCash)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                          {s.actualCash !== null && s.actualCash !== undefined ? (
                            formatRupiah(s.actualCash)
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {s.status === 'CLOSED' ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                diff === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : diff < 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {diff === 0 ? 'Pas (Rp 0)' : formatRupiah(diff)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {s.status === 'OPEN' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ditutup
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openDetailModal(s)}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Lihat Rincian Shift"
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
      </main>

      {/* Shift Detail Modal */}
      {selectedShiftDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <span>{selectedShiftDetail.shiftName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      selectedShiftDetail.status === 'OPEN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedShiftDetail.status}
                  </span>
                </h3>
                <span className="text-xs text-gray-500">
                  Kasir: {selectedShiftDetail.cashier?.fullName} • Mulai: {formatTime(selectedShiftDetail.startTime)}
                  {selectedShiftDetail.endTime && ` s/d ${formatTime(selectedShiftDetail.endTime)}`}
                </span>
              </div>
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Financial Reconciliation Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Modal Awal</span>
                  <span className="text-sm font-black text-gray-900 font-mono">
                    {formatRupiah(selectedShiftDetail.initialCash)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Omzet</span>
                  <span className="text-sm font-black text-amber-800 font-mono">
                    {formatRupiah(selectedShiftDetail.totalSales)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Estimasi Kas Laci</span>
                  <span className="text-sm font-black text-gray-900 font-mono">
                    {formatRupiah(selectedShiftDetail.expectedCash)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Selisih Kas</span>
                  <span
                    className={`text-sm font-black font-mono ${
                      Number(selectedShiftDetail.cashDifference || 0) === 0
                        ? 'text-emerald-700'
                        : Number(selectedShiftDetail.cashDifference || 0) < 0
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {formatRupiah(selectedShiftDetail.cashDifference || 0)}
                  </span>
                </div>
              </div>

              {/* Payment Breakdown */}
              {(() => {
                const breakdown: Record<string, { count: number; total: number }> =
                  selectedShiftDetail.summary?.paymentBreakdown || {};

                if (Object.keys(breakdown).length === 0 && selectedShiftDetail.orders) {
                  for (const ord of selectedShiftDetail.orders) {
                    for (const p of (ord.payments || [])) {
                      const m = p.method || 'CASH';
                      if (!breakdown[m]) breakdown[m] = { count: 0, total: 0 };
                      breakdown[m].count += 1;
                      breakdown[m].total += Number(p.amount || 0);
                    }
                  }
                }

                return (
                  <div className="space-y-3">
                    {/* Sektor 1: Kas Fisik Laci */}
                    <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Pos Kas Tunai Laci (Wajib Disetor Kasir)</span>
                        </span>
                        <span className="font-mono font-black text-emerald-800">
                          {formatRupiah(selectedShiftDetail.totalCash)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-stone-600">
                        <div className="flex justify-between bg-white p-2 rounded-xl border border-emerald-100">
                          <span>Target Laci (Modal + Tunai):</span>
                          <span className="font-mono font-bold text-stone-900">{formatRupiah(selectedShiftDetail.expectedCash)}</span>
                        </div>
                        <div className="flex justify-between bg-white p-2 rounded-xl border border-emerald-100">
                          <span>Uang Fisik Dihitung:</span>
                          <span className="font-mono font-bold text-stone-900">
                            {selectedShiftDetail.actualCash !== null && selectedShiftDetail.actualCash !== undefined
                              ? formatRupiah(selectedShiftDetail.actualCash)
                              : 'Belum dihitung'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sektor 2: Penerimaan Non-Tunai (Bank & EDC) */}
                    <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-blue-700" />
                          <span>Pos Non-Tunai (Langsung Masuk Rekening / EDC)</span>
                        </span>
                        <span className="font-mono font-black text-blue-800">
                          {formatRupiah(selectedShiftDetail.totalNonCash)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-400 block font-bold">QRIS (BorderPay)</span>
                          <span className="font-mono font-black text-stone-900 block text-xs">
                            {formatRupiah(breakdown['QRIS']?.total ?? breakdown['BORDERPAY']?.total ?? 0)}
                          </span>
                          <span className="text-[9px] text-stone-400">
                            {breakdown['QRIS']?.count ?? breakdown['BORDERPAY']?.count ?? 0} trx
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-400 block font-bold">Debit EDC</span>
                          <span className="font-mono font-black text-stone-900 block text-xs">
                            {formatRupiah(breakdown['DEBIT_CARD']?.total || 0)}
                          </span>
                          <span className="text-[9px] text-stone-400">{breakdown['DEBIT_CARD']?.count || 0} trx</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-400 block font-bold">Kredit EDC</span>
                          <span className="font-mono font-black text-stone-900 block text-xs">
                            {formatRupiah(breakdown['CREDIT_CARD']?.total || 0)}
                          </span>
                          <span className="text-[9px] text-stone-400">{breakdown['CREDIT_CARD']?.count || 0} trx</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-stone-400 block font-bold">Transfer</span>
                          <span className="font-mono font-black text-stone-900 block text-xs">
                            {formatRupiah(breakdown['BANK_TRANSFER']?.total || 0)}
                          </span>
                          <span className="text-[9px] text-stone-400">{breakdown['BANK_TRANSFER']?.count || 0} trx</span>
                        </div>
                      </div>
                    </div>

                    {selectedShiftDetail.notes && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950">
                        <span className="font-bold block">Catatan Kasir:</span>
                        <p className="italic mt-0.5">&quot;{selectedShiftDetail.notes}&quot;</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Orders List for this Shift */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Daftar Pesanan ({selectedShiftDetail.orders?.length || 0})
                  </span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                  {(!selectedShiftDetail.orders || selectedShiftDetail.orders.length === 0) ? (
                    <div className="p-6 text-center text-gray-400">Belum ada transaksi pada shift ini</div>
                  ) : (
                    selectedShiftDetail.orders.map((ord: any) => (
                      <div key={ord.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <div className="font-mono font-bold text-gray-900 flex items-center gap-2">
                            <span>#{ord.orderNumber}</span>
                            <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {ord.table?.tableNumber ? `Meja ${ord.table.tableNumber}` : 'Takeaway'} • {ord.customerName || 'Customer'} • {formatTime(ord.createdAt)}
                          </div>
                        </div>

                        <div className="font-mono font-bold text-gray-900">
                          {formatRupiah(ord.totalAmount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedShiftDetail(null)}
                className="px-5 py-2 bg-gray-800 text-white rounded-xl text-xs font-semibold hover:bg-black transition"
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

