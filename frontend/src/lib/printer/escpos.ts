/**
 * ESC/POS Binary Command Generator for Thermal Receipt Printers
 * Supports 58mm (32 chars) & 80mm (48 chars) thermal printers
 */

export interface ReceiptOptions {
  paperWidth?: '58mm' | '80mm';
  kickDrawer?: boolean;
  cutPaper?: boolean;
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private lineWidth: number;

  constructor(paperWidth: '58mm' | '80mm' = '58mm') {
    this.lineWidth = paperWidth === '80mm' ? 48 : 32;
    this.init();
  }

  // Initialize printer
  init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  // Text alignment
  align(align: 'left' | 'center' | 'right'): this {
    const code = align === 'center' ? 1 : align === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, code);
    return this;
  }

  // Bold text
  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  // Double size text
  doubleSize(enable: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  // Double height only
  doubleHeight(enable: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x01 : 0x00);
    return this;
  }

  // Print plain text with UTF-8 to ASCII/CodePage fallback
  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128) {
        this.buffer.push(code);
      } else {
        // Map common non-ascii chars or replace with space
        this.buffer.push(0x20);
      }
    }
    return this;
  }

  // Print text with newline
  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0a);
    return this;
  }

  // Print blank lines
  feed(n: number = 1): this {
    for (let i = 0; i < n; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  // Separator line
  separator(char: string = '-'): this {
    this.line(char.repeat(this.lineWidth));
    return this;
  }

  // Two columns row (e.g. Left Title, Right Value)
  twoColumns(left: string, right: string): this {
    const leftTrim = left.trim();
    const rightTrim = right.trim();
    const spacesNeeded = this.lineWidth - leftTrim.length - rightTrim.length;

    if (spacesNeeded < 1) {
      // If text is too long, truncate left or wrap
      const maxLeft = this.lineWidth - rightTrim.length - 1;
      this.line(leftTrim.slice(0, maxLeft) + ' ' + rightTrim);
    } else {
      this.line(leftTrim + ' '.repeat(spacesNeeded) + rightTrim);
    }
    return this;
  }

  // Kick cash drawer pulse via RJ11 (pin 2 & 5)
  kickCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  // Cut paper (partial or full cut)
  cut(): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  // Get raw bytes as Uint8Array
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  // Get as Base64 string (useful for native Android bridge)
  toBase64(): string {
    const bytes = this.getBytes();
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Format Order Receipt to ESC/POS bytes
 */
export function generateOrderReceiptEscPos(
  order: any,
  options: ReceiptOptions = {}
): Uint8Array {
  const paperWidth = options.paperWidth || '58mm';
  const builder = new EscPosBuilder(paperWidth);

  const outletName = order.outlet?.name || order.outlet?.company?.name || 'CAFE & RESTO';
  const outletAddress = order.outlet?.address || '';
  const outletPhone = order.outlet?.phone || '';
  const orderNumber = order.orderNumber || '-';
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
  const tableNum = order.table?.tableNumber ? `Meja #${order.table.tableNumber}` : order.tableId ? `Meja` : 'Take Away';
  const customerName = order.customerName || 'Pelanggan';
  const cashierName = order.createdBy?.fullName || 'Kasir';

  // Header
  builder.align('center');
  builder.bold(true).doubleSize(true).line(outletName).doubleSize(false);
  if (outletAddress) builder.line(outletAddress);
  if (outletPhone) builder.line(`Telp: ${outletPhone}`);
  builder.bold(false);
  builder.separator('=');

  // Order Info
  builder.align('left');
  builder.twoColumns('No. Pesanan:', orderNumber);
  builder.twoColumns('Waktu:', dateStr);
  builder.twoColumns('Tipe:', `${tableNum} (${order.orderType || 'DINE IN'})`);
  builder.twoColumns('Pelanggan:', customerName);
  builder.twoColumns('Kasir:', cashierName);
  builder.separator('-');

  // Items List
  builder.bold(true);
  builder.twoColumns('MENU', 'TOTAL');
  builder.bold(false);
  builder.separator('-');

  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      const name = item.product?.name || item.name || 'Item';
      const qty = item.quantity || 1;
      const price = Number(item.price || item.unitPrice || 0);
      const subtotal = Number(item.subtotal || qty * price);

      builder.line(name);
      builder.twoColumns(`  ${qty} x ${price.toLocaleString('id-ID')}`, subtotal.toLocaleString('id-ID'));

      // Modifiers if any
      if (Array.isArray(item.modifiers) && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          const modName = mod.modifierOption?.name || mod.name || '';
          const modPrice = Number(mod.price || 0);
          if (modName) {
            builder.twoColumns(`   + ${modName}`, modPrice > 0 ? modPrice.toLocaleString('id-ID') : '');
          }
        }
      }

      if (item.notes) {
        builder.line(`   *Catatan: ${item.notes}`);
      }
    }
  }

  builder.separator('-');

  // Totals
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discountAmount || 0);
  const tax = Number(order.taxAmount || 0);
  const service = Number(order.serviceChargeAmount || 0);
  const total = Number(order.totalAmount || 0);
  const paid = Number(order.paidAmount || total);
  const change = Math.max(0, paid - total);

  builder.twoColumns('Subtotal:', `Rp ${subtotal.toLocaleString('id-ID')}`);
  if (discount > 0) builder.twoColumns('Diskon:', `-Rp ${discount.toLocaleString('id-ID')}`);
  if (service > 0) builder.twoColumns('Service Charge:', `Rp ${service.toLocaleString('id-ID')}`);
  if (tax > 0) builder.twoColumns('Pajak (PB1):', `Rp ${tax.toLocaleString('id-ID')}`);

  builder.separator('=');
  builder.bold(true).doubleHeight(true);
  builder.twoColumns('TOTAL:', `Rp ${total.toLocaleString('id-ID')}`);
  builder.doubleHeight(false).bold(false);
  builder.separator('-');

  // Payment Breakdown
  const paymentMethod = order.paymentMethod || order.payments?.[0]?.method || 'CASH';
  const methodLabel = paymentMethod === 'BORDERPAY' || paymentMethod === 'QRIS' ? 'QRIS (BorderPay)' : paymentMethod;
  builder.twoColumns('Metode Bayar:', methodLabel);
  builder.twoColumns('Bayar:', `Rp ${paid.toLocaleString('id-ID')}`);
  if (paymentMethod === 'CASH') {
    builder.twoColumns('Kembali:', `Rp ${change.toLocaleString('id-ID')}`);
  }

  // Footer
  builder.separator('-');
  builder.align('center');
  builder.line('Terima Kasih Atas Kunjungan Anda!');
  builder.line('Silakan Datang Kembali');
  builder.feed(1);

  // Cash drawer kick if enabled
  if (options.kickDrawer && paymentMethod === 'CASH') {
    builder.kickCashDrawer();
  }

  // Cut paper
  builder.cut();

  return builder.getBytes();
}

/**
 * Format Shift Summary (Z-Report) to ESC/POS bytes
 */
export function generateShiftReceiptEscPos(
  shiftData: any,
  options: ReceiptOptions = {}
): Uint8Array {
  const paperWidth = options.paperWidth || '58mm';
  const builder = new EscPosBuilder(paperWidth);

  const shift = shiftData.shift || {};
  const summary = shiftData.summary || {};
  const cashierName = shift.cashier?.fullName || 'Kasir';
  const shiftName = shift.shiftName || 'Shift Kasir';
  const startTime = shift.startTime ? new Date(shift.startTime).toLocaleString('id-ID') : '-';
  const endTime = new Date().toLocaleString('id-ID');

  builder.align('center');
  builder.bold(true).doubleSize(true).line('REKAP SHIFT').doubleSize(false);
  builder.line('(Z-REPORT KASIR)');
  builder.bold(false);
  builder.separator('=');

  builder.align('left');
  builder.twoColumns('Nama Shift:', shiftName);
  builder.twoColumns('Kasir:', cashierName);
  builder.twoColumns('Mulai:', startTime);
  builder.twoColumns('Tutup:', endTime);
  builder.separator('-');

  // 1. Kas Laci
  builder.bold(true).line('1. KAS LACI (UANG TUNAI FISIK)');
  builder.bold(false);
  const initialCash = Number(summary.initialCash || shift.initialCash || 0);
  const totalCash = Number(summary.totalCash || 0);
  const expectedCash = Number(summary.expectedCash || initialCash + totalCash);
  const actualCash = shiftData.actualCash !== null && shiftData.actualCash !== undefined ? Number(shiftData.actualCash) : null;

  builder.twoColumns('Modal Awal:', `Rp ${initialCash.toLocaleString('id-ID')}`);
  builder.twoColumns('Penjualan Tunai:', `Rp ${totalCash.toLocaleString('id-ID')}`);
  builder.twoColumns('Target Laci:', `Rp ${expectedCash.toLocaleString('id-ID')}`);
  if (actualCash !== null) {
    const diff = actualCash - expectedCash;
    builder.twoColumns('Uang Dihitung:', `Rp ${actualCash.toLocaleString('id-ID')}`);
    builder.bold(true);
    builder.twoColumns('Selisih Kas:', `${diff >= 0 ? '+' : ''}Rp ${diff.toLocaleString('id-ID')}`);
    builder.bold(false);
  }

  builder.separator('-');

  // 2. Non Tunai
  builder.bold(true).line('2. PENERIMAAN NON-TUNAI (BANK/QRIS)');
  builder.bold(false);

  const breakdown = summary.paymentBreakdown || {};
  const qrisCount = breakdown['QRIS']?.count ?? breakdown['BORDERPAY']?.count ?? 0;
  const qrisTotal = breakdown['QRIS']?.total ?? breakdown['BORDERPAY']?.total ?? 0;
  const debitCount = breakdown['DEBIT_CARD']?.count ?? 0;
  const debitTotal = breakdown['DEBIT_CARD']?.total ?? 0;
  const transferCount = breakdown['BANK_TRANSFER']?.count ?? 0;
  const transferTotal = breakdown['BANK_TRANSFER']?.total ?? 0;
  const totalNonCash = Number(summary.totalNonCash || 0);

  builder.twoColumns(`QRIS BorderPay (${qrisCount}x):`, `Rp ${Number(qrisTotal).toLocaleString('id-ID')}`);
  if (debitCount > 0) builder.twoColumns(`Debit EDC (${debitCount}x):`, `Rp ${Number(debitTotal).toLocaleString('id-ID')}`);
  if (transferCount > 0) builder.twoColumns(`Transfer (${transferCount}x):`, `Rp ${Number(transferTotal).toLocaleString('id-ID')}`);
  builder.twoColumns('Total Non-Tunai:', `Rp ${totalNonCash.toLocaleString('id-ID')}`);

  builder.separator('=');

  // Total Omzet
  const totalSales = Number(summary.totalSales || 0);
  const ordersCount = Number(summary.ordersCount || 0);
  builder.bold(true).doubleHeight(true);
  builder.twoColumns('TOTAL OMZET:', `Rp ${totalSales.toLocaleString('id-ID')}`);
  builder.doubleHeight(false).bold(false);
  builder.twoColumns('Total Transaksi:', `${ordersCount} pesanan`);

  if (shiftData.notes) {
    builder.separator('-');
    builder.line(`Catatan: ${shiftData.notes}`);
  }

  builder.separator('-');
  builder.align('center');
  builder.line('-- Dicetak dari Cafe POS --');
  builder.feed(1);
  builder.cut();

  return builder.getBytes();
}

/**
 * Format Test Receipt to verify printer
 */
export function generateTestReceiptEscPos(options: ReceiptOptions = {}): Uint8Array {
  const paperWidth = options.paperWidth || '58mm';
  const builder = new EscPosBuilder(paperWidth);

  builder.align('center');
  builder.bold(true).doubleSize(true).line('TEST PRINT').doubleSize(false);
  builder.line('CAFE POS PRINTER BERHASIL');
  builder.bold(false);
  builder.separator('=');
  builder.align('left');
  builder.line(`Waktu: ${new Date().toLocaleString('id-ID')}`);
  builder.line(`Ukuran Kertas: ${paperWidth}`);
  builder.line('Koneksi: Bluetooth Thermal Printer');
  builder.separator('-');
  builder.twoColumns('Status Printer:', 'ONLINE OK');
  builder.twoColumns('Kecepatan:', 'INSTAN');
  builder.separator('=');
  builder.align('center');
  builder.line('Printer Siap Digunakan Kasir!');
  builder.feed(1);
  builder.cut();

  return builder.getBytes();
}
