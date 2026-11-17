/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import ModernStaffSidebar from '@/components/layout/ModernStaffSidebar';
import PopularProductsWidget from '@/components/pos/PopularProductsWidget';
import NewOrderModal from '@/components/pos/NewOrderModal';
import WaiterCallsModal from '@/components/pos/WaiterCallsModal';
import WaiterCallToast from '@/components/pos/WaiterCallToast';
import PosHeader from '@/components/pos/PosHeader';
import PrinterSettingsModal from '@/components/pos/PrinterSettingsModal';
import PrinterManager from '@/lib/printer/printer-manager';
import { api } from '@/lib/api';
import { Order, OrderStatus, Shift, Product, Discount } from '@/types';
import { formatRupiah, formatTime, formatDateTime, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  RotateCw,
  Plus,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  ConciergeBell,
  CheckCheck,
  XCircle,
  Eye,
  X,
  Search,
  AlertCircle,
  Loader2,
  Printer,
  Coins,
  Banknote,
  AlertTriangle,
  Volume2,
  VolumeX,
  Bell,
  TrendingUp,
  User as UserIcon,
  BarChart3,
  ChevronDown,
  ArrowUpRight,
  Layers,
  Sparkles,
  Calendar,
  Filter,
  Kanban as KanbanIcon,
  List as ListIcon,
  MoreVertical,
  Menu as MenuIcon,
  MapPin,
  Coffee,
  Check,
  Utensils,
  ChevronRight,
  ShoppingBag,
  Maximize2,
  Minimize2,
  QrCode,
  CreditCard,
  Building2,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { playNotificationSound, isAudioMuted, setAudioMuted, testAudioNotification } from '@/lib/audio';

// Helper to format raw numbers into Indonesian thousand format (e.g. 100000 -> "100.000")
const formatNumberWithDots = (val: number | string): string => {
  if (val === '' || val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

// Helper to parse thousand formatted string into plain number (e.g. "100.000" -> 100000)
const parseNumberFromDots = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};

// UI-UX Pro Max: Helper to compute elapsed duration and status color for F&B orders
const getOrderElapsedInfo = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) {
    return { text: '< 1 mnt', mins, colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (mins < 60) {
    const colorClass =
      mins < 10
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : mins <= 20
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-rose-700 bg-rose-50 border-rose-300 font-black animate-pulse';
    return { text: `${mins} mnt`, mins, colorClass };
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return {
    text: `${hours}j ${remMins}m`,
    mins,
    colorClass: 'text-rose-700 bg-rose-50 border-rose-300 font-black',
  };
};

export default function PosPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  // Orders and Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'58mm' | '80mm'>('58mm');

  // Multi-tier tenant branding resolution (Profile -> User Company -> Order Outlet Company)
  const activeTenantBrand = useMemo(() => {
    const brand = tenantProfile || (user as any)?.company || (receiptOrder as any)?.outlet?.company;
    const name = brand?.name || brand?.businessName || (receiptOrder as any)?.outlet?.name || 'Cafe POS';
    const logoRaw = brand?.logoUrl || brand?.logo || (user as any)?.company?.logoUrl || (user as any)?.company?.logo || (receiptOrder as any)?.outlet?.company?.logoUrl || (receiptOrder as any)?.outlet?.company?.logo;
    const logo = logoRaw ? getImageUrl(logoRaw) : null;
    const tagline = brand?.tagline || (user as any)?.company?.tagline || null;
    const address = brand?.address || (user as any)?.company?.address || (receiptOrder as any)?.outlet?.address || null;
    const phone = brand?.phone || (user as any)?.company?.phone || (receiptOrder as any)?.outlet?.phone || null;
    const receiptFooter = brand?.receiptFooter || (user as any)?.company?.receiptFooter || 'Terima Kasih Atas Kunjungan Anda!';

    return {
      name,
      logo,
      tagline,
      address,
      phone,
      receiptFooter,
    };
  }, [tenantProfile, user, receiptOrder]);

  // Layout & Responsive States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DRIVE_THRU'>('ALL');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string>('ALL');

  // Shortcut key ⌘ K / Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [quickStatusMenuOrderId, setQuickStatusMenuOrderId] = useState<string | null>(null);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  // UI-UX Pro Max (Fase 2): Fast Cashier Checkout States for selectedOrder
  const [fastPayMethod, setFastPayMethod] = useState<'CASH' | 'QRIS' | 'DEBIT_CARD' | 'BANK_TRANSFER'>('CASH');
  const [fastPayCashReceived, setFastPayCashReceived] = useState<string>('');
  const [fastPayAutoPrint, setFastPayAutoPrint] = useState<boolean>(true);
  const [fastPayProcessing, setFastPayProcessing] = useState<boolean>(false);
  const [fastPayBorderPayChecking, setFastPayBorderPayChecking] = useState<boolean>(false);

  // Reset fast pay inputs when selected order changes
  useEffect(() => {
    if (selectedOrder) {
      setFastPayCashReceived('');
      setFastPayMethod('CASH');
    }
  }, [selectedOrder?.id]);

  // Screen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Audio, Waiter Calls & Hardware
  const [audioMuted, setAudioMutedState] = useState(false);
  const [waiterCalls, setWaiterCalls] = useState<any[]>([]);
  const [isWaiterCallsModalOpen, setIsWaiterCallsModalOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const prevWaiterCallIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Shift States
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [shiftChecking, setShiftChecking] = useState(true);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [openShiftName, setOpenShiftName] = useState('Shift Pagi');
  const [openInitialCash, setOpenInitialCash] = useState<string>('100.000');
  const [closeActualCash, setCloseActualCash] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState('');
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [shiftError, setShiftError] = useState('');
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [assignedShiftInfo, setAssignedShiftInfo] = useState<{ name?: string; startTime?: string; endTime?: string } | null>(null);
  const [isShiftReceiptModalOpen, setIsShiftReceiptModalOpen] = useState(false);
  const [shiftReceiptData, setShiftReceiptData] = useState<any | null>(null);
  const [shiftReceiptPaperWidth, setShiftReceiptPaperWidth] = useState<'58mm' | '80mm'>('58mm');

  // Auto-collapse sidebar on tablet screens (< 1280px) on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    setAudioMutedState(isAudioMuted());
  }, []);

  const toggleMute = () => {
    const next = !audioMuted;
    setAudioMutedState(next);
    setAudioMuted(next);
    if (!next) {
      testAudioNotification('order');
    }
  };

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get<Order[]>('/orders');
      if (res && Array.isArray(res)) {
        if (!isInitialLoadRef.current) {
          const newOrders = res.filter((o) => !prevOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            playNotificationSound('order');
          }
        } else {
          isInitialLoadRef.current = false;
        }

        prevOrderIdsRef.current = new Set(res.map((o) => o.id));
        setOrders(res);

        // Auto-sync any pending online orders with BorderPay to guarantee instant status update in POS
        const pendingOnline = res.filter(
          (o) => o.status === 'PENDING_PAYMENT' && o.payments?.some((p: any) => p.provider === 'borderpay' || p.method === 'BORDERPAY' || p.method === 'QRIS')
        );
        if (pendingOnline.length > 0) {
          Promise.allSettled(
            pendingOnline.map((o) => api.get<any>(`/payments/${o.id}/borderpay-sync`))
          ).then((results) => {
            const anyPaid = results.some(
              (r) => r.status === 'fulfilled' && (r.value?.synced || r.value?.status === 'PAID')
            );
            if (anyPaid) {
              api.get<Order[]>('/orders').then((updated) => {
                if (Array.isArray(updated)) {
                  setOrders(updated);
                  playNotificationSound('bell');
                }
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // Active Discounts State
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);

  const fetchProductsAndTables = async () => {
    try {
      const outletParam = user?.outletId ? `&outletId=${user.outletId}` : '';
      const discountParam = user?.outletId ? `?outletId=${user.outletId}` : '';
      const [prodRes, tableRes, discountRes] = await Promise.all([
        api.get<Product[]>(`/products?includeInactive=false${outletParam}`),
        api.get<any[]>('/tables'),
        api.get<Discount[]>(`/discounts/active${discountParam}`).catch(() => []),
      ]);
      if (prodRes && Array.isArray(prodRes)) setProducts(prodRes);
      if (tableRes && Array.isArray(tableRes)) setTables(tableRes);
      if (discountRes && Array.isArray(discountRes)) setActiveDiscounts(discountRes);
    } catch (e) {
      // silent
    }
  };

  const fetchWaiterCalls = async () => {
    try {
      const calls = await api.get<any[]>('/tables/waiter-calls');
      if (Array.isArray(calls)) {
        const newCalls = calls.filter((c) => !prevWaiterCallIdsRef.current.has(c.id));
        if (newCalls.length > 0 && !isInitialLoadRef.current) {
          playNotificationSound('bell');
        }
        prevWaiterCallIdsRef.current = new Set(calls.map((c) => c.id));
        setWaiterCalls(calls);
      }
    } catch (e) {
      // silent
    }
  };

  const handleResolveWaiterCall = async (callId: string) => {
    try {
      await api.put(`/tables/waiter-calls/${callId}/resolve`);
      setWaiterCalls((prev) => prev.filter((c) => c.id !== callId));
    } catch (e) {
      // ignore
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const res = await api.get<Shift>('/shifts/current');
      if (res && res.id) {
        setCurrentShift(res);
      } else {
        setCurrentShift(null);
        // Prompt cashier to open shift if not opened
        setIsOpenShiftModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch current shift:', err);
      setCurrentShift(null);
    } finally {
      setShiftChecking(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProductsAndTables();
    fetchWaiterCalls();
    fetchCurrentShift();
    api.get<any>('/tenants/profile').then((res) => {
      if (res) setTenantProfile(res);
    }).catch(() => {});

    const interval = setInterval(() => {
      fetchOrders();
      fetchWaiterCalls();
      api.get<Shift>('/shifts/current').then((res) => {
        if (res && res.id) setCurrentShift(res);
      }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Ensure tenant profile is fetched once user state is loaded/hydrated
  useEffect(() => {
    if (user?.id || (user as any)?.companyId) {
      api.get<any>('/tenants/profile').then((res) => {
        if (res) setTenantProfile(res);
      }).catch(() => {});
    }
  }, [user]);

  // Detect user's assigned work shift from registry
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const saved = localStorage.getItem(`cafe_user_shift_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) {
            setAssignedShiftInfo(parsed);
            return;
          }
        }
      } catch (e) {}
    }
    setAssignedShiftInfo(null);
  }, [user]);

  // When opening shift modal, auto-populate shift name
  useEffect(() => {
    if (isOpenShiftModalOpen) {
      if (assignedShiftInfo) {
        setOpenShiftName(`${assignedShiftInfo.name} (${assignedShiftInfo.startTime || '08:00'} - ${assignedShiftInfo.endTime || '16:00'})`);
      } else {
        const hr = new Date().getHours();
        if (hr >= 6 && hr < 14) {
          setOpenShiftName('Shift Pagi (07:00 - 15:00)');
        } else if (hr >= 14 && hr < 22) {
          setOpenShiftName('Shift Sore (15:00 - 23:00)');
        } else {
          setOpenShiftName('Shift Malam (23:00 - 07:00)');
        }
      }
    }
  }, [isOpenShiftModalOpen, assignedShiftInfo]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftSubmitting(true);
    setShiftError('');
    try {
      const initialNum = parseNumberFromDots(openInitialCash);
      const res = await api.post<Shift>('/shifts/open', {
        shiftName: openShiftName.trim() || 'Shift Pagi',
        initialCash: initialNum,
      });
      setCurrentShift(res);
      setIsOpenShiftModalOpen(false);
    } catch (err: any) {
      setShiftError(err?.message || 'Gagal membuka shift kasir');
    } finally {
      setShiftSubmitting(false);
    }
  };

  const handleOpenCloseShiftModal = async () => {
    if (!currentShift) return;
    setShiftError('');
    setCloseActualCash('');
    setCloseNotes('');
    try {
      const summary = await api.get(`/shifts/${currentShift.id}/summary`);
      setShiftSummary(summary);
      setIsCloseShiftModalOpen(true);
    } catch (err: any) {
      alert(err?.message || 'Gagal memuat ringkasan shift');
    }
  };

  const handleOpenShiftReceiptModal = () => {
    const sumData = shiftSummary?.summary || shiftSummary?.shift || shiftSummary;
    const actualCashNum = parseNumberFromDots(closeActualCash);
    setShiftReceiptData({
      shift: currentShift,
      summary: sumData,
      actualCash: closeActualCash.trim() !== '' ? actualCashNum : null,
      notes: closeNotes.trim() || undefined,
    });
    setIsShiftReceiptModalOpen(true);
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    const actualNum = parseNumberFromDots(closeActualCash);
    if (closeActualCash.trim() === '' || isNaN(actualNum)) {
      setShiftError('Harap masukkan nominal uang fisik di laci kasir');
      return;
    }

    setShiftSubmitting(true);
    setShiftError('');
    try {
      await api.post(`/shifts/${currentShift.id}/close`, {
        actualCash: actualNum,
        notes: closeNotes.trim() || undefined,
      });
      setIsCloseShiftModalOpen(false);
      setCurrentShift(null);
      alert('Shift kasir berhasil ditutup dan direkonsiliasi. Terima kasih!');
    } catch (err: any) {
      setShiftError(err?.message || 'Gagal menutup shift');
    } finally {
      setShiftSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentShift && ['CASHIER', 'ADMIN', 'OWNER'].includes(user?.role || '')) {
      alert('Perhatian: Anda belum membuka shift kasir. Silakan buka shift terlebih dahulu untuk mencatat transaksi kasir.');
      setIsOpenShiftModalOpen(true);
      return;
    }

    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      fetchProductsAndTables();
      setQuickStatusMenuOrderId(null);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      if (currentShift) {
        api.get<Shift>('/shifts/current').then((res) => {
          if (res && res.id) setCurrentShift(res);
        }).catch(() => {});
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status pesanan');
    }
  };

  // UI-UX Pro Max (Fase 2): Handler konfirmasi pembayaran kasir cepat & auto print
  const handleFastPayConfirm = async () => {
    if (!selectedOrder) return;
    setFastPayProcessing(true);
    try {
      await handleUpdateStatus(selectedOrder.id, 'PAID');

      // Auto print Bluetooth thermal jika dicentang
      if (fastPayAutoPrint) {
        try {
          const res = await PrinterManager.printOrderReceipt(selectedOrder, {
            paperWidth: receiptPaperWidth,
          });
          if (!res.success) {
            // Fallback: buka modal preview struk
            setReceiptOrder(selectedOrder);
          }
        } catch {
          setReceiptOrder(selectedOrder);
        }
      }

      setSelectedOrder(null);
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses pembayaran kasir');
    } finally {
      setFastPayProcessing(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Masukkan alasan pembatalan order:');
    if (!reason) return;

    try {
      await api.post(`/orders/${orderId}/cancel`, { reason });
      fetchOrders();
      setQuickStatusMenuOrderId(null);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan order');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // Filter orders by search & order type
  const filteredOrders = orders.filter((o) => {
    // 1. Search Query
    const matchQuery =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.table?.tableNumber && o.table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Order Type Filter
    let matchType = true;
    if (orderTypeFilter === 'DINE_IN') {
      matchType = !!o.tableId || !!o.table?.tableNumber;
    } else if (orderTypeFilter === 'TAKEAWAY') {
      matchType = !o.tableId && !o.table?.tableNumber;
    }

    return matchQuery && matchType;
  });

  // KPI Metrics Calculation (UI-UX Pro Max)
  const newOrdersCount = orders.filter((o) => o.status === 'PENDING_PAYMENT' || o.status === 'DRAFT').length;
  const totalOrdersCount = orders.length;
  const waitingCount = orders.filter((o) => ['CONFIRMED', 'PAID', 'PREPARING'].includes(o.status)).length;
  const readyCount = orders.filter((o) => ['READY', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const completedCount = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
  const todayRevenue = orders
    .filter((o) => !['CANCELLED', 'DRAFT', 'PENDING_PAYMENT'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  // 5 Kanban Columns matching Mockup
  const columns = [
    {
      title: 'Menunggu Pembayaran',
      statuses: ['PENDING_PAYMENT', 'DRAFT'] as OrderStatus[],
      dotColor: 'bg-orange-500',
      headerBg: 'bg-orange-50/70',
      badgeBg: 'bg-orange-100 text-orange-800',
      borderColor: 'border-orange-200/80',
    },
    {
      title: 'Diproses',
      statuses: ['CONFIRMED', 'PAID'] as OrderStatus[],
      dotColor: 'bg-blue-500',
      headerBg: 'bg-blue-50/70',
      badgeBg: 'bg-blue-100 text-blue-800',
      borderColor: 'border-blue-200/80',
    },
    {
      title: 'Dimasak (Kitchen)',
      statuses: ['PREPARING'] as OrderStatus[],
      dotColor: 'bg-amber-500',
      headerBg: 'bg-amber-50/70',
      badgeBg: 'bg-amber-100 text-amber-800',
      borderColor: 'border-amber-200/80',
    },
    {
      title: 'Siap Antar',
      statuses: ['READY', 'OUT_FOR_DELIVERY'] as OrderStatus[],
      dotColor: 'bg-purple-500',
      headerBg: 'bg-purple-50/70',
      badgeBg: 'bg-purple-100 text-purple-800',
      borderColor: 'border-purple-200/80',
    },
    {
      title: 'Selesai',
      statuses: ['DELIVERED', 'COMPLETED'] as OrderStatus[],
      dotColor: 'bg-emerald-500',
      headerBg: 'bg-emerald-50/70',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      borderColor: 'border-emerald-200/80',
    },
  ];

  return (
    <div className={`min-h-screen bg-[#F8F9FB] flex overflow-hidden ${receiptOrder || isShiftReceiptModalOpen ? 'print:hidden' : ''}`}>
      {/* 1. Modern Sidebar with Tablet Collapse Support */}
      <ModernStaffSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar Header matching Flutter Native POS */}
        <PosHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          user={user}
          onLogout={logout}
          currentShift={currentShift}
          onOpenCloseShiftModal={handleOpenCloseShiftModal}
          onOpenNewShiftModal={() => setIsOpenShiftModalOpen(true)}
          audioMuted={audioMuted}
          onToggleMute={toggleMute}
          refreshing={refreshing}
          onRefresh={() => fetchOrders(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          waiterCallsCount={waiterCalls.length}
          onOpenWaiterCallsModal={() => setIsWaiterCallsModalOpen(true)}
          onOpenPrinterSettings={() => setIsPrinterSettingsOpen(true)}
          rightDrawerOpen={rightDrawerOpen}
          onToggleRightDrawer={() => setRightDrawerOpen((prev) => !prev)}
        />

        {/* Waiter Calls Alert Toast Banner */}
        <WaiterCallToast
          calls={waiterCalls}
          onOpenModal={() => setIsWaiterCallsModalOpen(true)}
          onResolve={handleResolveWaiterCall}
        />

        {/* Workspace Body: Kanban + Right Widget Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Main Scrollable Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-3 sm:p-4 space-y-3">
            {/* 1. Interactive Pro Max KPI Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 shrink-0">
              {/* Card 1: Pesanan Baru */}
              <button
                type="button"
                onClick={() =>
                  setSelectedColumnFilter((prev) =>
                    prev === 'Menunggu Pembayaran' ? 'ALL' : 'Menunggu Pembayaran'
                  )
                }
                className={`bg-white p-3 rounded-2xl border text-left shadow-2xs flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all duration-150 ${
                  selectedColumnFilter === 'Menunggu Pembayaran'
                    ? 'border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/20'
                    : 'border-stone-200/80 hover:border-orange-300'
                }`}
                title="Klik untuk memfilter kolom Menunggu Pembayaran"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {newOrdersCount > 0 && <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />}
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block truncate">
                      Pesanan Baru
                    </span>
                  </div>
                  <span className="text-xl font-black text-stone-900 leading-tight tabular-nums font-mono">
                    {newOrdersCount}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <Utensils className="w-4 h-4" />
                </div>
              </button>

              {/* Card 2: Sedang Dimasak */}
              <button
                type="button"
                onClick={() =>
                  setSelectedColumnFilter((prev) =>
                    prev === 'Dimasak (Kitchen)' ? 'ALL' : 'Dimasak (Kitchen)'
                  )
                }
                className={`bg-white p-3 rounded-2xl border text-left shadow-2xs flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all duration-150 ${
                  selectedColumnFilter === 'Dimasak (Kitchen)'
                    ? 'border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/20'
                    : 'border-stone-200/80 hover:border-amber-300'
                }`}
                title="Klik untuk memfilter pesanan yang sedang dimasak di dapur"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block truncate">
                    Dimasak
                  </span>
                  <span className="text-xl font-black text-stone-900 leading-tight tabular-nums font-mono">
                    {orders.filter((o) => o.status === 'PREPARING').length}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
              </button>

              {/* Card 3: Siap Antar */}
              <button
                type="button"
                onClick={() =>
                  setSelectedColumnFilter((prev) =>
                    prev === 'Siap Antar' ? 'ALL' : 'Siap Antar'
                  )
                }
                className={`bg-white p-3 rounded-2xl border text-left shadow-2xs flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all duration-150 ${
                  selectedColumnFilter === 'Siap Antar'
                    ? 'border-purple-500 ring-2 ring-purple-500/10 bg-purple-50/20'
                    : 'border-stone-200/80 hover:border-purple-300'
                }`}
                title="Klik untuk memfilter pesanan yang siap diantar meja"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block truncate">
                    Siap Antar
                  </span>
                  <span className="text-xl font-black text-stone-900 leading-tight tabular-nums font-mono">
                    {readyCount}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <ConciergeBell className="w-4 h-4" />
                </div>
              </button>

              {/* Card 4: Selesai */}
              <button
                type="button"
                onClick={() =>
                  setSelectedColumnFilter((prev) =>
                    prev === 'Selesai' ? 'ALL' : 'Selesai'
                  )
                }
                className={`bg-white p-3 rounded-2xl border text-left shadow-2xs flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition-all duration-150 ${
                  selectedColumnFilter === 'Selesai'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/20'
                    : 'border-stone-200/80 hover:border-emerald-300'
                }`}
                title="Klik untuk memfilter pesanan selesai"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block truncate">
                    Selesai
                  </span>
                  <span className="text-xl font-black text-stone-900 leading-tight tabular-nums font-mono">
                    {completedCount}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </button>

              {/* Card 5: Omset Hari Ini (Desktop / Tablet) */}
              <div className="hidden lg:flex bg-gradient-to-tr from-stone-900 to-stone-800 p-3 rounded-2xl border border-stone-800 text-white shadow-2xs items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider block truncate">
                      Omset Hari Ini
                    </span>
                  </div>
                  <span className="text-base font-black text-white leading-tight tabular-nums font-mono truncate block">
                    {formatRupiah(todayRevenue)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0 border border-white/10">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2. Two-Tier Clean Architecture Toolbar */}
            <div className="flex flex-col gap-2.5 shrink-0">
              {/* Top Tier: Filters, Views, and Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-stone-200/80 shadow-2xs">
                {/* Left: Segmented Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 bg-stone-100/80 rounded-xl">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'DINE_IN', label: 'Dine In' },
                    { id: 'TAKEAWAY', label: 'Take Away' },
                    { id: 'DRIVE_THRU', label: 'Drive Thru' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderTypeFilter(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                        orderTypeFilter === tab.id
                          ? 'bg-white text-orange-600 shadow-sm border border-stone-200/50'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Right: Date, View Toggle & Action */}
                <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
                  {/* Date Dropdown */}
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 cursor-pointer transition">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Hari Ini</span>
                  </div>

                  {/* View Switcher: Kanban vs List */}
                  <div className="flex items-center p-0.5 rounded-xl bg-stone-100/80 border border-stone-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode('KANBAN')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                        viewMode === 'KANBAN'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <KanbanIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('LIST')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                        viewMode === 'LIST'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">List</span>
                    </button>
                  </div>

                  {/* Primary Quick "Pesanan Baru" Button */}
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-stone-900/10 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Pesanan Baru</span>
                  </button>
                </div>
              </div>

              {/* Bottom Tier: Full-Width Search Input */}
              <div className="relative w-full shadow-2xs rounded-2xl group">
                <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari pesanan, nama pelanggan, atau nomor meja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm pl-10 pr-16 py-3 bg-white hover:bg-stone-50/50 focus:bg-white border border-stone-200/80 focus:border-orange-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold text-stone-800 placeholder:text-stone-400 placeholder:font-medium shadow-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 text-xs font-bold transition-colors cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="hidden sm:flex items-center justify-center h-6 px-1.5 text-[10px] font-mono font-bold text-stone-400 bg-stone-50 rounded-md border border-stone-200 shadow-xs">
                    ⌘K
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile / Small Tablet Column Filter Tabs */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs font-bold">
              <button
                onClick={() => setSelectedColumnFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                  selectedColumnFilter === 'ALL'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Semua ({filteredOrders.length})
              </button>
              {columns.map((col) => {
                const count = filteredOrders.filter((o) => col.statuses.includes(o.status)).length;
                const isSelected = selectedColumnFilter === col.title;
                return (
                  <button
                    key={col.title}
                    onClick={() => setSelectedColumnFilter(col.title)}
                    className={`px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span>{col.title}</span>
                    <span className="text-[10px] px-1.5 rounded-full bg-white/30 text-current">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {viewMode === 'KANBAN' ? (
              /* 3. Kanban Columns Container */
              <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin">
                <div className="flex gap-4 w-max min-w-full h-full items-start px-1">
                  {columns
                    .filter((col) => selectedColumnFilter === 'ALL' || selectedColumnFilter === col.title)
                    .map((col) => {
                    const colOrders = filteredOrders.filter((o) => col.statuses.includes(o.status));

                    return (
                      <div
                        key={col.title}
                        className={`flex-1 rounded-3xl border ${col.borderColor} ${col.headerBg} p-3.5 flex flex-col min-w-[240px] max-w-[320px] shadow-2xs`}
                      >
                        {/* Column Header matching Mockup */}
                        <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200/60 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                            <span className="font-extrabold text-xs text-stone-900 tracking-tight">
                              {col.title}
                            </span>
                          </div>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                            {colOrders.length}
                          </span>
                        </div>

                        {/* Cards List (UI-UX Pro Max) */}
                        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 scrollbar-thin">
                          {colOrders.length === 0 ? (
                            <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-stone-200/90 bg-white/40 space-y-2">
                              <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                                <Coffee className="w-5 h-5" />
                              </div>
                              <div className="text-xs font-bold text-stone-600">Kolom Kosong</div>
                              <p className="text-[11px] text-stone-400">
                                Belum ada pesanan dengan status {col.title.toLowerCase()}.
                              </p>
                            </div>
                          ) : (
                            colOrders.map((order) => {
                              const elapsed = getOrderElapsedInfo(order.createdAt);
                              const isPaid = order.status !== 'PENDING_PAYMENT' && order.status !== 'DRAFT';
                              const paymentMethodName = order.payments?.[0]?.method || order.paymentMethod || '';
                              const isQris = paymentMethodName === 'QRIS' || paymentMethodName === 'BORDERPAY';
                              const isCash = paymentMethodName === 'CASH';

                              return (
                                <div
                                  key={order.id}
                                  onClick={() => setSelectedOrder(order)}
                                  className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md hover:border-orange-300 transition-all duration-150 space-y-2.5 relative group active:scale-[0.99] select-none cursor-pointer"
                                >
                                  {/* Row 1: High-Contrast Table Badge + Elapsed Timer + Actions */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {order.table?.tableNumber ? (
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-900 text-white shadow-xs shrink-0">
                                          <span className="text-orange-400 font-extrabold text-[10px]">MEJA</span>
                                          <span className="font-black text-xs tabular-nums">{order.table.tableNumber}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shadow-2xs shrink-0">
                                          <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                                          <span>TAKEAWAY</span>
                                        </div>
                                      )}

                                      <span className="font-mono text-xs font-bold text-stone-400 truncate">
                                        #{order.orderNumber}
                                      </span>
                                    </div>

                                    {/* Right: Elapsed Timer + 1-Tap Print + More Menu */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Elapsed Timer Pill */}
                                      <div
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${elapsed.colorClass}`}
                                        title={`Dipesan pada ${formatTime(order.createdAt)}`}
                                      >
                                        <Clock className="w-3 h-3" />
                                        <span>{elapsed.text}</span>
                                      </div>

                                      {/* 1-Tap Quick Print Receipt */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReceiptOrder(order);
                                        }}
                                        className="p-1 rounded-xl text-stone-400 hover:text-orange-600 hover:bg-orange-50 active:scale-90 transition cursor-pointer"
                                        title="Cetak Struk Thermal"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>

                                      {/* 3-Dots Menu */}
                                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setQuickStatusMenuOrderId(
                                              quickStatusMenuOrderId === order.id ? null : order.id
                                            );
                                          }}
                                          className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                                          title="Opsi Pesanan"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {quickStatusMenuOrderId === order.id && (
                                          <div className="absolute right-0 top-8 z-30 w-44 bg-white rounded-2xl shadow-xl border border-stone-200 p-1.5 text-xs font-bold text-stone-700 animate-in fade-in zoom-in-95">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedOrder(order);
                                                setQuickStatusMenuOrderId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition"
                                            >
                                              <Eye className="w-4 h-4 text-stone-500" />
                                              <span>Detail Pesanan</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setReceiptOrder(order);
                                                setQuickStatusMenuOrderId(null);
                                              }}
                                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 cursor-pointer transition"
                                            >
                                              <Printer className="w-4 h-4 text-stone-500" />
                                              <span>Cetak Struk</span>
                                            </button>
                                            <div className="my-1 border-t border-stone-100" />
                                            <button
                                              type="button"
                                              onClick={() => handleCancelOrder(order.id)}
                                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer transition"
                                            >
                                              <XCircle className="w-4 h-4" />
                                              <span>Batalkan Order</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Row 2: Customer Name & Items Count */}
                                  <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <UserIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                      <span className="font-bold text-stone-800 truncate text-[11px]">
                                        {order.customerName || 'Pelanggan'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-stone-400 font-bold shrink-0">
                                      {order.items.length} menu • {formatTime(order.createdAt)}
                                    </span>
                                  </div>

                                  {/* Row 3: Items List Preview with Special Notes */}
                                  <div className="py-2 border-t border-b border-stone-100 space-y-1.5 text-xs">
                                    {order.items.slice(0, 3).map((item) => (
                                      <div key={item.id} className="space-y-0.5">
                                        <div className="flex items-start justify-between gap-1.5 text-stone-700">
                                          <div className="flex items-start gap-1.5 min-w-0">
                                            <span className="font-black text-stone-900 bg-stone-100 px-1.5 py-0.2 rounded text-[10px] tabular-nums shrink-0">
                                              {item.quantity}x
                                            </span>
                                            <span className="font-semibold line-clamp-1 leading-snug text-[11px]">
                                              {item.productName}
                                            </span>
                                          </div>
                                          <span className="font-mono text-[10px] text-stone-400 tabular-nums shrink-0">
                                            {formatRupiah(item.totalPrice || Number(item.unitPrice) * item.quantity)}
                                          </span>
                                        </div>
                                        {item.notes && (
                                          <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium truncate">
                                            📝 {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {order.items.length > 3 && (
                                      <div className="text-[10px] font-bold text-stone-400 pt-0.5">
                                        + {order.items.length - 3} menu lainnya
                                      </div>
                                    )}
                                  </div>

                                  {/* Row 4: Total Price & Payment Badge */}
                                  <div className="flex items-end justify-between gap-2 pt-0.5">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-stone-400 tracking-wider uppercase">
                                        Total Tagihan
                                      </span>
                                      <span className="font-mono font-black text-sm text-stone-900 tracking-tight tabular-nums">
                                        {formatRupiah(order.totalAmount)}
                                      </span>
                                    </div>

                                    {/* Payment Status Pill */}
                                    <div>
                                      {isPaid ? (
                                        isQris ? (
                                          <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                            <QrCode className="w-3 h-3 text-blue-600" />
                                            <span>QRIS LUNAS</span>
                                          </span>
                                        ) : isCash ? (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                            <Banknote className="w-3 h-3 text-emerald-600" />
                                            <span>TUNAI LUNAS</span>
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>LUNAS</span>
                                          </span>
                                        )
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                          <span>BELUM BAYAR</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Row 5: Action Button (1-Tap Progression) */}
                                  <div className="pt-2 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                                    {order.status === 'PENDING_PAYMENT' && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedOrder(order)}
                                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                        title="Buka Kasir Cepat & Hitung Kembalian"
                                      >
                                        <Banknote className="w-4 h-4" />
                                        <span>Bayar & Kasir</span>
                                      </button>
                                    )}

                                    {['CONFIRMED', 'PAID'].includes(order.status) && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <UtensilsCrossed className="w-3.5 h-3.5" />
                                        <span>Mulai Masak (Dapur)</span>
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    )}

                                    {order.status === 'PREPARING' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <ConciergeBell className="w-3.5 h-3.5" />
                                        <span>Pesanan Siap Saji</span>
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    )}

                                    {['READY', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <CheckCheck className="w-4 h-4" />
                                        <span>Selesai Diantar Meja</span>
                                      </button>
                                    )}

                                    {order.status === 'DELIVERED' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Selesai & Kosongkan Meja</span>
                                      </button>
                                    )}

                                    {order.status === 'COMPLETED' && (
                                      <button
                                        type="button"
                                        onClick={() => setReceiptOrder(order)}
                                        className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <Printer className="w-4 h-4 text-orange-600" />
                                        <span>Cetak Struk Ulang</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* 4. List View Container (Tabel / Daftar Vertikal) */
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden mb-4">
              {/* List View Subheader */}
              <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between gap-3 shrink-0 bg-stone-50/50">
                <div className="flex items-center gap-2">
                  <ListIcon className="w-4 h-4 text-orange-600" />
                  <span className="font-extrabold text-xs text-stone-900">
                    Daftar Pesanan Kasir
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                    {(() => {
                      const listOrders = selectedColumnFilter === 'ALL'
                        ? filteredOrders
                        : filteredOrders.filter((o) => {
                            const col = columns.find((c) => c.title === selectedColumnFilter);
                            return col ? col.statuses.includes(o.status) : true;
                          });
                      return `${listOrders.length} Pesanan`;
                    })()}
                  </span>
                </div>

                {/* Status Filter Tabs (Desktop inside List View) */}
                <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedColumnFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      selectedColumnFilter === 'ALL'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Semua
                  </button>
                  {columns.map((col) => {
                    const count = filteredOrders.filter((o) => col.statuses.includes(o.status)).length;
                    return (
                      <button
                        key={col.title}
                        type="button"
                        onClick={() => setSelectedColumnFilter(col.title)}
                        className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                          selectedColumnFilter === col.title
                            ? 'bg-white text-stone-900 shadow-2xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                        <span>{col.title}</span>
                        <span className="text-[10px] text-stone-400">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List Table / Rows */}
              {(() => {
                const listOrders = selectedColumnFilter === 'ALL'
                  ? filteredOrders
                  : filteredOrders.filter((o) => {
                      const col = columns.find((c) => c.title === selectedColumnFilter);
                      return col ? col.statuses.includes(o.status) : true;
                    });

                if (listOrders.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-stone-400">
                      <ShoppingBag className="w-10 h-10 mb-2 stroke-[1.5] text-stone-300" />
                      <p className="text-xs font-bold text-stone-600">Tidak ada pesanan ditemukan</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {searchQuery ? `Tidak ada pesanan yang cocok dengan "${searchQuery}"` : 'Belum ada transaksi pada status ini'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="flex-1 overflow-auto scrollbar-thin divide-y divide-stone-100">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                      <thead className="bg-stone-50/70 sticky top-0 z-10 border-b border-stone-100 text-[10px] uppercase font-black text-stone-400 tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">No. Order & Waktu</th>
                          <th className="py-2.5 px-3">Meja / Tipe</th>
                          <th className="py-2.5 px-3">Pelanggan</th>
                          <th className="py-2.5 px-3">Rincian Menu</th>
                          <th className="py-2.5 px-3">Metode Bayar</th>
                          <th className="py-2.5 px-3">Total Tagihan</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs font-medium text-stone-700">
                        {listOrders.map((order) => {
                          const method = order.payments?.[0]?.method || (order as any).paymentMethod || 'CASH';
                          const items = order.items || [];
                          const itemsText = items.map((it: any) => `${it.quantity}x ${it.product?.name || it.name || 'Item'}`).join(', ');

                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="hover:bg-orange-50/50 cursor-pointer active:bg-orange-100/40 transition-colors group select-none"
                            >
                              {/* 1. Order Number & Time */}
                              <td className="py-2.5 px-3 font-mono">
                                <div className="font-black text-stone-900 text-xs">
                                  #{order.orderNumber}
                                </div>
                                <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5 font-medium">
                                  <Clock className="w-3 h-3 text-stone-300" />
                                  <span>{formatTime(order.createdAt)}</span>
                                </div>
                              </td>

                              {/* 2. Table / Order Type */}
                              <td className="py-2.5 px-3">
                                {order.table?.tableNumber ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg">
                                    <span>Meja {order.table.tableNumber}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 font-bold text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg">
                                    <span>Take Away</span>
                                  </span>
                                )}
                              </td>

                              {/* 3. Customer */}
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-stone-900 text-xs">
                                  {order.customerName || 'Walk-in'}
                                </div>
                                {order.customerPhone && (
                                  <div className="text-[10px] text-stone-400 font-mono">
                                    {order.customerPhone}
                                  </div>
                                )}
                              </td>

                              {/* 4. Menu Items */}
                              <td className="py-2.5 px-3 max-w-xs">
                                <div className="line-clamp-2 text-xs text-stone-700 leading-snug">
                                  {itemsText || 'Tidak ada rincian item'}
                                </div>
                              </td>

                              {/* 5. Payment Method */}
                              <td className="py-2.5 px-3">
                                {(() => {
                                  switch (method) {
                                    case 'QRIS':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          <QrCode className="w-3 h-3" />
                                          <span>QRIS</span>
                                        </span>
                                      );
                                    case 'DEBIT_CARD':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                          <CreditCard className="w-3 h-3" />
                                          <span>Debit EDC</span>
                                        </span>
                                      );
                                    case 'CREDIT_CARD':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          <CreditCard className="w-3 h-3" />
                                          <span>Kredit</span>
                                        </span>
                                      );
                                    case 'BANK_TRANSFER':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                          <Building2 className="w-3 h-3" />
                                          <span>Transfer</span>
                                        </span>
                                      );
                                    default:
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <Banknote className="w-3 h-3" />
                                          <span>Tunai</span>
                                        </span>
                                      );
                                  }
                                })()}
                              </td>

                              {/* 6. Total Bill */}
                              <td className="py-2.5 px-3 font-mono font-black text-stone-900 text-xs whitespace-nowrap">
                                {formatRupiah(order.totalAmount)}
                              </td>

                              {/* 7. Status */}
                              <td className="py-2.5 px-3">
                                {(() => {
                                  switch (order.status) {
                                    case 'PENDING_PAYMENT':
                                    case 'DRAFT':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                          <span>Menunggu Bayar</span>
                                        </span>
                                      );
                                    case 'CONFIRMED':
                                    case 'PAID':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                          <span>Diproses</span>
                                        </span>
                                      );
                                    case 'PREPARING':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                          <span>Dimasak</span>
                                        </span>
                                      );
                                    case 'READY':
                                    case 'OUT_FOR_DELIVERY':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                          <span>Siap Antar</span>
                                        </span>
                                      );
                                    case 'DELIVERED':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <span>Tersaji</span>
                                        </span>
                                      );
                                    case 'COMPLETED':
                                      return (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Selesai</span>
                                        </span>
                                      );
                                    default:
                                      return (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700">
                                          {order.status}
                                        </span>
                                      );
                                  }
                                })()}
                              </td>

                              {/* 8. Quick Actions */}
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {/* Action Buttons */}
                                  {['PENDING_PAYMENT', 'DRAFT'].includes(order.status) && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                      title="Konfirmasi Pembayaran"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Konfirmasi</span>
                                    </button>
                                  )}

                                  {['CONFIRMED', 'PAID'].includes(order.status) && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Kirim ke Dapur"
                                    >
                                      <span>Kirim Dapur</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}

                                  {order.status === 'PREPARING' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Makanan Siap Saji"
                                    >
                                      <span>Siap Saji</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}

                                  {['READY', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Selesaikan Pengantaran"
                                    >
                                      <span>Selesai</span>
                                      <CheckCheck className="w-3 h-3" />
                                    </button>
                                  )}

                                  {order.status === 'DELIVERED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Tamu Selesai, Kosongkan Meja"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                      <span>Kosongkan Meja</span>
                                    </button>
                                  )}

                                  {/* Print Receipt */}
                                  <button
                                    type="button"
                                    onClick={() => setReceiptOrder(order)}
                                    className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                                    title="Cetak Struk"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>

                                  {/* View Details */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                                    title="Detail Pesanan"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
          </main>

        </div>
      </div>

      {/* Slide-over Right Drawer for Menu Populer (All Screen Sizes) */}
      {rightDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setRightDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white p-4 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-2">
                <span className="font-extrabold text-sm text-stone-900">Menu Populer</span>
                <button
                  type="button"
                  onClick={() => setRightDrawerOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl cursor-pointer hover:bg-stone-100 transition"
                  title="Tutup Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PopularProductsWidget
                  products={products}
                  onOpenNewOrder={() => {
                    setRightDrawerOpen(false);
                    setIsNewOrderModalOpen(true);
                  }}
                  onSelectProduct={(p) => {
                    setRightDrawerOpen(false);
                    setIsNewOrderModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal (Buat Pesanan Baru) */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={() => {
          fetchOrders(true);
          fetchProductsAndTables();
        }}
        tables={tables}
        products={products}
        activeDiscounts={activeDiscounts}
        activeOrders={orders}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 max-h-[92vh] flex flex-col pb-safe select-none"
          >
            {/* Mobile Drag Handle */}
            <div className="pt-2.5 pb-0.5 flex justify-center shrink-0 sm:hidden">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>

            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/60">
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  Pesanan #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedOrder.table?.tableNumber ? `Meja ${selectedOrder.table.tableNumber}` : 'Takeaway'} &bull;{' '}
                  {selectedOrder.customerName || 'Pelanggan'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Daftar Menu
                </span>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-start text-xs">
                      <div>
                        <div className="font-bold text-stone-900">
                          {item.quantity}x {item.productName}
                        </div>
                        {item.variantName && (
                          <div className="text-stone-500">Varian: {item.variantName}</div>
                        )}
                        {item.notes && (
                          <div className="text-orange-700 italic text-[11px]">&quot;{item.notes}&quot;</div>
                        )}
                      </div>
                      <div className="font-semibold text-stone-900 font-mono">
                        {formatRupiah(item.totalPrice ?? item.subtotal ?? (Number(item.unitPrice) * item.quantity))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown */}
              <div className="p-3.5 bg-stone-50 rounded-2xl space-y-1.5 text-xs text-stone-600 border border-stone-200/60">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatRupiah(selectedOrder.subtotal)}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Diskon Promo</span>
                    <span className="font-mono">-{formatRupiah(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                {Number(selectedOrder.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak Resto</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.taxAmount)}</span>
                  </div>
                )}
                {Number(selectedOrder.serviceChargeAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span className="font-mono">{formatRupiah(selectedOrder.serviceChargeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Tagihan</span>
                  <span className="text-orange-700 font-mono">{formatRupiah(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* =========================================================================
                  UI-UX PRO MAX (FASE 2): KASIR CEPAT & PERHITUNGAN PEMBAYARAN TUNAI / QRIS
                 ========================================================================= */}
              {selectedOrder.status === 'PENDING_PAYMENT' ? (
                <div className="p-4 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-emerald-500/5 rounded-3xl border-2 border-orange-200/90 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                          Kasir & Pembayaran Cepat
                        </h4>
                        <p className="text-[10px] text-stone-500">Pilih metode & kalkulasi kembalian</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-base text-orange-600">
                      {formatRupiah(selectedOrder.totalAmount)}
                    </span>
                  </div>

                  {/* Method Selector Tabs */}
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100/90 rounded-2xl">
                    {[
                      { id: 'CASH', label: 'Tunai', icon: Banknote },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'DEBIT_CARD', label: 'EDC', icon: CreditCard },
                      { id: 'BANK_TRANSFER', label: 'Transfer', icon: Building2 },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = fastPayMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFastPayMethod(m.id as any)}
                          className={`py-2 px-1.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
                            active
                              ? 'bg-white text-orange-700 shadow-2xs ring-1 ring-orange-400/40'
                              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
                          <span className="text-[10px] leading-tight">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* A. Cash Calculator Panel */}
                  {fastPayMethod === 'CASH' && (
                    <div className="space-y-2.5 p-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-stone-700">Uang Tunai Diterima:</span>
                        <div className="relative max-w-[170px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                            Rp
                          </span>
                          <input
                            type="text"
                            placeholder="0"
                            value={fastPayCashReceived}
                            onChange={(e) => {
                              const num = e.target.value.replace(/\D/g, '');
                              setFastPayCashReceived(num ? Number(num).toLocaleString('id-ID') : '');
                            }}
                            className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-right font-mono font-black text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Quick Presets for Indonesian Rupiah */}
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-extrabold">
                        <button
                          type="button"
                          onClick={() => setFastPayCashReceived(Number(selectedOrder.totalAmount).toLocaleString('id-ID'))}
                          className="px-2.5 py-1 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 active:scale-95 transition shrink-0 cursor-pointer shadow-2xs"
                        >
                          Uang Pas
                        </button>
                        {[20000, 50000, 100000, 200000].map((amt) => {
                          if (amt >= Number(selectedOrder.totalAmount) || amt === 100000) {
                            return (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setFastPayCashReceived(amt.toLocaleString('id-ID'))}
                                className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 active:scale-95 transition shrink-0 font-mono cursor-pointer border border-stone-200/70"
                              >
                                {(amt / 1000).toLocaleString('id-ID')}rb
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Change Calculator Live Feedback */}
                      {parseNumberFromDots(fastPayCashReceived) > 0 && (
                        <div
                          className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all ${
                            parseNumberFromDots(fastPayCashReceived) >= Number(selectedOrder.totalAmount)
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border border-rose-300'
                          }`}
                        >
                          <span className="font-extrabold">
                            {parseNumberFromDots(fastPayCashReceived) >= Number(selectedOrder.totalAmount)
                              ? '💰 Kembalian Kasir:'
                              : '⚠️ Kurang Bayar:'}
                          </span>
                          <span className="font-mono font-black text-base tabular-nums">
                            {formatRupiah(Math.abs(parseNumberFromDots(fastPayCashReceived) - Number(selectedOrder.totalAmount)))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* B. QRIS BorderPay Live Status & Instructions */}
                  {fastPayMethod === 'QRIS' && (
                    <div className="p-3 bg-white rounded-2xl border border-blue-200/90 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2 text-blue-900 text-xs font-bold">
                        <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>QRIS Statis / BorderPay Otomatis</span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Pelanggan dapat melakukan scan QRIS di meja atau kasir. Tekan tombol di bawah untuk memeriksa notifikasi otomatis dari server BorderPay.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setFastPayBorderPayChecking(true);
                          try {
                            const res = await api.get<any>(`/payments/${selectedOrder.id}/borderpay-sync`);
                            if (res?.synced || res?.status === 'PAID') {
                              alert('✓ Pembayaran QRIS BorderPay terverifikasi LUNAS!');
                              fetchOrders(true);
                              setSelectedOrder((prev) => (prev ? { ...prev, status: 'PAID' } : null));
                            } else {
                              alert(`Status di BorderPay: ${res?.status || 'Belum Lunas'}. Menunggu pelanggan menyelesaikan scan.`);
                            }
                          } catch (err: any) {
                            alert(err.message || 'Gagal memeriksa status pembayaran BorderPay');
                          } finally {
                            setFastPayBorderPayChecking(false);
                          }
                        }}
                        disabled={fastPayBorderPayChecking}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${fastPayBorderPayChecking ? 'animate-spin' : ''}`} />
                        <span>{fastPayBorderPayChecking ? 'Memeriksa Server BorderPay...' : 'Cek Status Pembayaran QRIS'}</span>
                      </button>
                    </div>
                  )}

                  {/* C. Auto Print Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fastPayAutoPrint}
                        onChange={(e) => setFastPayAutoPrint(e.target.checked)}
                        className="w-4 h-4 text-orange-600 rounded-md border-stone-300 focus:ring-orange-500 cursor-pointer"
                      />
                      <span>Cetak Struk Thermal Otomatis</span>
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">ESC/POS Bluetooth</span>
                  </div>

                  {/* D. Primary Confirm Button */}
                  <button
                    type="button"
                    onClick={handleFastPayConfirm}
                    disabled={
                      fastPayProcessing ||
                      (fastPayMethod === 'CASH' &&
                        parseNumberFromDots(fastPayCashReceived) > 0 &&
                        parseNumberFromDots(fastPayCashReceived) < Number(selectedOrder.totalAmount))
                    }
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {fastPayProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Pembayaran...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Konfirmasi Lunas ({formatRupiah(selectedOrder.totalAmount)})
                          {fastPayAutoPrint ? ' & Cetak' : ''}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Status Action Buttons for Already Paid / Processed Orders */
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                    Alur Status Pesanan Resto:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                      className="p-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Masak Dapur</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')}
                      className="p-2 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <ConciergeBell className="w-3.5 h-3.5" />
                      <span>Siap Saji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      className="p-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Selesai Antar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                      className={`p-2 rounded-xl transition flex items-center justify-center gap-1 text-xs font-bold active:scale-95 cursor-pointer ${
                        selectedOrder.status === 'DELIVERED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white col-span-2 sm:col-span-3 shadow-2xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selesai & Kosongkan Meja</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setReceiptOrder(selectedOrder)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      {receiptOrder && (
        <div
          className="receipt-modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 print:p-0 print:static print:bg-transparent print:backdrop-blur-none print:z-auto print:block animate-in fade-in duration-150"
          onClick={() => setReceiptOrder(null)}
        >
          
          {/* Isolated Print Styles for Thermal Receipt */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: auto;
                margin: 0mm !important;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#__next),
              #__next > *:not(main),
              .print\\:hidden,
              .no-print {
                display: none !important;
              }
              .receipt-modal-overlay {
                position: static !important;
                background: transparent !important;
                padding: 0 !important;
                inset: auto !important;
                width: 100% !important;
              }
              .receipt-modal-content {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: none !important;
                height: auto !important;
                background: transparent !important;
                display: block !important;
              }
              .receipt-modal-scrollable {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
              }
              #thermal-receipt-printable {
                display: block !important;
                width: ${receiptPaperWidth === '80mm' ? '76mm' : '56mm'} !important;
                max-width: ${receiptPaperWidth === '80mm' ? '76mm' : '56mm'} !important;
                margin: 0 auto !important;
                padding: 2mm 1mm 15mm 1mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                font-family: 'Courier New', Courier, monospace !important;
              }
              #thermal-receipt-printable * {
                color: #000000 !important;
                background: transparent !important;
              }
              #thermal-receipt-printable img {
                filter: grayscale(100%) contrast(150%) !important;
                -webkit-filter: grayscale(100%) contrast(150%) !important;
                max-width: 28mm !important;
                height: auto !important;
              }
              .thermal-divider {
                border-top: 1px dashed #000000 !important;
                margin: 6px 0 !important;
              }
              .thermal-divider-double {
                border-top: 2px dashed #000000 !important;
                margin: 6px 0 !important;
              }
            }
          `}} />

          <div
            onClick={(e) => e.stopPropagation()}
            className="receipt-modal-content bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] font-mono text-stone-900 animate-in slide-in-from-bottom-8 sm:zoom-in-95 print:p-0 print:shadow-none print:rounded-none print:w-auto print:max-w-none print:max-h-none print:block pb-safe select-none"
          >
            {/* Mobile Drag Handle */}
            <div className="pt-0 pb-2 flex justify-center shrink-0 sm:hidden print:hidden">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>
            
            {/* Modal Toolbar (Hidden on Print, pinned at top) */}
            <div className="shrink-0 flex justify-between items-center pb-2.5 border-b border-stone-100 print:hidden font-sans">
              <div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider">Struk Pembayaran POS</h3>
                <p className="text-[10px] text-stone-400">Siap cetak printer thermal</p>
              </div>
              
              {/* Paper Size Selector (58mm / 80mm) */}
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    receiptPaperWidth === '58mm' ? 'bg-orange-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    receiptPaperWidth === '80mm' ? 'bg-orange-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  80mm
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Receipt Paper Body */}
            <div className="receipt-modal-scrollable flex-1 overflow-y-auto px-1 py-1 min-h-0 custom-scrollbar print:overflow-visible print:p-0 print:m-0 print:h-auto print:max-h-none print:block">
              {/* Printable Receipt Paper */}
              <div
                id="thermal-receipt-printable"
              className={`bg-white p-4 rounded-xl border border-stone-200 shadow-xs text-center space-y-2 text-stone-900 mx-auto transition-all print:border-none print:shadow-none print:p-0 ${
                receiptPaperWidth === '80mm' ? 'max-w-[340px]' : 'max-w-[280px]'
              }`}
            >
              {/* Logo Cafe */}
              {activeTenantBrand.logo && (
                <div className="flex justify-center mb-1">
                  <img
                    src={activeTenantBrand.logo}
                    alt={activeTenantBrand.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    className="w-14 h-14 object-contain mx-auto filter print:grayscale print:contrast-150"
                  />
                </div>
              )}

              {/* Cafe Header */}
              <div className="space-y-0.5">
                <h2 className="text-sm font-black tracking-wider uppercase text-stone-900">
                  {activeTenantBrand.name}
                </h2>
                {activeTenantBrand.tagline && (
                  <p className="text-[10px] text-stone-600 italic leading-tight">{activeTenantBrand.tagline}</p>
                )}
                {activeTenantBrand.address && (
                  <p className="text-[10px] text-stone-600 leading-tight mt-0.5">{activeTenantBrand.address}</p>
                )}
                {activeTenantBrand.phone && (
                  <p className="text-[9px] text-stone-600 leading-tight">Telp: {activeTenantBrand.phone}</p>
                )}
              </div>

              {/* Dashed Separator */}
              <div className="thermal-divider border-t border-dashed border-stone-400 my-2" />

              {/* Meta Info */}
              <div className="text-[11px] text-left space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-stone-600">No. Order:</span>
                  <span className="font-bold">#{receiptOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Waktu:</span>
                  <span>{formatDateTime(receiptOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Kasir:</span>
                  <span className="font-medium">{(receiptOrder as any).cashier?.fullName || user?.fullName || 'Kasir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Meja / Tipe:</span>
                  <span className="font-bold">
                    {receiptOrder.table?.tableNumber ? `Meja ${receiptOrder.table.tableNumber}` : 'Takeaway'}
                  </span>
                </div>
                {receiptOrder.customerName && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Pelanggan:</span>
                    <span className="font-medium">{receiptOrder.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">Status:</span>
                  <span className="font-bold uppercase tracking-wider text-emerald-800">LUNAS</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="thermal-divider border-t border-dashed border-stone-400 my-2" />

              {/* Items List */}
              <div className="text-[11px] text-left space-y-1.5">
                {receiptOrder.items.map((it) => (
                  <div key={it.id} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span className="pr-2">{it.quantity}x {it.productName}</span>
                      <span className="shrink-0">{formatRupiah(it.totalPrice ?? it.subtotal ?? (Number(it.unitPrice) * it.quantity))}</span>
                    </div>
                    {it.variantName && (
                      <div className="text-[9px] text-stone-500 pl-4">
                        Varian: {it.variantName}
                      </div>
                    )}
                    {it.modifiers && it.modifiers.length > 0 && it.modifiers.map((mod) => (
                      <div key={mod.id} className="text-[9px] text-stone-500 pl-4 flex justify-between">
                        <span>+ {mod.modifierOptionName}</span>
                        {Number(mod.price) > 0 && <span>+{formatRupiah(mod.price)}</span>}
                      </div>
                    ))}
                    {it.notes && (
                      <div className="text-[9px] text-stone-500 italic pl-4">
                        Catatan: {it.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dashed Separator */}
              <div className="thermal-divider border-t border-dashed border-stone-400 my-2" />

              {/* Totals Breakdown */}
              <div className="text-[11px] text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span>{formatRupiah(receiptOrder.subtotal)}</span>
                </div>
                {Number(receiptOrder.discountAmount) > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Diskon Promo:</span>
                    <span>-{formatRupiah(receiptOrder.discountAmount)}</span>
                  </div>
                )}
                {Number(receiptOrder.taxAmount) > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Pajak Resto:</span>
                    <span>{formatRupiah(receiptOrder.taxAmount)}</span>
                  </div>
                )}
                {Number(receiptOrder.serviceChargeAmount) > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Service Charge:</span>
                    <span>{formatRupiah(receiptOrder.serviceChargeAmount)}</span>
                  </div>
                )}
                
                <div className="thermal-divider-double border-t-2 border-dashed border-stone-800 my-1 pt-1" />

                <div className="flex justify-between font-black text-sm pt-0.5">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(receiptOrder.totalAmount)}</span>
                </div>

                {/* Payment Method Details */}
                <div className="flex justify-between text-[10px] text-stone-600 pt-1">
                  <span>Metode Bayar:</span>
                  <span className="font-bold uppercase text-stone-900">
                    {receiptOrder.paymentMethod || receiptOrder.payments?.[0]?.method || 'TUNAI'}
                  </span>
                </div>
                {Number(receiptOrder.paidAmount) > 0 && (
                  <>
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>Diterima (Tunai):</span>
                      <span>{formatRupiah(receiptOrder.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-600 font-bold">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(Math.max(0, Number(receiptOrder.paidAmount) - Number(receiptOrder.totalAmount)))}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Dashed Separator */}
              <div className="thermal-divider border-t border-dashed border-stone-400 my-2.5" />

              {/* Footer Greetings */}
              <div className="text-center space-y-1 text-stone-600">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-800">
                  {activeTenantBrand.receiptFooter}
                </p>
                <p className="text-[9px] italic">Struk ini merupakan bukti pembayaran yang sah</p>
                <p className="text-[8px] text-stone-400 pt-1 font-sans">Powered by Cafe POS</p>
              </div>
            </div>
            </div>

            {/* Modal Action Buttons (Pinned at bottom, hidden on print) */}
            <div className="shrink-0 flex gap-2 font-sans pt-3 border-t border-stone-100 bg-white print:hidden">
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="flex-1 py-2.5 px-3 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!receiptOrder) return;
                  const res = await PrinterManager.printOrderReceipt(receiptOrder, { paperWidth: receiptPaperWidth });
                  if (!res.success && res.fallback) {
                    window.print();
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Modal (Buka Shift Kasir) */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Buka Shift Kasir</h3>
                  <p className="text-xs text-stone-400">
                    Kasir: <span className="font-semibold text-stone-700">{user?.fullName || 'Kasir'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="p-5 space-y-4">
              {shiftError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{shiftError}</span>
                </div>
              )}

              {assignedShiftInfo && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Jadwal Resmi Kasir: <strong className="font-bold">{assignedShiftInfo.name} ({assignedShiftInfo.startTime} - {assignedShiftInfo.endTime})</strong>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nama Sesi Shift *</label>
                <input
                  type="text"
                  required
                  value={openShiftName}
                  onChange={(e) => setOpenShiftName(e.target.value)}
                  placeholder="Contoh: Shift Pagi (08:00 - 16:00)"
                  className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {assignedShiftInfo && (
                    <button
                      type="button"
                      onClick={() => setOpenShiftName(`${assignedShiftInfo.name} (${assignedShiftInfo.startTime || '08:00'} - ${assignedShiftInfo.endTime || '16:00'})`)}
                      className="px-2 py-1 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition"
                    >
                      ⭐ {assignedShiftInfo.name}
                    </button>
                  )}
                  {['Shift Pagi (08:00 - 16:00)', 'Shift Siang (12:00 - 20:00)', 'Shift Sore / Malam (16:00 - 24:00)'].map((sName) => (
                    <button
                      key={sName}
                      type="button"
                      onClick={() => setOpenShiftName(sName)}
                      className="px-2 py-1 text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition"
                    >
                      {sName.split(' ')[0]} {sName.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">Modal Kas Awal di Laci *</label>
                  <span className="text-[10px] text-stone-400">Uang kembalian awal</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={openInitialCash}
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, '');
                      setOpenInitialCash(rawDigits ? formatNumberWithDots(rawDigits) : '');
                    }}
                    placeholder="100.000"
                    className="w-full text-sm pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {/* Quick Cash Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpenInitialCash(formatNumberWithDots(amt))}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-stone-100 hover:bg-orange-100 hover:text-orange-700 text-stone-600 rounded-lg transition"
                    >
                      Rp {formatNumberWithDots(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-3.5 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={shiftSubmitting}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {shiftSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Buka Shift Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal (Tutup Shift & Rekonsiliasi Kas) */}
      {isCloseShiftModalOpen && currentShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-stone-100">
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Tutup Shift & Rekonsiliasi Kas</h3>
                  <p className="text-xs text-stone-400">
                    {currentShift.shiftName} &bull; Kasir: <span className="font-semibold text-stone-700">{user?.fullName || 'Kasir'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="p-5 overflow-y-auto space-y-4 flex-1">
              {shiftError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{shiftError}</span>
                </div>
              )}

              {/* Ringkasan Kas Sistem */}
              {(() => {
                const sumData = shiftSummary?.summary || shiftSummary?.shift || shiftSummary;
                const initialCashVal = Number(sumData?.initialCash ?? currentShift?.initialCash ?? 0);
                const totalCashVal = Number(sumData?.totalCash ?? 0);
                const totalNonCashVal = Number(sumData?.totalNonCash ?? 0);
                const expectedCashVal = Number(sumData?.expectedCash ?? (initialCashVal + totalCashVal));
                const totalSalesVal = Number(sumData?.totalSales ?? (totalCashVal + totalNonCashVal));
                const ordersCountVal = Number(sumData?.ordersCount ?? 0);

                const actualCashNum = parseNumberFromDots(closeActualCash);
                const diff = actualCashNum - expectedCashVal;

                return (
                  <>
                    {/* SEKTOR 1: KAS TUNAI DI LACI (TANGGUNG JAWAB FISIK KASIR) */}
                    <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-emerald-700" />
                          <div>
                            <span className="font-extrabold text-xs text-emerald-950 block">1. Rekonsiliasi Kas Laci (Uang Tunai Fisik)</span>
                            <span className="text-[10px] text-emerald-700/80 font-medium">Hanya uang tunai kertas & koin yang dihitung fisik oleh kasir</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Kas Laci
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 bg-white border border-emerald-100 rounded-xl text-center">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Modal Awal</span>
                          <span className="text-xs sm:text-sm font-black text-stone-900 font-mono">
                            {formatRupiah(initialCashVal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Penjualan Tunai</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono">
                            {formatRupiah(totalCashVal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Target Laci Fisik</span>
                          <span className="text-xs sm:text-sm font-black text-orange-700 font-mono">
                            {formatRupiah(expectedCashVal)}
                          </span>
                        </div>
                      </div>

                      {/* Input Fisik Kasir */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-stone-700">
                            Uang Fisik Dihitung Kasir di Laci (Cash) *
                          </label>
                          <span className="text-[10px] text-stone-400">Dihitung manual dari laci</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-stone-400">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="Contoh: 350.000"
                            value={closeActualCash}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              setCloseActualCash(digits ? formatNumberWithDots(digits) : '');
                            }}
                            className="w-full text-sm pl-10 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Quick Preset Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => setCloseActualCash(formatNumberWithDots(expectedCashVal))}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-200 transition cursor-pointer"
                          >
                            ✨ Samakan Target ({formatRupiah(expectedCashVal)})
                          </button>
                          {[50000, 100000, 200000, 500000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setCloseActualCash(formatNumberWithDots(amt))}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 rounded-lg transition cursor-pointer"
                            >
                              Rp {formatNumberWithDots(amt)}
                            </button>
                          ))}
                        </div>

                        {/* Dynamic Live Deficit / Surplus Calculation */}
                        {closeActualCash.trim() !== '' && (
                          <div
                            className={`mt-3 p-3 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                              diff === 0
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : diff > 0
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {diff === 0 ? '🟢' : diff > 0 ? '🔵' : '🔴'}
                              </span>
                              <div>
                                <span className="block font-black">
                                  {diff === 0
                                    ? 'Kas Seimbang (Sesuai Target Fisik Laci)'
                                    : diff > 0
                                    ? 'Kas Lebih (Surplus)'
                                    : 'Kas Kurang (Defisit)'}
                                </span>
                                <span className="text-[10px] opacity-80 font-normal">
                                  {diff === 0
                                    ? 'Uang fisik di laci pas dengan pencatatan tunai sistem'
                                    : diff > 0
                                    ? 'Uang fisik di laci lebih banyak dari target sistem'
                                    : 'Uang fisik di laci kurang dari target sistem'}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-sm font-black">
                              {diff === 0
                                ? 'Rp 0'
                                : diff > 0
                                ? `+${formatRupiah(diff)}`
                                : `-${formatRupiah(Math.abs(diff))}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SEKTOR 2: PENERIMAAN NON-TUNAI / BANK / EDC */}
                    <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-700" />
                          <div>
                            <span className="font-extrabold text-xs text-blue-950 block">2. Penerimaan Non-Tunai (Rekening Kafe & Mesin EDC)</span>
                            <span className="text-[10px] text-blue-700/80 font-medium">Uang langsung masuk bank, tidak dihitung di laci fisik kasir</span>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded-lg">
                          Total: {formatRupiah(totalNonCashVal)}
                        </span>
                      </div>

                      {/* Itemized Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* QRIS (BorderPay & Standard) */}
                        {(() => {
                          const qrisObj = sumData?.paymentBreakdown?.QRIS;
                          const bpObj = sumData?.paymentBreakdown?.BORDERPAY;
                          const qrisCount = qrisObj?.count ?? bpObj?.count ?? 0;
                          const qrisTotal = qrisObj?.total ?? bpObj?.total ?? 0;

                          return (
                            <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-rose-500 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[11px] text-stone-800">QRIS</span>
                                    <span className="text-[8px] bg-rose-50 text-rose-700 font-extrabold px-1.5 py-0.2 rounded border border-rose-200">BorderPay</span>
                                  </div>
                                  <span className="text-[9px] text-stone-400">
                                    {qrisCount} transaksi
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-stone-900 text-xs">
                                {formatRupiah(qrisTotal)}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Debit EDC */}
                        <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-[11px] text-stone-800">Debit EDC</span>
                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-semibold">Struk EDC</span>
                              </div>
                              <span className="text-[9px] text-stone-400">
                                {sumData?.paymentBreakdown?.DEBIT_CARD?.count || 0} transaksi
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {formatRupiah(sumData?.paymentBreakdown?.DEBIT_CARD?.total || 0)}
                          </span>
                        </div>

                        {/* Kredit EDC */}
                        <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <span className="font-bold text-[11px] text-stone-800 block">Kredit EDC</span>
                              <span className="text-[9px] text-stone-400">
                                {sumData?.paymentBreakdown?.CREDIT_CARD?.count || 0} transaksi
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {formatRupiah(sumData?.paymentBreakdown?.CREDIT_CARD?.total || 0)}
                          </span>
                        </div>

                        {/* Transfer Bank */}
                        <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-500 shrink-0" />
                            <div>
                              <span className="font-bold text-[11px] text-stone-800 block">Transfer Bank</span>
                              <span className="text-[9px] text-stone-400">
                                {sumData?.paymentBreakdown?.BANK_TRANSFER?.count || 0} transaksi
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-900 text-xs">
                            {formatRupiah(sumData?.paymentBreakdown?.BANK_TRANSFER?.total || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TOTAL OMZET SUMMARY CHIP */}
                    <div className="p-3 bg-stone-100 rounded-xl flex items-center justify-between text-xs font-bold text-stone-700">
                      <span>Total Seluruh Omzet Shift ({ordersCountVal} pesanan):</span>
                      <span className="text-sm font-black font-mono text-stone-900">{formatRupiah(totalSalesVal)}</span>
                    </div>
                  </>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Catatan Shift (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kendala uang kembalian, struk batch EDC, dll..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-3.5 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenShiftReceiptModal}
                    className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Cetak struk Z-Report ringkasan shift ke printer thermal"
                  >
                    <Printer className="w-4 h-4 text-stone-500" />
                    <span>Cetak Struk Rekap</span>
                  </button>
                  <button
                    type="submit"
                    disabled={shiftSubmitting}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {shiftSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Tutup Shift & Rekap Kasir</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Thermal Shift Closing Receipt Modal (Z-Report) */}
      {isShiftReceiptModalOpen && shiftReceiptData && (
        <div className="receipt-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-transparent print:static">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: auto;
                margin: 0mm !important;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#__next),
              #__next > *:not(main),
              .print\\:hidden,
              .no-print {
                display: none !important;
              }
              .shift-receipt-content {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                background: transparent !important;
                display: block !important;
              }
              #thermal-shift-receipt-printable {
                display: block !important;
                width: ${shiftReceiptPaperWidth === '80mm' ? '76mm' : '56mm'} !important;
                max-width: ${shiftReceiptPaperWidth === '80mm' ? '76mm' : '56mm'} !important;
                margin: 0 auto !important;
                padding: 2mm 1mm 15mm 1mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                font-family: 'Courier New', Courier, monospace !important;
              }
              #thermal-shift-receipt-printable * {
                color: #000000 !important;
                background: transparent !important;
              }
            }
          `}} />

          <div className="shift-receipt-content bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] font-mono text-stone-900 print:p-0 print:shadow-none print:rounded-none print:w-auto print:max-w-none print:max-h-none print:block">
            {/* Modal Toolbar */}
            <div className="shrink-0 flex justify-between items-center pb-2.5 border-b border-stone-100 print:hidden font-sans">
              <div>
                <h3 className="text-xs font-black text-stone-800 uppercase tracking-wider">Struk Tutup Shift (Z-Report)</h3>
                <p className="text-[10px] text-stone-400">Siap cetak printer thermal</p>
              </div>

              {/* Paper Size Selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setShiftReceiptPaperWidth('58mm')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    shiftReceiptPaperWidth === '58mm' ? 'bg-orange-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => setShiftReceiptPaperWidth('80mm')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    shiftReceiptPaperWidth === '80mm' ? 'bg-orange-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  80mm
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsShiftReceiptModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto px-1 py-1 min-h-0 custom-scrollbar print:overflow-visible print:p-0 print:m-0 print:h-auto print:max-h-none print:block">
              <div id="thermal-shift-receipt-printable" className="text-[11px] leading-tight space-y-2 py-2">
                {/* Store Header */}
                <div className="text-center space-y-0.5">
                  {activeTenantBrand.logo && (
                    <div className="flex justify-center mb-1">
                      <img
                        src={activeTenantBrand.logo}
                        alt={activeTenantBrand.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        className="w-12 h-12 object-contain mx-auto filter print:grayscale print:contrast-150"
                      />
                    </div>
                  )}
                  <h2 className="font-bold text-sm tracking-tight uppercase">
                    {activeTenantBrand.name}
                  </h2>
                  <p className="text-[10px] uppercase font-bold text-stone-700">*** REKAP TUTUP SHIFT (Z-REPORT) ***</p>
                  <p className="text-[9px] text-stone-500">{formatDateTime(new Date())}</p>
                </div>

                <div className="border-t border-dashed border-stone-800 my-2" />

                {/* Shift Details */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Sesi Shift:</span>
                    <span className="font-bold">{shiftReceiptData.shift?.shiftName || 'Shift'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span className="font-bold">{shiftReceiptData.shift?.cashier?.fullName || user?.fullName || 'Kasir'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-bold">{shiftReceiptData.summary?.ordersCount || 0} Trx</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-800 my-2" />

                {/* Arus Kas Fisik Laci */}
                <div className="space-y-1">
                  <span className="font-bold text-[10px] block uppercase underline">1. ARUS KAS FISIK LACI:</span>
                  <div className="flex justify-between">
                    <span>Modal Awal:</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.initialCash || shiftReceiptData.shift?.initialCash || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penjualan Tunai:</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.totalCash || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-stone-400">
                    <span>Target Kas Laci:</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.expectedCash || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uang Fisik Dihitung:</span>
                    <span className="font-bold">
                      {shiftReceiptData.actualCash !== null ? formatRupiah(shiftReceiptData.actualCash) : '-'}
                    </span>
                  </div>
                  {shiftReceiptData.actualCash !== null && (
                    <div className="flex justify-between font-bold">
                      <span>Selisih Kas Laci:</span>
                      <span>
                        {formatRupiah(Number(shiftReceiptData.actualCash) - Number(shiftReceiptData.summary?.expectedCash || 0))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-stone-800 my-2" />

                {/* Penerimaan Non-Tunai Bank/EDC */}
                <div className="space-y-1">
                  <span className="font-bold text-[10px] block uppercase underline">2. PENERIMAAN NON-TUNAI (BANK/EDC):</span>
                  <div className="flex justify-between">
                    <span>
                      QRIS ({shiftReceiptData.summary?.paymentBreakdown?.QRIS?.count ?? shiftReceiptData.summary?.paymentBreakdown?.BORDERPAY?.count ?? 0} trx):
                    </span>
                    <span>
                      {formatRupiah(shiftReceiptData.summary?.paymentBreakdown?.QRIS?.total ?? shiftReceiptData.summary?.paymentBreakdown?.BORDERPAY?.total ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Debit EDC ({shiftReceiptData.summary?.paymentBreakdown?.DEBIT_CARD?.count || 0} trx):</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.paymentBreakdown?.DEBIT_CARD?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kredit EDC ({shiftReceiptData.summary?.paymentBreakdown?.CREDIT_CARD?.count || 0} trx):</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.paymentBreakdown?.CREDIT_CARD?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer ({shiftReceiptData.summary?.paymentBreakdown?.BANK_TRANSFER?.count || 0} trx):</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.paymentBreakdown?.BANK_TRANSFER?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-stone-400">
                    <span>Total Non-Tunai:</span>
                    <span>{formatRupiah(shiftReceiptData.summary?.totalNonCash || 0)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-800 my-2" />

                {/* Total Omzet */}
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span>TOTAL PENJUALAN:</span>
                  <span>{formatRupiah(shiftReceiptData.summary?.totalSales || 0)}</span>
                </div>

                {shiftReceiptData.notes && (
                  <div className="pt-2 text-[9px] italic border-t border-dotted border-stone-400">
                    <span>Catatan: {shiftReceiptData.notes}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-stone-800 my-3" />

                {/* Signature Area */}
                <div className="grid grid-cols-2 gap-4 text-center text-[9px] pt-2">
                  <div>
                    <p>Kasir,</p>
                    <div className="h-10" />
                    <p className="border-t border-stone-400 mx-2 pt-0.5">({user?.fullName || 'Kasir'})</p>
                  </div>
                  <div>
                    <p>Supervisor / Owner,</p>
                    <div className="h-10" />
                    <p className="border-t border-stone-400 mx-2 pt-0.5">( ................... )</p>
                  </div>
                </div>

                <div className="text-center pt-3 text-[8px] text-stone-400">
                  <p>-- Dicetak dari Sistem POS Kafe --</p>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="shrink-0 pt-3 border-t border-stone-100 flex gap-2 print:hidden font-sans">
              <button
                type="button"
                onClick={() => setIsShiftReceiptModalOpen(false)}
                className="flex-1 py-2.5 px-3 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!shiftReceiptData) return;
                  const res = await PrinterManager.printShiftReceipt(shiftReceiptData, { paperWidth: shiftReceiptPaperWidth });
                  if (!res.success && res.fallback) {
                    window.print();
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Printer Bluetooth Thermal */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />

      {/* Modal Pusat Panggilan Pelayan (Notification Center) */}
      <WaiterCallsModal
        isOpen={isWaiterCallsModalOpen}
        onClose={() => setIsWaiterCallsModalOpen(false)}
        calls={waiterCalls}
        onResolve={handleResolveWaiterCall}
        onFilterTableOrders={(tableNum) => setSearchQuery(String(tableNum))}
      />
    </div>
  );
}
