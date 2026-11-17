'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Coffee, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@democafe.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<any>('/auth/login', {
        email,
        password,
      });

      if (res && res.accessToken && res.user) {
        login(res.accessToken, res.user);

        // Redirect based on role
        if (res.user.role === 'KITCHEN') {
          router.push('/kitchen');
        } else if (res.user.role === 'WAITER') {
          router.push('/waiter');
        } else {
          router.push('/pos');
        }
      } else {
        setError('Format respon server tidak valid');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-gray-50 to-orange-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2 text-amber-700 font-extrabold text-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
            <Coffee className="w-6 h-6" />
          </div>
          <span>Cafe POS</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          Masuk ke Portal Staf
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Masuk untuk mengakses kasir, dapur, pelayan, dan laporan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  placeholder="admin@democafe.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Akun Demo Cepat:</div>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@democafe.com', 'admin123')}
              className="w-full text-left p-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/50 text-xs text-amber-900 transition flex justify-between items-center"
            >
              <div>
                <span className="font-semibold">Admin / Owner / Kasir:</span> admin@democafe.com
              </div>
              <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900 font-mono">admin123</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-gray-500 space-y-1">
          <div>
            <span>© 2026 Cafe POS • </span>
            <Link href="/privacy-policy" className="text-amber-800 hover:underline font-semibold">
              Kebijakan Privasi
            </Link>
          </div>
          <p className="text-[11px] text-gray-400">Platform F&B terpercaya oleh PT ADNAN BERKAH SEJAHTERA</p>
        </div>
      </div>
    </div>
  );
}

