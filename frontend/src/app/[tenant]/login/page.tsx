'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Coffee, Lock, Mail, Loader2, ArrowRight, Store, AlertCircle } from 'lucide-react';

export default function TenantLoginPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params?.tenant as string;

  const [tenant, setTenant] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();

  useEffect(() => {
    if (!tenantSlug) return;
    api.get<any>(`/tenants/resolve/${tenantSlug}`).then((res) => {
      if (res) {
        setTenant(res);
        // Pre-fill demo email if demo-cafe
        if (tenantSlug === 'demo-cafe') {
          setEmail('admin@democafe.com');
          setPassword('admin123');
        }
      }
    }).catch((err) => {
      setError(err?.message || 'Kafe tidak ditemukan.');
    });
  }, [tenantSlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<any>('/auth/login', { email, password });
      login(res.accessToken, res.user);

      if (['ADMIN', 'OWNER'].includes(res.user.role)) {
        router.push(`/${tenantSlug}/admin/menu`);
      } else {
        router.push(`/${tenantSlug}/pos`);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal login. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-amber-50 to-orange-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-amber-100 space-y-6">
        <div className="text-center space-y-2">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="w-14 h-14 object-contain rounded-2xl bg-white p-1 border border-amber-200 mx-auto shadow-sm mb-3"
            />
          ) : (
            <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-amber-600/20 mb-3">
              <Coffee className="w-6 h-6" />
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            {tenant?.name || 'Login Staf Kafe'}
          </h1>
          <p className="text-xs text-gray-500">
            {tenant?.tagline || 'Masukkan kredensial akun kasir atau pengelola kafe'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Akun
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                placeholder="nama@kafe.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <a href={`/${tenantSlug}`} className="text-xs text-amber-800 hover:underline font-semibold">
            ← Kembali ke Portal {tenant?.name || 'Kafe'}
          </a>
        </div>
      </div>
    </div>
  );
}

