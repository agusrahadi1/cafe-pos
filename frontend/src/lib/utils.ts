import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return '';

  // If already absolute URL but pointing to localhost from a remote browser
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.includes('abstech.web.id') &&
    (pathOrUrl.includes('localhost:5000') || pathOrUrl.includes('127.0.0.1:5000'))
  ) {
    return pathOrUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1):5000/, 'https://api.abstech.web.id');
  }

  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }

  let backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '');
  if (typeof window !== 'undefined') {
    const isLocalhostEnv = !backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');
    const isNonLocalWindow = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isLocalhostEnv && isNonLocalWindow) {
      if (window.location.hostname.includes('abstech.web.id')) {
        backendUrl = `${window.location.protocol}//api.abstech.web.id`;
      } else {
        backendUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
      }
    }
  }
  if (!backendUrl) backendUrl = 'https://api.abstech.web.id';
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${backendUrl}${cleanPath}`;
}

/**
 * Otomatis memformat angka input dengan pemisah ribuan (.) dan desimal (,)
 * e.g. "28000" -> "28.000", "28000,50" -> "28.000,50"
 */
export function formatCurrencyInput(val: string | number | null | undefined): string {
  if (val === '' || val === null || val === undefined) return '';
  const str = String(val);

  // Periksa apakah terdapat koma desimal
  const hasComma = str.includes(',');
  const parts = str.split(',');
  const intPart = parts[0].replace(/\D/g, '');
  const decPart = parts.length > 1 ? parts[1].replace(/\D/g, '').slice(0, 2) : null;

  if (!intPart && decPart === null) return '';

  const formattedInt = intPart ? new Intl.NumberFormat('id-ID').format(BigInt(intPart)) : '0';

  if (hasComma) {
    return decPart !== null ? `${formattedInt},${decPart}` : `${formattedInt},`;
  }
  return formattedInt;
}

/**
 * Mengubah string terformat ribuan/desimal kembali ke angka numerik
 * e.g. "28.000" -> 28000, "28.000,50" -> 28000.5
 */
export function parseCurrencyInput(val: string | number | null | undefined): number {
  if (val === '' || val === null || val === undefined) return 0;
  const str = String(val);
  const cleanStr = str.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Mengubah angka rupiah ke kalimat terbilang Indonesia
 * e.g. 28000 -> "Dua puluh delapan ribu rupiah"
 */
export function terbilangRupiah(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return 'Nol rupiah';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function bilang(x: number): string {
    if (x < 12) return satuan[x];
    if (x < 20) return bilang(x - 10) + ' Belas';
    if (x < 100) return bilang(Math.floor(x / 10)) + ' Puluh' + (x % 10 !== 0 ? ' ' + bilang(x % 10) : '');
    if (x < 200) return 'Seratus' + (x % 100 !== 0 ? ' ' + bilang(x % 100) : '');
    if (x < 1000) return bilang(Math.floor(x / 100)) + ' Ratus' + (x % 100 !== 0 ? ' ' + bilang(x % 100) : '');
    if (x < 2000) return 'Seribu' + (x % 1000 !== 0 ? ' ' + bilang(x % 1000) : '');
    if (x < 1000000) return bilang(Math.floor(x / 1000)) + ' Ribu' + (x % 1000 !== 0 ? ' ' + bilang(x % 1000) : '');
    if (x < 1000000000) return bilang(Math.floor(x / 1000000)) + ' Juta' + (x % 1000000 !== 0 ? ' ' + bilang(x % 1000000) : '');
    return bilang(Math.floor(x / 1000000000)) + ' Miliar' + (x % 1000000000 !== 0 ? ' ' + bilang(x % 1000000000) : '');
  }

  return bilang(n).trim() + ' rupiah';
}

