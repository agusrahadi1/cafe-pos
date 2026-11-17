'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ShieldAlert, Lock, Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SuperadminLoginPage() {
  const [email, setEmail] = useState('superadmin@cafepos.com');
  const [password, setPassword] = useState('superadmin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<any>('/auth/login', { email, password });
      if (res?.user?.role !== 'SUPERADMIN') {
        setError('Akses ditolak: Akun ini bukan Superadmin platform.');
        return;
      }

      login(res.accessToken, res.user);
      router.push('/superadmin');
    } catch (err: any) {
      setError(err?.message || 'Gagal login sebagai Superadmin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Superadmin Console</h1>
            <p className="text-xs text-slate-400">
              Masuk ke konsol kontrol terpusat Cafe POS Multi-Tenant SaaS
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Superadmin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/70 text-white pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-500"
                  placeholder="superadmin@cafepos.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/70 text-white pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo badge helper */}
          <div className="pt-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kredensial Superadmin Demo:
              </span>
              <p>Email: <code className="text-white">superadmin@cafepos.com</code></p>
              <p>Password: <code className="text-white">superadmin123</code></p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-400 transition">
            ← Kembali ke Portal Utama
          </a>
        </div>
      </div>
    </div>
  );
}

