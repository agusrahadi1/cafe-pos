'use client';

import React, { useEffect, useState } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { Table } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  RotateCw,
  ExternalLink,
  Printer,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import TableQrStandeeCard from '@/components/tables/TableQrStandeeCard';

export default function AdminTablesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState(false);

  // Dynamic QR Order URL: automatically adapts to the live domain/IP accessed by the browser
  const getTableQrUrl = (token?: string | null, savedUrl?: string | null) => {
    if (!token) return '';
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      // If the saved URL in database contains localhost or 127.0.0.1, replace with current origin
      if (!savedUrl || savedUrl.includes('localhost') || savedUrl.includes('127.0.0.1')) {
        return `${origin}/order/${token}`;
      }
      return savedUrl;
    }
    return savedUrl || `/order/${token}`;
  };

  // Add Table Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchTables = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get<Table[]>('/tables');
      if (res && Array.isArray(res)) {
        setTables(res);
      }
    } catch (e: any) {
      console.error('Error fetching tables:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const fetchTenantProfile = async () => {
    try {
      const res = await api.get<any>('/tenants/profile');
      if (res) setTenantProfile(res);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchTables();
    fetchTenantProfile();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      setFormError('Nomor meja harus diisi (contoh: T11)');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.post<Table>('/tables', {
        tableNumber: newTableNumber.trim().toUpperCase(),
        name: newTableName.trim() || undefined,
        capacity: Number(newCapacity) || 4,
      });

      setIsAddModalOpen(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewCapacity(4);
      setActionSuccess(`Meja ${newTableNumber.trim().toUpperCase()} berhasil ditambahkan!`);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchTables();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menambahkan meja');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (table: Table) => {
    if (table.status !== 'AVAILABLE') {
      alert(`Meja ${table.tableNumber} tidak dapat dihapus karena sedang berstatus ${table.status}`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus Meja ${table.tableNumber}?`)) {
      return;
    }

    try {
      await api.delete(`/tables/${table.id}`);
      setActionSuccess(`Meja ${table.tableNumber} berhasil dihapus.`);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchTables();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus meja');
    }
  };

  const handleRegenerateQr = async (table: Table) => {
    if (!confirm(`Generate ulang token QR code untuk Meja ${table.tableNumber}? QR code lama tidak akan berlaku lagi.`)) {
      return;
    }

    try {
      await api.post(`/tables/${table.id}/regenerate-qr`, {});
      setActionSuccess(`QR code Meja ${table.tableNumber} berhasil diperbarui!`);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchTables();
    } catch (err: any) {
      alert(err?.message || 'Gagal memperbarui QR code');
    }
  };

  const handleClearTable = async (table: Table) => {
    if (!confirm(`Kosongkan Meja ${table.tableNumber} dan selesaikan pesanan yang menggantung?`)) {
      return;
    }

    try {
      await api.post(`/tables/${table.id}/clear`, {});
      setActionSuccess(`Meja ${table.tableNumber} berhasil dikosongkan dan siap digunakan!`);
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchTables();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengosongkan meja');
    }
  };

  const handleClearAllTables = async () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan SEMUA meja dan menyelesaikan seluruh pesanan yang menggantung?')) {
      return;
    }

    try {
      const res: any = await api.post('/tables/clear-all', {});
      setActionSuccess(res?.message || 'Semua meja berhasil dikosongkan!');
      setTimeout(() => setActionSuccess(''), 4000);
      await fetchTables();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengosongkan semua meja');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <ModernStaffLayout>

      {/* Main Page Wrapper: completely hidden when printing QR modals */}
      <div className={qrModalTable || isBatchPrintModalOpen ? 'print:hidden' : ''}>
        {/* Header Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Manajemen Meja & QR Code
              </h1>
              <p className="text-xs text-gray-500">
                Tambah meja baru, kelola kapasitas, dan cetak QR Code pemesanan meja pelanggan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchTables(true)}
              disabled={refreshing}
              className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
              <span>Perbarui</span>
            </button>

            <button
              onClick={() => setIsBatchPrintModalOpen(true)}
              className="p-2 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
              title="Cetak kartu QR untuk seluruh meja kafe (Format A4 Grid 4-in-1)"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Cetak Semua Meja (A4)</span>
            </button>

            <button
              onClick={handleClearAllTables}
              className="p-2 border border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-xl transition flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
              title="Kosongkan semua meja yang terisi dan selesaikan pesanan"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kosongkan Semua Meja</span>
            </button>

            <button
              onClick={() => {
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Meja</span>
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

      {/* Tables Grid */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1">
        {tables.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Meja</h3>
            <p className="text-xs text-gray-500 mb-4">Tambahkan meja pertama Anda untuk membuat QR code meja pemesanan.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Meja Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {tables.map((table) => {
              const qrToken = table.qrCode?.token || table.qrToken;
              const customerOrderUrl = qrToken ? `/order/${qrToken}` : null;

              return (
                <div
                  key={table.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  {/* Table Header & Status */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                        Meja Kafe
                      </span>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {table.tableNumber}
                      </h3>
                      <div className="text-xs font-medium text-gray-600 mt-0.5">
                        {table.name || `Meja ${table.tableNumber}`}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Kapasitas {table.capacity} Orang</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        table.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : table.status === 'ORDERING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>

                  {/* QR Code Preview Thumbnail */}
                  {qrToken ? (
                    <div
                      onClick={() => setQrModalTable(table)}
                      className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50/50 hover:border-amber-300 transition group"
                    >
                      <QRCodeSVG
                        value={getTableQrUrl(qrToken, table.qrCode?.url)}
                        size={110}
                        level="M"
                        includeMargin={false}
                      />
                      <span className="text-[10px] font-semibold text-gray-400 group-hover:text-amber-700 mt-2 flex items-center gap-1">
                        <Printer className="w-3 h-3" /> Klik untuk perbesar / cetak
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400">
                      QR code belum di-generate
                    </div>
                  )}

                  {/* Kosongkan Meja Button if not AVAILABLE */}
                  {table.status !== 'AVAILABLE' && (
                    <button
                      onClick={() => handleClearTable(table)}
                      className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Kosongkan meja ini dan selesaikan pesanan terkait"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kosongkan Meja</span>
                    </button>
                  )}

                  {/* Quick Actions */}
                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    {customerOrderUrl ? (
                      <Link
                        href={customerOrderUrl}
                        target="_blank"
                        className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
                      >
                        <span>Buka Menu</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}

                    <button
                      onClick={() => setQrModalTable(table)}
                      className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition"
                      title="Cetak Kartu QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRegenerateQr(table)}
                      className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-amber-600 transition"
                      title="Perbarui QR Token"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteTable(table)}
                      className="p-2 border border-gray-200 hover:bg-red-50 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-600 transition"
                      title="Hapus Meja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Tambah Meja Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nomor / Kode Meja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: T11, VIP-01, OUT-02"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Nomor meja harus unik di outlet ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Meja (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Meja 11 (Dekat Jendela)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Kapasitas Kursi (Orang)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-800">
                💡 <strong>Info:</strong> QR Code unik untuk meja ini akan otomatis dibuat dan siap dicetak setelah meja disimpan.
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Meja</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Single Table QR Standee Modal */}
      {qrModalTable && (
        <div className="print-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-transparent print:backdrop-blur-none print:block">
          <div className="print-modal-content bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:max-h-none print:overflow-visible">
            {/* Modal Header - Pinned at top, Hidden on Print */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-stone-50/70 shrink-0 print:hidden">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Kartu Stand Meja QR (Akrilik A6)
                </h3>
                <p className="text-[11px] text-stone-400">
                  Meja {qrModalTable.tableNumber} • Format Standee Siap Cetak
                </p>
              </div>
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0 print:overflow-visible print:p-0 print:m-0 print:space-y-0">
              {(() => {
                const activeToken = qrModalTable.qrCode?.token || qrModalTable.qrToken;
                const activeUrl = getTableQrUrl(activeToken, qrModalTable.qrCode?.url);

                return (
                  <>
                    {activeUrl && (
                      <div className="w-full bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 text-left flex items-center justify-between gap-2 shadow-2xs print:hidden">
                        <span className="text-[10px] font-mono text-stone-600 truncate select-all">
                          {activeUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activeUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 text-[10px] font-bold shrink-0 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    )}

                    {/* Professional Standee Card */}
                    <div id="printable-single-qr" className="flex justify-center py-1">
                      <TableQrStandeeCard
                        table={qrModalTable}
                        tenantProfile={tenantProfile}
                        qrUrl={activeUrl}
                        size="normal"
                        showCutGuide={true}
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Action Buttons - Pinned at bottom, ALWAYS visible on screen, Hidden on Print */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-stone-100 bg-white flex gap-2 print:hidden z-10">
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="flex-1 py-2.5 px-3 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>

              {(() => {
                const activeToken = qrModalTable.qrCode?.token || qrModalTable.qrToken;
                const activeUrl = getTableQrUrl(activeToken, qrModalTable.qrCode?.url);
                return activeToken ? (
                  <Link
                    href={activeUrl}
                    target="_blank"
                    className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <span>Tes Buka</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : null;
              })()}

              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Stand Meja</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Batch Print All Tables Modal (A4 Grid 4-in-1) */}
      {isBatchPrintModalOpen && (
        <div className="print-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent print:backdrop-blur-none print:block">
          <div className="print-modal-content bg-white w-full max-w-4xl rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:max-h-none">
            {/* Top Toolbar - Hidden on Print */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0 print:hidden">
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Cetak Semua QR Meja Sekaligus (Grid 4 Meja / Lembar A4)
                </h3>
                <p className="text-xs text-stone-400">
                  Total {tables.length} meja ({Math.ceil(tables.length / 4)} lembar A4) • Hemat kertas & siap potong untuk akrilik standee
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchPrintModalOpen(false)}
                  className="py-2 px-3 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Semua Lembar</span>
                </button>
              </div>
            </div>

            {/* Scrollable Printable Container on Screen / Direct Pagination on Print */}
            <div id="printable-batch-qr" className="flex-1 overflow-y-auto pr-1 space-y-6 print:overflow-visible print:p-0 print:m-0 print:space-y-0">
              {(() => {
                const batches: Table[][] = [];
                for (let i = 0; i < tables.length; i += 4) {
                  batches.push(tables.slice(i, i + 4));
                }

                return batches.map((batch, batchIdx) => (
                  <div
                    key={batchIdx}
                    className="p-4 bg-stone-50 rounded-2xl border border-stone-200 print:bg-transparent print:border-none print:p-0 print:m-0 print-page-break"
                  >
                    <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-3 print:hidden flex items-center justify-between">
                      <span>Lembar A4 #{batchIdx + 1} ({batch.length} Meja)</span>
                      <span>Standee Akrilik A6</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
                      {batch.map((t) => {
                        const token = t.qrCode?.token || t.qrToken;
                        const url = getTableQrUrl(token, t.qrCode?.url);
                        return (
                          <TableQrStandeeCard
                            key={t.id}
                            table={t}
                            tenantProfile={tenantProfile}
                            qrUrl={url}
                            size="compact"
                            showCutGuide={true}
                          />
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 3. Isolated Print Styles for Table QR Standee */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* 1. Hide the entire application DOM tree */
          body * {
            visibility: hidden !important;
          }
          /* 2. Un-hide ONLY the target printable container and its contents */
          #printable-single-qr,
          #printable-single-qr *,
          #printable-batch-qr,
          #printable-batch-qr * {
            visibility: visible !important;
          }
          /* 3. Pull printable target to top of printed page */
          #printable-single-qr {
            position: fixed !important;
            left: 0 !important;
            top: 15mm !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            background: transparent !important;
            z-index: 999999 !important;
          }
          #printable-batch-qr {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          .table-qr-card {
            box-shadow: none !important;
            margin: 0 auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}} />
    </ModernStaffLayout>
  );
}
