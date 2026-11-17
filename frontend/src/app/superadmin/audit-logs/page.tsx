'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import SuperadminNavbar from '@/components/layout/SuperadminNavbar';
import { formatDateTime } from '@/lib/utils';
import {
  History,
  Search,
  RotateCw,
  Building2,
  User,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
} from 'lucide-react';

export default function SuperadminAuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/superadmin/login');
      } else if (user.role !== 'SUPERADMIN') {
        router.push('/login');
      }
    }
  }, [user, authLoading, router]);

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const offset = (page - 1) * limit;
      let queryUrl = `/superadmin/audit-logs?limit=${limit}&offset=${offset}`;
      if (selectedAction !== 'ALL') queryUrl += `&action=${selectedAction}`;
      if (searchQuery.trim()) queryUrl += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await api.get<any>(queryUrl);
      if (res && res.data) {
        setLogs(res.data);
        setTotalCount(res.total || 0);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      fetchLogs();
    }
  }, [user, page, selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'LOGIN':
      case 'REGISTER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'IMPERSONATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse';
      case 'DELETE':
      case 'SUSPEND':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'UPDATE':
      case 'PASSWORD_CHANGE':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <SuperadminNavbar />

      {/* Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-400" />
              <span>Log Aktivitas & Jejak Keamanan Sistem</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemantauan terpusat untuk aktivitas login, perubahan data, dan transaksi di seluruh tenan platform
            </p>
          </div>

          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Perbarui</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4 flex-1">
        {/* Filters Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari aksi, nama user, email, atau kafe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-20 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition"
            >
              Cari
            </button>
          </form>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {['ALL', 'LOGIN', 'IMPERSONATE', 'REGISTER', 'CREATE', 'UPDATE', 'DELETE'].map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => {
                  setSelectedAction(act);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedAction === act
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="p-4">Waktu & Tanggal</th>
                  <th className="p-4">Aksi</th>
                  <th className="p-4">Tenan Kafe</th>
                  <th className="p-4">Pelaku (User)</th>
                  <th className="p-4">Entitas Terkait</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Tidak ada rekaman log aktivitas yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 whitespace-nowrap text-slate-300">
                        {formatDateTime(log.createdAt)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="p-4">
                        {log.company ? (
                          <div>
                            <div className="font-bold text-white text-xs">{log.company.name}</div>
                            <div className="text-[10px] text-indigo-400 font-mono">/{log.company.slug}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sistem Platform</span>
                        )}
                      </td>

                      <td className="p-4">
                        {log.user ? (
                          <div>
                            <div className="font-semibold text-slate-200 text-xs">{log.user.fullName}</div>
                            <div className="text-[10px] text-slate-400">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Anonim / Sistem</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-mono text-slate-300 text-xs">{log.entity}</div>
                        {log.entityId && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                            ID: {log.entityId}
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '-'}
                      </td>

                      <td className="p-4 text-right">
                        {(log.newData || log.oldData) && (
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg transition inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer border border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Payload</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Total: <strong className="text-white">{totalCount}</strong> rekaman log aktivitas
            </div>

            <div className="flex items-center gap-2">
              <span>
                Halaman {page} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Payload Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Detail Payload Log</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Aksi & Entitas:</span>
                <p className="font-mono bg-slate-950 p-2 rounded-xl text-indigo-300">
                  {selectedLog.action} on {selectedLog.entity} (ID: {selectedLog.entityId || '-'})
                </p>
              </div>

              {selectedLog.newData && (
                <div>
                  <span className="text-slate-400 block mb-1">Data Baru / Payload:</span>
                  <pre className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.oldData && (
                <div>
                  <span className="text-slate-400 block mb-1">Data Sebelumnya:</span>
                  <pre className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-rose-400 overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <span className="text-slate-400 block mb-0.5">User Agent:</span>
                  <p className="text-[10px] text-slate-500 font-mono break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
