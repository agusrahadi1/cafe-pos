/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import {
  Withdrawal,
  BalanceMutation,
  PayoutConfig,
} from '@/types';
import {
  Store,
  Image as ImageIcon,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PackageCheck,
  Utensils,
  Users,
  Upload,
  QrCode,
  Zap,
  CreditCard,
  Sparkles,
  ShieldCheck,
  X,
  Coins,
  Wallet,
  ArrowDownToLine,
  Landmark,
  FileText,
  RotateCw,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  ExternalLink,
  Clock,
} from 'lucide-react';

const POPULAR_BANKS = [
  { code: 'BCA', name: 'Bank Central Asia (BCA)' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'PERMATA', name: 'Bank Permata' },
  { code: 'DANAMON', name: 'Bank Danamon' },
  { code: 'JAGO', name: 'Bank Jago' },
  { code: 'SEABANK', name: 'SeaBank Indonesia' },
];

export default function TenantSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Default Bank Account States
  const [defaultBankCode, setDefaultBankCode] = useState('BCA');
  const [defaultBankName, setDefaultBankName] = useState('Bank Central Asia (BCA)');
  const [defaultAccountNumber, setDefaultAccountNumber] = useState('');
  const [defaultAccountName, setDefaultAccountName] = useState('');

  // Tax & Service Charge States
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(false);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [isServiceEnabled, setIsServiceEnabled] = useState<boolean>(false);

  // Subscription Renewal Modal (BorderPay SaaS Key)
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [submittingSubscription, setSubmittingSubscription] = useState(false);
  const [renewalError, setRenewalError] = useState('');
  const [embeddedQrisData, setEmbeddedQrisData] = useState<{
    orderId?: string | null;
    paymentUrl?: string | null;
    qrString?: string | null;
    grossAmount?: number;
    planName?: string;
  } | null>(null);
  const [isSaaSSuccess, setIsSaaSSuccess] = useState(false);
  const [isCheckingSaaS, setIsCheckingSaaS] = useState(false);

  // Payout / Withdrawal & Saldo QRIS States
  const [payoutConfig, setPayoutConfig] = useState<PayoutConfig | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [mutations, setMutations] = useState<BalanceMutation[]>([]);
  const [loadingPayoutData, setLoadingPayoutData] = useState(false);
  const [financeTab, setFinanceTab] = useState<'withdrawals' | 'mutations'>('withdrawals');

  // Withdrawal Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawBankCode, setWithdrawBankCode] = useState('BCA');
  const [withdrawBankName, setWithdrawBankName] = useState('Bank Central Asia (BCA)');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountHolderName, setWithdrawAccountHolderName] = useState('');
  const [withdrawSaveAsDefault, setWithdrawSaveAsDefault] = useState(true);
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Hanya file gambar (PNG, JPG, SVG, WEBP) yang diperbolehkan untuk logo');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran logo maksimal 5MB');
      return;
    }

    setIsUploadingLogo(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.upload<{ url: string }>('/uploads/image?folder=logos', formData);
      if (res?.url) {
        setLogoUrl(res.url);
        setSuccessMsg('Logo berhasil diunggah! Klik "Simpan Pengaturan" untuk menerapkan.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setErrorMsg(err?.message || 'Gagal mengunggah logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Hanya file gambar barcode (PNG, JPG, WEBP) yang diperbolehkan untuk QRIS');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar QRIS maksimal 5MB');
      return;
    }

    setIsUploadingQris(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.upload<{ url: string }>('/uploads/image?folder=logos', formData);
      if (res?.url) {
        setQrisImageUrl(res.url);
        setSuccessMsg('Barcode QRIS berhasil diunggah! Klik "Simpan Pengaturan" untuk menerapkan.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      console.error('Error uploading QRIS:', err);
      setErrorMsg(err?.message || 'Gagal mengunggah gambar QRIS');
    } finally {
      setIsUploadingQris(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get<any>('/tenants/profile');
      if (res) {
        setTenant(res);
        setName(res.name || '');
        setTagline(res.tagline || '');
        setAddress(res.address || '');
        setPhone(res.phone || '');
        setLogoUrl(res.logoUrl || res.logo || '');
        setQrisImageUrl(res.qrisImageUrl || '');
        setReceiptFooter(res.receiptFooter || '');

        setDefaultBankCode(res.defaultBankCode || 'BCA');
        setDefaultBankName(res.defaultBankName || 'Bank Central Asia (BCA)');
        setDefaultAccountNumber(res.defaultAccountNumber || '');
        setDefaultAccountName(res.defaultAccountName || '');

        // Populate withdrawal modal defaults
        setWithdrawBankCode(res.defaultBankCode || 'BCA');
        setWithdrawBankName(res.defaultBankName || 'Bank Central Asia (BCA)');
        setWithdrawAccountNumber(res.defaultAccountNumber || '');
        setWithdrawAccountHolderName(res.defaultAccountName || '');

        const defaultOutlet = res.outlets?.[0];
        if (defaultOutlet) {
          const tRate = Number(defaultOutlet.taxRate || 0);
          const sRate = Number(defaultOutlet.serviceCharge || 0);
          setTaxRate(tRate);
          setIsTaxEnabled(tRate > 0);
          setServiceCharge(sRate);
          setIsServiceEnabled(sRate > 0);
        }
      }
    } catch (e: any) {
      console.error('Error fetching tenant profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutData = async () => {
    setLoadingPayoutData(true);
    try {
      const [configRes, withdrawalsRes, mutationsRes] = await Promise.all([
        api.get<PayoutConfig>('/tenants/payout-config').catch(() => null),
        api.get<{ items: Withdrawal[] }>('/tenants/withdrawals?limit=15').catch(() => null),
        api.get<{ items: BalanceMutation[] }>('/tenants/balance-mutations?limit=25').catch(() => null),
      ]);

      if (configRes) {
        setPayoutConfig(configRes);
        if (configRes.defaultBank) {
          if (configRes.defaultBank.bankCode) setWithdrawBankCode(configRes.defaultBank.bankCode);
          if (configRes.defaultBank.bankName) setWithdrawBankName(configRes.defaultBank.bankName);
          if (configRes.defaultBank.accountNumber) setWithdrawAccountNumber(configRes.defaultBank.accountNumber);
          if (configRes.defaultBank.accountHolderName) setWithdrawAccountHolderName(configRes.defaultBank.accountHolderName);
        }
      }

      if (withdrawalsRes?.items) {
        setWithdrawals(withdrawalsRes.items);
      }

      if (mutationsRes?.items) {
        setMutations(mutationsRes.items);
      }
    } catch (err) {
      console.error('Error fetching payout data:', err);
    } finally {
      setLoadingPayoutData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPayoutData();
    }
  }, [user]);

  // Handle auto-confirmation if returning from BorderPay payment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = urlParams.get('payment') === 'success';
      const orderId = urlParams.get('orderId');
      const planSlug = urlParams.get('plan');
      const durationMonths = parseInt(urlParams.get('months') || '1', 10);

      if (isPaymentSuccess && orderId && planSlug) {
        api
          .post('/tenants/subscription/confirm', {
            orderId,
            planSlug,
            durationMonths,
          })
          .then(() => {
            setSuccessMsg('Pembayaran BorderPay berhasil! Paket langganan Anda telah aktif.');
            fetchProfile();
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((e) => {
            console.warn('Subscription confirmation error:', e);
          });
      }
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsJustSaved(false);

    try {
      await api.put('/tenants/profile', {
        name,
        tagline: tagline || undefined,
        address: address || undefined,
        phone: phone || undefined,
        logoUrl: logoUrl || undefined,
        qrisImageUrl: qrisImageUrl || null,
        receiptFooter: receiptFooter || undefined,
        taxRate: isTaxEnabled ? Number(taxRate) : 0,
        serviceCharge: isServiceEnabled ? Number(serviceCharge) : 0,
        defaultBankCode,
        defaultBankName,
        defaultAccountNumber,
        defaultAccountName,
      });

      setIsJustSaved(true);
      setShowSavedToast(true);
      setSuccessMsg('Profil, logo, rekening penarikan, & pengaturan kafe berhasil disimpan!');

      setTimeout(() => {
        setIsJustSaved(false);
      }, 3000);

      setTimeout(() => {
        setShowSavedToast(false);
        setSuccessMsg('');
      }, 4500);

      await fetchProfile();
      await fetchPayoutData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan pengaturan profil');
    } finally {
      setSaving(false);
    }
  };

  // Check SaaS payment status for active orderId
  const checkSaaSStatus = async (isManual = false) => {
    if (!embeddedQrisData?.orderId || isSaaSSuccess) return;
    if (isManual) setIsCheckingSaaS(true);

    try {
      const res = await api.get<{ isPaid: boolean; status?: string }>(
        `/tenants/subscription/status/${embeddedQrisData.orderId}`,
      );

      if (res?.isPaid) {
        setIsSaaSSuccess(true);
        setSuccessMsg('Pembayaran Berhasil! Paket langganan SaaS telah aktif.');
        setShowSavedToast(true);
        await fetchProfile();

        setTimeout(() => {
          setIsRenewalModalOpen(false);
          setEmbeddedQrisData(null);
          setIsSaaSSuccess(false);
        }, 2200);
      }
    } catch (e) {
      // silently ignore background poll errors
    } finally {
      if (isManual) setIsCheckingSaaS(false);
    }
  };

  // Background polling for subscription renewal when QRIS is open
  useEffect(() => {
    if (!embeddedQrisData?.orderId || !isRenewalModalOpen || isSaaSSuccess) return;

    const interval = setInterval(() => {
      checkSaaSStatus(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [embeddedQrisData?.orderId, isRenewalModalOpen, isSaaSSuccess]);

  const handleCheckoutSubscription = async () => {
    setSubmittingSubscription(true);
    setRenewalError('');
    setIsSaaSSuccess(false);
    try {
      const res = await api.post<any>('/tenants/subscription/checkout', {
        planSlug: selectedPlan,
        billingCycle,
      });

      if (!res?.paymentUrl && !res?.redirectUrl) {
        throw new Error('Gagal mendapatkan tautan transaksi pembayaran BorderPay.');
      }

      setEmbeddedQrisData({
        orderId: res.orderId,
        paymentUrl: res.paymentUrl || res.redirectUrl,
        qrString: res.qrString || res.paymentUrl || res.redirectUrl,
        grossAmount: res.grossAmount,
        planName: res.plan?.name || selectedPlan.toUpperCase(),
      });
    } catch (err: any) {
      setRenewalError(err?.message || 'Terjadi kesalahan saat memproses transaksi langganan BorderPay.');
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const amountNum = parseFloat(withdrawAmount.replace(/\D/g, ''));
    if (!amountNum || isNaN(amountNum)) {
      setWithdrawError('Mohon masukkan nominal penarikan yang valid.');
      return;
    }

    const fee = payoutConfig?.payoutFee ?? 4500;
    if (amountNum <= fee) {
      setWithdrawError(`Nominal penarikan harus lebih besar dari biaya admin penarikan (${formatRupiah(fee)}).`);
      return;
    }

    const currentBal = payoutConfig?.qrisBalance ?? 0;
    if (amountNum > currentBal) {
      setWithdrawError(`Saldo QRIS tidak mencukupi. Saldo tersedia: ${formatRupiah(currentBal)}`);
      return;
    }

    if (!withdrawAccountNumber.trim() || !withdrawAccountHolderName.trim()) {
      setWithdrawError('Nomor rekening dan nama pemilik rekening wajib diisi.');
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const res = await api.post<any>('/tenants/withdrawals', {
        amount: amountNum,
        bankCode: withdrawBankCode,
        bankName: withdrawBankName,
        accountNumber: withdrawAccountNumber.trim(),
        accountHolderName: withdrawAccountHolderName.trim(),
        saveAsDefault: withdrawSaveAsDefault,
        notes: withdrawNotes.trim() || undefined,
      });

      setWithdrawSuccess(res?.message || 'Permintaan penarikan dana berhasil diproses.');
      setWithdrawAmount('');
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess('');
      }, 2500);

      await fetchPayoutData();
    } catch (err: any) {
      setWithdrawError(err?.message || 'Gagal mengajukan penarikan dana');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleQuickAmount = (ratio: number) => {
    const bal = payoutConfig?.qrisBalance || 0;
    const target = Math.floor(bal * ratio);
    setWithdrawAmount(target > 0 ? new Intl.NumberFormat('id-ID').format(target) : '0');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const quotas = tenant?.quotas;
  const plan = tenant?.activeSubscription?.plan;
  const currentQrisBalance = payoutConfig?.qrisBalance ?? 0;
  const currentPayoutFee = payoutConfig?.payoutFee ?? 4500;
  const withdrawNum = parseFloat(withdrawAmount.replace(/\D/g, '')) || 0;
  const withdrawNetEstimate = Math.max(0, withdrawNum - currentPayoutFee);

  return (
    <ModernStaffLayout>
      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Pengaturan Profil & Branding Kafe
              </h1>
              <p className="text-xs text-gray-500">
                Atur identitas kafe, saldo QRIS & penarikan dana BorderPay, kuota paket, dan footer struk
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-3 shadow-xs animate-in slide-in-from-top-3 fade-in duration-300">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-950">Berhasil Disimpan!</p>
              <p className="text-[11px] text-emerald-700 font-normal">{successMsg}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Subscription & Quota Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Paket Langganan Kafe Anda</h3>
                <p className="text-[11px] text-gray-500">
                  Paket aktif: <strong className="text-amber-800">{plan?.name || 'Enterprise'}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-gray-500">
                Masa Aktif:{' '}
                <strong className="text-gray-900">
                  {tenant?.activeSubscription?.endDate
                    ? new Date(tenant.activeSubscription.endDate).toLocaleDateString('id-ID', {
                        dateStyle: 'long',
                      })
                    : 'Permanen'}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                <span>Perpanjang / Upgrade Paket</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Menu Quota */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" /> Kuota Menu Produk
                </span>
                <span className="font-bold text-gray-900">
                  {quotas?.products?.used || 0} /{' '}
                  {quotas?.products?.isUnlimited ? '∞ (Unlimited)' : quotas?.products?.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all"
                  style={{
                    width: quotas?.products?.isUnlimited
                      ? '15%'
                      : `${Math.min(100, ((quotas?.products?.used || 0) / (quotas?.products?.max || 1)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Staff Quota */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Kuota Akun Staf / Kasir
                </span>
                <span className="font-bold text-gray-900">
                  {quotas?.staff?.used || 0} /{' '}
                  {quotas?.staff?.isUnlimited ? '∞ (Unlimited)' : quotas?.staff?.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{
                    width: quotas?.staff?.isUnlimited
                      ? '25%'
                      : `${Math.min(100, ((quotas?.staff?.used || 0) / (quotas?.staff?.max || 1)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. NEW: SALDO PENJUALAN QRIS & PENARIKAN DANA (BORDERPAY PAYOUT) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-gray-900">Saldo QRIS & Penarikan Dana</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> BorderPay Payout
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pendapatan pesanan QRIS meja otomatis masuk ke saldo ini dan dapat dicairkan langsung ke rekening bank Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPayoutData}
                disabled={loadingPayoutData}
                className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer"
                title="Segarkan Saldo"
              >
                <RotateCw className={`w-4 h-4 ${loadingPayoutData ? 'animate-spin text-amber-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setWithdrawError('');
                  setWithdrawSuccess('');
                  setWithdrawAmount('');
                  setIsWithdrawModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Tarik Saldo (Withdraw)</span>
              </button>
            </div>
          </div>

          {/* Cards Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Saldo Tersedia */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white p-5 rounded-2xl border border-emerald-200/80 space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Saldo QRIS Tersedia</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-2xl font-black text-emerald-950 pt-1">
                {formatRupiah(currentQrisBalance)}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium pt-1">
                Akumulasi bersih dari seluruh transaksi QRIS meja yang lunas.
              </p>
            </div>

            {/* Total Telah Dicairkan */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Telah Dicairkan</span>
                <TrendingDown className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-black text-gray-900 pt-1">
                {formatRupiah(payoutConfig?.totalWithdrawn || 0)}
              </div>
              <p className="text-[11px] text-gray-500 font-medium pt-1">
                Total dana yang sukses ditransfer ke rekening bank pemilik.
              </p>
            </div>

            {/* Biaya Admin Penarikan */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Biaya Admin Penarikan</span>
                <Landmark className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-black text-amber-800 pt-1">
                {formatRupiah(currentPayoutFee)}
              </div>
              <p className="text-[11px] text-gray-500 font-medium pt-1">
                Biaya transfer antar-bank (Ditetapkan Platform Superadmin).
              </p>
            </div>
          </div>

          {/* Finance Tabs: Riwayat Penarikan vs Buku Besar Mutasi Saldo */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center border-b border-gray-200">
              <button
                type="button"
                onClick={() => setFinanceTab('withdrawals')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  financeTab === 'withdrawals'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Riwayat Penarikan Dana ({withdrawals.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFinanceTab('mutations')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  financeTab === 'mutations'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buku Besar Mutasi Saldo ({mutations.length})</span>
              </button>
            </div>

            {/* TAB 1: WITHDRAWALS TABLE */}
            {financeTab === 'withdrawals' && (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5">Tanggal</th>
                      <th className="py-3 px-3.5">Ref ID</th>
                      <th className="py-3 px-3.5">Bank Tujuan</th>
                      <th className="py-3 px-3.5 text-right">Nominal Tarik</th>
                      <th className="py-3 px-3.5 text-right">Biaya Admin</th>
                      <th className="py-3 px-3.5 text-right font-black">Dana Bersih</th>
                      <th className="py-3 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                          Belum ada riwayat penarikan dana. Klik &quot;Tarik Saldo&quot; untuk mencairkan pendapatan QRIS Anda.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50/60 transition">
                          <td className="py-3 px-3.5 text-gray-600 font-medium">
                            {formatDateTime(w.createdAt)}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-[11px] font-bold text-gray-800">
                            {w.referenceId}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-gray-900">{w.bankName}</div>
                            <div className="text-[11px] text-gray-500">
                              {w.accountNumber} a.n {w.accountHolderName}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-right font-semibold text-gray-700">
                            {formatRupiah(w.amount)}
                          </td>
                          <td className="py-3 px-3.5 text-right text-red-600 font-semibold">
                            -{formatRupiah(w.fee)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-black text-emerald-700">
                            {formatRupiah(w.netAmount)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                w.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : w.status === 'PROCESSING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : w.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {w.status === 'COMPLETED'
                                ? 'BERHASIL'
                                : w.status === 'PROCESSING'
                                ? 'DIPROSES'
                                : w.status === 'FAILED'
                                ? 'GAGAL'
                                : w.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: MUTATIONS TABLE (BUKU BESAR MUTASI) */}
            {financeTab === 'mutations' && (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5">Waktu</th>
                      <th className="py-3 px-3.5">Jenis Transaksi</th>
                      <th className="py-3 px-3.5">Keterangan</th>
                      <th className="py-3 px-3.5 text-right">Perubahan</th>
                      <th className="py-3 px-3.5 text-right">Saldo Awal</th>
                      <th className="py-3 px-3.5 text-right font-black">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mutations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                          Belum ada mutasi saldo tercatat.
                        </td>
                      </tr>
                    ) : (
                      mutations.map((m) => {
                        const isCredit = Number(m.amount) > 0;
                        return (
                          <tr key={m.id} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-3.5 text-gray-600 font-medium">
                              {formatDateTime(m.createdAt)}
                            </td>
                            <td className="py-3 px-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  isCredit
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {isCredit ? (
                                  <>
                                    <ArrowUpRight className="w-3 h-3" /> Penjualan QRIS
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownRight className="w-3 h-3" /> Penarikan Dana
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-gray-700 font-medium">
                              {m.description || m.referenceId || '-'}
                            </td>
                            <td
                              className={`py-3 px-3.5 text-right font-black ${
                                isCredit ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {isCredit ? `+${formatRupiah(m.amount)}` : formatRupiah(m.amount)}
                            </td>
                            <td className="py-3 px-3.5 text-right text-gray-500 font-semibold">
                              {formatRupiah(m.balanceBefore)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-black text-gray-900">
                              {formatRupiah(m.balanceAfter)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 3. Profile & Branding Form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <span>Identitas & Informasi Kafe</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Informasi ini akan muncul di header aplikasi, tampilan kasir POS, dan struk belanja
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nama Kafe / Restoran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Tagline / Slogan Kafe
              </label>
              <input
                type="text"
                placeholder="Contoh: Artisanal Coffee & Warm Pastry"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nomor Telepon / Kontak
              </label>
              <input
                type="text"
                placeholder="+62 21 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Alamat Kafe
              </label>
              <input
                type="text"
                placeholder="Jl. Senopati No. 45, Jakarta Selatan"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Logo Kafe Upload Section */}
          <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200/70 space-y-3">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-700" />
                <span>Logo Kafe / Identitas Brand</span>
              </span>
              {isUploadingLogo && (
                <span className="text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah logo...
                </span>
              )}
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-amber-300 flex items-center justify-center p-2 shrink-0 relative group shadow-xs">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo Kafe" className="w-full h-full object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute inset-0 bg-black/60 text-white rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Hapus Logo"
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <Store className="w-8 h-8 text-amber-400 stroke-1" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? 'Ganti Logo' : 'Upload Logo Kafe'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingLogo}
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-3 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  Format gambar PNG, JPG, atau WEBP. Maksimal ukuran 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Barcode QRIS Statis Cadangan Kafe */}
          <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-200/70 space-y-3">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Barcode QRIS Manual (Cadangan Kasir)</span>
              </span>
              {isUploadingQris && (
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah QRIS...
                </span>
              )}
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center p-2 shrink-0 relative group shadow-xs">
                {qrisImageUrl ? (
                  <>
                    <img src={qrisImageUrl} alt="QRIS Kafe" className="w-full h-full object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setQrisImageUrl('')}
                      className="absolute inset-0 bg-black/60 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold cursor-pointer"
                      title="Hapus Barcode QRIS"
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <>
                    <QrCode className="w-8 h-8 stroke-1 text-emerald-400" />
                    <span className="text-[9px] text-gray-400 mt-1 font-medium text-center">Belum Ada QRIS</span>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{qrisImageUrl ? 'Ganti Barcode QRIS' : 'Upload Barcode QRIS Kafe'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingQris}
                      onChange={handleQrisUpload}
                      className="hidden"
                    />
                  </label>
                  {qrisImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQrisImageUrl('')}
                      className="px-3 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Hapus QRIS
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Unggah gambar barcode QRIS cadangan (statis). QRIS dinamis otomatis diproses terintegrasi via gateway BorderPay.
                </p>
              </div>
            </div>
          </div>

          {/* Rekening Bank Utama Kafe (Untuk Pencairan Dana) */}
          <div className="bg-gray-50 p-5 rounded-3xl border border-gray-200 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>Rekening Bank Default untuk Pencairan Dana</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Rekening ini otomatis terpilih saat Anda mengajukan penarikan saldo QRIS, namun Anda tetap fleksibel mengubah rekening saat withdraw.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Tujuan</label>
                <select
                  value={defaultBankCode}
                  onChange={(e) => {
                    const sel = POPULAR_BANKS.find((b) => b.code === e.target.value);
                    setDefaultBankCode(e.target.value);
                    if (sel) setDefaultBankName(sel.name);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  placeholder="Contoh: 8831234567"
                  value={defaultAccountNumber}
                  onChange={(e) => setDefaultAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  placeholder="Sesuai buku tabungan"
                  value={defaultAccountName}
                  onChange={(e) => setDefaultAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Pajak Resto & Biaya Layanan */}
          <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200/80 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Pajak Resto & Biaya Layanan (Service Charge)</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Atur persentase pajak restoran (PB1) dan biaya layanan operasional yang dikenakan pada pesanan pelanggan dan kasir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Pajak Card */}
              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Pajak Resto (PB1)</span>
                    <span className="text-[10px] text-gray-400">Pajak pembangunan / daerah</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaxEnabled}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setIsTaxEnabled(next);
                        if (next && taxRate === 0) setTaxRate(10);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      disabled={!isTaxEnabled}
                      value={isTaxEnabled ? taxRate : 0}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">%</span>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-snug">
                    {isTaxEnabled && taxRate > 0
                      ? `Pajak ${taxRate}% akan otomatis ditambahkan ke subtotal pesanan.`
                      : 'Pajak dinonaktifkan (harga menu nett / tanpa pajak tambahan).'}
                  </p>
                </div>
              </div>

              {/* Service Charge Card */}
              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Biaya Layanan (Service Charge)</span>
                    <span className="text-[10px] text-gray-400">Biaya operasional & layanan</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isServiceEnabled}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setIsServiceEnabled(next);
                        if (next && serviceCharge === 0) setServiceCharge(5);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      disabled={!isServiceEnabled}
                      value={isServiceEnabled ? serviceCharge : 0}
                      onChange={(e) => setServiceCharge(Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">%</span>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-snug">
                    {isServiceEnabled && serviceCharge > 0
                      ? `Biaya layanan ${serviceCharge}% akan ditambahkan ke pesanan.`
                      : 'Biaya layanan dinonaktifkan (0%).'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Pesan Footer Struk Thermal Kasir
            </label>
            <textarea
              rows={2}
              placeholder="Terima kasih atas kunjungan Anda! Follow Instagram @namakafe"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Teks ini dicetak di bagian paling bawah struk kasir dan invoice digital pelanggan.
            </span>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`py-2.5 px-6 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-2 shadow-md cursor-pointer ${
                isJustSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-400/30 scale-105'
                  : 'bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isJustSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Kafe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* 4. MODAL PENARIKAN DANA (WITHDRAWAL MODAL) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Penarikan Saldo QRIS</h3>
                  <p className="text-xs text-emerald-200">Disbursement instan via BorderPay Payout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleRequestWithdrawal} className="p-6 space-y-4 overflow-y-auto flex-1">
              {withdrawError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              {/* Saldo Saat Ini Box */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Saldo QRIS Tersedia
                  </span>
                  <span className="text-xl font-black text-emerald-950">
                    {formatRupiah(currentQrisBalance)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(0.5)}
                    className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(1)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Tarik Semua
                  </button>
                </div>
              </div>

              {/* Input Nominal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nominal Penarikan (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-gray-400">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 500.000"
                    value={withdrawAmount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setWithdrawAmount(clean ? new Intl.NumberFormat('id-ID').format(parseInt(clean, 10)) : '');
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Rincian Potongan Fee */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Jumlah Penarikan</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(withdrawNum)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <span>Biaya Admin Payout</span>
                    <span className="text-[10px] text-gray-400">(BorderPay)</span>
                  </span>
                  <span className="font-semibold text-red-600">-{formatRupiah(currentPayoutFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between font-black text-sm text-emerald-950">
                  <span>Dana Bersih Diterima</span>
                  <span className="text-emerald-700 font-extrabold">{formatRupiah(withdrawNetEstimate)}</span>
                </div>
              </div>

              {/* Form Rekening Bank Fleksibel */}
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Rekening Bank Penerima</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Bank Tujuan</label>
                  <select
                    value={withdrawBankCode}
                    onChange={(e) => {
                      const sel = POPULAR_BANKS.find((b) => b.code === e.target.value);
                      setWithdrawBankCode(e.target.value);
                      if (sel) setWithdrawBankName(sel.name);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Nomor Rekening <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 1234567890"
                      value={withdrawAccountNumber}
                      onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Nama Pemilik Rekening <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Sesuai buku tabungan"
                      value={withdrawAccountHolderName}
                      onChange={(e) => setWithdrawAccountHolderName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Penarikan operasional minggu ke-2"
                    value={withdrawNotes}
                    onChange={(e) => setWithdrawNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={withdrawSaveAsDefault}
                    onChange={(e) => setWithdrawSaveAsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Simpan rekening ini sebagai rekening default kafe</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdrawal || withdrawNum <= currentPayoutFee}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                >
                  {submittingWithdrawal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan Payout...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Kirim Pengajuan Payout</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL UPGRADE SAAS (BORDERPAY SAAS GATEWAY) */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {embeddedQrisData ? 'QRIS Pembayaran Paket SaaS' : 'Perpanjang / Upgrade Paket SaaS'}
                  </h3>
                  <p className="text-xs text-amber-200">
                    {embeddedQrisData
                      ? 'Scan QRIS di bawah menggunakan m-Banking atau E-Wallet'
                      : 'Pembayaran instan & otomatis via BorderPay Gateway'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {embeddedQrisData && (
                  <button
                    type="button"
                    onClick={() => setEmbeddedQrisData(null)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-xl transition cursor-pointer"
                  >
                    ← Ganti Paket
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsRenewalModalOpen(false);
                    setEmbeddedQrisData(null);
                  }}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {embeddedQrisData ? (
              /* IN-APP DIRECT QRIS CHECKOUT (TIDAK PAKAI IFRAME AGAR TIDAK DIBLOKIR BROWSER) */
              <div className="p-6 flex flex-col items-center text-center space-y-4 overflow-y-auto">
                {isSaaSSuccess ? (
                  <div className="py-8 flex flex-col items-center space-y-3 animate-in zoom-in-90 duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-stone-900">Pembayaran Berhasil! 🎉</h3>
                      <p className="text-xs text-stone-500 max-w-xs">
                        Paket langganan {embeddedQrisData.planName} telah aktif untuk kafe Anda.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Ringkasan Biaya */}
                    <div className="w-full bg-stone-50 rounded-2xl p-3 border border-stone-100 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-xs text-stone-500 font-medium block">Total Tagihan:</span>
                        <span className="text-[11px] font-bold text-stone-700">
                          Paket {embeddedQrisData.planName} ({billingCycle === 'yearly' ? '12 Bulan' : '1 Bulan'})
                        </span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                        {formatRupiah(embeddedQrisData.grossAmount || 0)}
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="relative p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center">
                      <div className="w-full pb-2 mb-1 border-b border-stone-100 flex items-center justify-between px-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black tracking-widest text-red-600 font-mono">QRIS</span>
                          <span className="text-[9px] text-stone-400 font-bold">Nasional</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span className="font-mono font-bold text-amber-700">Siap Scan</span>
                        </div>
                      </div>

                      {/* Render QRIS SVG */}
                      <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG
                          value={embeddedQrisData.qrString || embeddedQrisData.paymentUrl || ''}
                          size={200}
                          level="M"
                          includeMargin={false}
                        />
                      </div>

                      <div className="w-full pt-2 mt-1 border-t border-stone-100 text-[10px] text-stone-400 font-medium flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mendukung Semua Bank & E-Wallet</span>
                      </div>
                    </div>

                    {/* Status Indikator Menunggu Pembayaran */}
                    <div className="w-full py-2 px-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-[11px] font-bold">Menunggu pembayaran Anda...</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => checkSaaSStatus(true)}
                        disabled={isCheckingSaaS}
                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer underline underline-offset-2"
                        title="Cek Status Pembayaran"
                      >
                        <RotateCw className={`w-3 h-3 ${isCheckingSaaS ? 'animate-spin' : ''}`} />
                        <span>{isCheckingSaaS ? 'Mengecek...' : 'Cek Status'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-stone-500 leading-relaxed text-left bg-stone-50 p-2.5 rounded-xl border border-stone-100 w-full">
                      <strong>Cara Bayar:</strong> Buka aplikasi perbankan (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, ShopeePay, DANA), lalu pilih menu <strong>Scan QRIS</strong> dan arahkan kamera ke kode di atas.
                    </p>

                    {/* Fallback Action Buttons */}
                    <div className="w-full flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                      <span className="text-[11px] text-stone-400 font-mono">
                        {embeddedQrisData.orderId}
                      </span>
                      {embeddedQrisData.paymentUrl && (
                        <a
                          href={embeddedQrisData.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[11px]"
                        >
                          <span>Buka Layar Penuh</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* PLAN SELECTION CONTENT */
              <>
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {renewalError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{renewalError}</span>
                    </div>
                  )}

                  {/* Billing Cycle Toggle */}
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-100 p-1 rounded-2xl flex items-center space-x-1 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          billingCycle === 'monthly'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Bulanan (1 Bulan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          billingCycle === 'yearly'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span>Tahunan (12 Bulan)</span>
                        <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                          Hemat 2 Bulan
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Plan Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Starter Plan */}
                    <div
                      onClick={() => setSelectedPlan('starter')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        selectedPlan === 'starter'
                          ? 'border-amber-600 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-gray-900 text-sm">Starter</h4>
                        <p className="text-[11px] text-gray-500">Kedai kopi & kafe rintisan</p>
                        <div className="text-base font-black text-amber-800">
                          {billingCycle === 'monthly' ? 'Rp 99.000' : 'Rp 990.000'}
                          <span className="text-[10px] font-normal text-gray-500">
                            {billingCycle === 'monthly' ? '/bln' : '/thn'}
                          </span>
                        </div>
                        <ul className="text-[11px] text-gray-600 space-y-1.5 pt-2 border-t border-gray-100">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>50 Menu Produk</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>3 Meja Kafe</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>2 Akun Staf / Kasir</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Pro Plan */}
                    <div
                      onClick={() => setSelectedPlan('pro')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        selectedPlan === 'pro'
                          ? 'border-amber-600 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="absolute -top-2.5 right-3 bg-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                        POPULER
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-gray-900 text-sm">Pro</h4>
                        <p className="text-[11px] text-gray-500">Kafe ramai & berkembang</p>
                        <div className="text-base font-black text-amber-800">
                          {billingCycle === 'monthly' ? 'Rp 199.000' : 'Rp 1.990.000'}
                          <span className="text-[10px] font-normal text-gray-500">
                            {billingCycle === 'monthly' ? '/bln' : '/thn'}
                          </span>
                        </div>
                        <ul className="text-[11px] text-gray-600 space-y-1.5 pt-2 border-t border-gray-100">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>200 Menu Produk</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>20 Meja Kafe</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>10 Akun Staf / Kasir</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div
                      onClick={() => setSelectedPlan('enterprise')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        selectedPlan === 'enterprise'
                          ? 'border-amber-600 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-gray-900 text-sm">Enterprise</h4>
                        <p className="text-[11px] text-gray-500">Kafe besar & multi-outlet</p>
                        <div className="text-base font-black text-amber-800">
                          {billingCycle === 'monthly' ? 'Rp 399.000' : 'Rp 3.990.000'}
                          <span className="text-[10px] font-normal text-gray-500">
                            {billingCycle === 'monthly' ? '/bln' : '/thn'}
                          </span>
                        </div>
                        <ul className="text-[11px] text-gray-600 space-y-1.5 pt-2 border-t border-gray-100">
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Unlimited Menu Produk</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Unlimited Meja Kafe</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Unlimited Akun Staf</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* BorderPay Info Badge */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-bold text-gray-800">Pembayaran BorderPay Otomatis</span>
                        <p className="text-[11px] text-gray-500">
                          Mendukung QRIS, Virtual Account Bank, dan e-Wallet dengan konfirmasi instan.
                        </p>
                      </div>
                    </div>
                    <div className="font-extrabold text-sm text-gray-900 shrink-0">
                      Total:{' '}
                      {selectedPlan === 'starter'
                        ? billingCycle === 'monthly'
                          ? 'Rp 99.000'
                          : 'Rp 990.000'
                        : selectedPlan === 'pro'
                        ? billingCycle === 'monthly'
                          ? 'Rp 199.000'
                          : 'Rp 1.990.000'
                        : billingCycle === 'monthly'
                        ? 'Rp 399.000'
                        : 'Rp 3.990.000'}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsRenewalModalOpen(false)}
                    className="px-4 py-2.5 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckoutSubscription}
                    disabled={submittingSubscription}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
                  >
                    {submittingSubscription ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mempersiapkan...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Lanjutkan ke Pembayaran BorderPay</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Animated Success Toast */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3.5 bg-gray-950/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Perubahan Berhasil Disimpan</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            </p>
            <p className="text-[11px] text-gray-300">Pengaturan profil dan identitas kafe telah diperbarui.</p>
          </div>
        </div>
      )}
    </ModernStaffLayout>
  );
}
