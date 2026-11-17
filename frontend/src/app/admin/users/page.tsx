'use client';

import React, { useEffect, useState } from 'react';
import ModernStaffLayout from '@/components/layout/ModernStaffLayout';
import { api } from '@/lib/api';
import { User, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Users,
  UserPlus,
  Search,
  RotateCw,
  KeyRound,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Lock,
  Mail,
  UserCheck,
  UserX,
  Phone,
  Shield,
  Coffee,
  Clock,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [shiftName, setShiftName] = useState('Shift Pagi');
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('16:00');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && (!currentUser || !['ADMIN', 'OWNER', 'SUPERADMIN'].includes(currentUser.role))) {
      router.push('/pos');
    }
  }, [currentUser, authLoading, router]);

  const fetchUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get<User[]>('/users');
      if (res && Array.isArray(res)) {
        setUsers(res);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('CASHIER');
    setShiftName('Shift Pagi');
    setShiftStartTime('08:00');
    setShiftEndTime('16:00');
    setNewPassword('');
    setConfirmPassword('');
    setFormError('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError('Nama lengkap, email, dan password wajib diisi');
      return;
    }

    if (password.length < 8) {
      setFormError('Password minimal 8 karakter');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const created = await api.post<any>('/users', {
        fullName: fullName.trim(),
        username: username.trim() ? username.trim().toLowerCase() : undefined,
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role,
      });

      // Save work shift schedule to cafe shifts registry in localStorage for real-time cashier detection
      if (created?.id) {
        const key = `cafe_user_shift_${created.id}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            name: shiftName.trim() || 'Shift Pagi',
            startTime: shiftStartTime || '08:00',
            endTime: shiftEndTime || '16:00',
          })
        );
      }

      setSuccessMessage(`User "${fullName}" berhasil ditambahkan dengan jadwal ${shiftName} (${shiftStartTime} - ${shiftEndTime})!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsAddModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menambahkan user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setFormLoading(true);
    setFormError('');

    try {
      await api.put(`/users/${editingUser.id}`, {
        fullName: fullName.trim(),
        username: username.trim() ? username.trim().toLowerCase() : undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
      });

      // Update work shift schedule in registry
      const key = `cafe_user_shift_${editingUser.id}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          name: shiftName.trim() || 'Shift Pagi',
          startTime: shiftStartTime || '08:00',
          endTime: shiftEndTime || '16:00',
        })
      );

      setSuccessMessage(`Data user "${fullName}" dan jadwal kerja berhasil diperbarui!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal memperbarui user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPassword.trim()) {
      setFormError('Password baru wajib diisi');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.post(`/users/${resettingUser.id}/reset-password`, {
        newPassword,
      });

      setSuccessMessage(`Password untuk "${resettingUser.fullName}" berhasil direset!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setResettingUser(null);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal mereset password');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'mengaktifkan' : 'menonaktifkan';

    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun ${user.fullName}?`)) {
      return;
    }

    try {
      await api.put(`/users/${user.id}/status`, { status: newStatus });
      setSuccessMessage(`Status user "${user.fullName}" berhasil diubah menjadi ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah status user');
    }
  };

  const getUserWorkShift = (userId: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`cafe_user_shift_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username || '');
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);

    const shiftData = getUserWorkShift(u.id);
    if (shiftData) {
      setShiftName(shiftData.name || 'Shift Pagi');
      setShiftStartTime(shiftData.startTime || '08:00');
      setShiftEndTime(shiftData.endTime || '16:00');
    } else {
      setShiftName('Shift Pagi');
      setShiftStartTime('08:00');
      setShiftEndTime('16:00');
    }

    setFormError('');
  };

  const openResetModal = (u: User) => {
    setResettingUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setFormError('');
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchStatus = selectedStatus === 'ALL' || u.status === selectedStatus;

    return matchQuery && matchRole && matchStatus;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OWNER':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'ADMIN':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CASHIER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAITER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'KITCHEN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const cashierCount = users.filter((u) => u.role === 'CASHIER' && u.status === 'ACTIVE').length;
  const adminCount = users.filter((u) => ['ADMIN', 'OWNER'].includes(u.role) && u.status === 'ACTIVE').length;

  return (
    <ModernStaffLayout>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2.5">
              <Users className="w-7 h-7 text-amber-600" />
              <span>Kelola User & Staf</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Atur hak akses kasir, pelayan, dapur, dan administrator kafe Anda
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer"
              title="Perbarui Data"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>

            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Staf</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Akun Staf</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{users.length}</div>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kasir Aktif</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{cashierCount}</div>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
              <Coffee className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admin & Owner</span>
              <div className="text-2xl font-black text-purple-600 mt-1">{adminCount}</div>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama, username, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-xs py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Role</option>
                <option value="CASHIER">Kasir (CASHIER)</option>
                <option value="ADMIN">Admin (ADMIN)</option>
                <option value="OWNER">Pemilik (OWNER)</option>
                <option value="WAITER">Pelayan (WAITER)</option>
                <option value="KITCHEN">Dapur (KITCHEN)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-xs text-gray-500 font-medium">Memuat data pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">Tidak ada user ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba ubah kata kunci pencarian atau filter role</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nama Lengkap & Info</th>
                    <th className="py-3.5 px-4">Username & Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Jadwal Shift</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Terakhir Login</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredUsers.map((u) => {
                    const shiftData = getUserWorkShift(u.id);

                    return (
                      <tr key={u.id} className="hover:bg-amber-50/20 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {u.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{u.fullName}</div>
                              {u.phone && <div className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-gray-700 font-medium">
                            {u.username ? (
                              <span className="text-amber-800 font-bold">@{u.username}</span>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500">{u.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {shiftData ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{shiftData.name}</span>
                              <span className="font-mono text-stone-500">({shiftData.startTime}-{shiftData.endTime})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Shift Regular (08:00-16:00)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {u.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {u.lastLoginAt ? (
                            <div>
                              <div className="font-medium text-gray-700">{formatDate(u.lastLoginAt)}</div>
                              <div className="text-gray-400">{formatTime(u.lastLoginAt)}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Belum pernah login</span>
                          )}
                        </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openResetModal(u)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.status === 'ACTIVE'
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Tambah User / Staf Baru</h3>
                  <p className="text-xs text-gray-400">Buat akun untuk kasir, pelayan, atau admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username (Opsional)</label>
                  <input
                    type="text"
                    placeholder="budi_kasir"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role Akses *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CASHIER">Kasir (CASHIER)</option>
                    <option value="ADMIN">Admin (ADMIN)</option>
                    <option value="WAITER">Pelayan (WAITER)</option>
                    <option value="KITCHEN">Dapur (KITCHEN)</option>
                    <option value="OWNER">Pemilik (OWNER)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="budi@kafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password Awal *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">No. Handphone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Pengaturan Jadwal Kerja / Shift Staf */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    Jadwal Jam Kerja / Shift
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Nama Shift</label>
                    <input
                      type="text"
                      placeholder="Contoh: Shift Pagi"
                      value={shiftName}
                      onChange={(e) => setShiftName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800/80 italic">
                  * Jadwal ini akan otomatis terpasang saat kasir membuka sesi shift di POS.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Edit User Staf</h3>
                  <p className="text-xs text-gray-400">{editingUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role Akses *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CASHIER">Kasir (CASHIER)</option>
                    <option value="ADMIN">Admin (ADMIN)</option>
                    <option value="WAITER">Pelayan (WAITER)</option>
                    <option value="KITCHEN">Dapur (KITCHEN)</option>
                    <option value="OWNER">Pemilik (OWNER)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">No. Handphone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Pengaturan Jadwal Kerja / Shift Staf */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    Jadwal Jam Kerja / Shift
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Nama Shift</label>
                    <input
                      type="text"
                      placeholder="Contoh: Shift Pagi"
                      value={shiftName}
                      onChange={(e) => setShiftName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800/80 italic">
                  * Jadwal ini akan otomatis terpasang saat kasir membuka sesi shift di POS.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Perbarui Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Reset Password</h3>
                  <p className="text-xs text-gray-400">{resettingUser.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password Baru *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reset Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModernStaffLayout>
  );
}

