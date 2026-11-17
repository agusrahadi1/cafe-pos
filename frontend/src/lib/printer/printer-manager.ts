'use client';

import {
  generateOrderReceiptEscPos,
  generateShiftReceiptEscPos,
  generateTestReceiptEscPos,
  ReceiptOptions,
} from './escpos';

export interface BluetoothPrinterDevice {
  name: string;
  address: string; // MAC address (Android) or Device UUID (Web Bluetooth)
  type?: string;
}

export interface PrinterSettings {
  name: string;
  address: string;
  paperWidth: '58mm' | '80mm';
  autoKickDrawer: boolean;
  autoPrintOnSuccess: boolean;
  platform: 'capacitor' | 'web-bluetooth' | 'browser';
}

const SETTINGS_KEY = 'cafe_pos_printer_settings';

// Web Bluetooth active GATT objects
let webBluetoothDevice: any = null;
let webBluetoothCharacteristic: any = null;

class PrinterManagerService {
  private currentConnectedPrinter: BluetoothPrinterDevice | null = null;

  /**
   * Check if running inside Capacitor Android APK
   */
  isCapacitor(): boolean {
    if (typeof window === 'undefined') return false;
    const cap = (window as any).Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  }

  /**
   * Check if Web Bluetooth is available in browser (Chrome / Edge)
   */
  isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Get saved printer configuration from localStorage
   */
  getSettings(): PrinterSettings {
    const defaults: PrinterSettings = {
      name: '',
      address: '',
      paperWidth: '58mm',
      autoKickDrawer: true,
      autoPrintOnSuccess: false,
      platform: this.isCapacitor() ? 'capacitor' : 'web-bluetooth',
    };

    if (typeof window === 'undefined') return defaults;

    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to read printer settings from storage', e);
    }
    return defaults;
  }

  /**
   * Save printer configuration to localStorage
   */
  saveSettings(settings: Partial<PrinterSettings>) {
    if (typeof window === 'undefined') return;
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * List all bonded/paired Bluetooth devices on Android (Capacitor)
   */
  async listAndroidPairedDevices(): Promise<BluetoothPrinterDevice[]> {
    if (!this.isCapacitor()) {
      throw new Error('Fitur ini hanya dapat digunakan pada aplikasi Android (.apk).');
    }

    const plugin = (window as any).Capacitor?.Plugins?.BluetoothPrinter;
    if (!plugin || !plugin.listPairedDevices) {
      throw new Error('Plugin BluetoothPrinter Android belum terdaftar.');
    }

    const res = await plugin.listPairedDevices();
    return (res.devices || []) as BluetoothPrinterDevice[];
  }

  /**
   * Scan & Pair Bluetooth device using Web Bluetooth API (Chrome Browser)
   */
  async scanWebBluetoothDevice(): Promise<BluetoothPrinterDevice> {
    if (!this.isWebBluetoothSupported()) {
      throw new Error('Browser ini tidak mendukung Web Bluetooth. Gunakan Google Chrome di Android atau PC.');
    }

    try {
      // Common thermal printer GATT service UUIDs:
      // 000018f0 (Standard printer), 49535343 (ISSC), e7810a71, 0000fff0, etc.
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'RPP' },
          { namePrefix: 'PT-' },
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'MTP' },
          { namePrefix: 'Panda' },
          { namePrefix: 'Iware' },
          { namePrefix: 'ZJ' },
          { namePrefix: 'Blue' },
          { namePrefix: 'BT' },
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000fff0-0000-1000-8000-00805f9b34fb',
        ],
      });

      if (!device) {
        throw new Error('Tidak ada perangkat yang dipilih.');
      }

      webBluetoothDevice = device;
      return {
        name: device.name || 'Printer Bluetooth',
        address: device.id,
        type: 'web-bluetooth',
      };
    } catch (err: any) {
      // Fallback: accept all devices if prefix filter failed
      if (err.name === 'NotFoundError') {
        throw new Error('Pencarian dibatalkan atau tidak ada printer yang dipilih.');
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '0000fff0-0000-1000-8000-00805f9b34fb',
        ],
      });

      webBluetoothDevice = device;
      return {
        name: device.name || 'Printer Bluetooth',
        address: device.id,
        type: 'web-bluetooth',
      };
    }
  }

  /**
   * Connect to printer by address
   */
  async connect(address: string, name?: string): Promise<boolean> {
    if (this.isCapacitor()) {
      const plugin = (window as any).Capacitor?.Plugins?.BluetoothPrinter;
      if (!plugin) throw new Error('Plugin Bluetooth Android belum siap.');
      const res = await plugin.connect({ address });
      if (res && res.success) {
        this.currentConnectedPrinter = { name: res.name || name || 'Printer', address };
        this.saveSettings({ address, name: this.currentConnectedPrinter.name });
        return true;
      }
      return false;
    } else if (this.isWebBluetoothSupported() && webBluetoothDevice) {
      const server = await webBluetoothDevice.gatt.connect();
      // Find writable characteristic in services
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            webBluetoothCharacteristic = char;
            this.currentConnectedPrinter = { name: webBluetoothDevice.name, address: webBluetoothDevice.id };
            this.saveSettings({ address: webBluetoothDevice.id, name: webBluetoothDevice.name });
            return true;
          }
        }
      }
      throw new Error('Karakteristik cetak printer tidak ditemukan pada perangkat ini.');
    }

    throw new Error('Platform tidak mendukung koneksi Bluetooth langsung.');
  }

  /**
   * Disconnect printer
   */
  async disconnect(): Promise<boolean> {
    if (this.isCapacitor()) {
      const plugin = (window as any).Capacitor?.Plugins?.BluetoothPrinter;
      if (plugin) await plugin.disconnect();
    } else if (webBluetoothDevice && webBluetoothDevice.gatt) {
      webBluetoothDevice.gatt.disconnect();
    }
    webBluetoothCharacteristic = null;
    this.currentConnectedPrinter = null;
    return true;
  }

  /**
   * Get active connection status
   */
  async getStatus(): Promise<{ connected: boolean; name: string; address: string }> {
    if (this.isCapacitor()) {
      const plugin = (window as any).Capacitor?.Plugins?.BluetoothPrinter;
      if (plugin && plugin.getStatus) {
        try {
          const res = await plugin.getStatus();
          if (res.connected) {
            this.currentConnectedPrinter = { name: res.name, address: res.address };
            return res;
          }
        } catch (e) {}
      }
    } else if (webBluetoothDevice && webBluetoothDevice.gatt?.connected && webBluetoothCharacteristic) {
      return {
        connected: true,
        name: webBluetoothDevice.name || 'Printer Bluetooth',
        address: webBluetoothDevice.id,
      };
    }

    return {
      connected: false,
      name: '',
      address: '',
    };
  }

  /**
   * Send raw binary bytes (ESC/POS) to printer
   */
  async printBytes(bytes: Uint8Array): Promise<boolean> {
    if (this.isCapacitor()) {
      const plugin = (window as any).Capacitor?.Plugins?.BluetoothPrinter;
      if (!plugin) throw new Error('Plugin Bluetooth Android tidak aktif.');

      // Convert Uint8Array to base64
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      const res = await plugin.printRaw({ data: base64Data });
      return !!(res && res.success);
    } else if (webBluetoothCharacteristic) {
      // Web Bluetooth chunking (max 512 bytes per write)
      const chunkSize = 100;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        if (webBluetoothCharacteristic.writeValueWithoutResponse) {
          await webBluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await webBluetoothCharacteristic.writeValue(chunk);
        }
        // Micro delay between chunks
        await new Promise((r) => setTimeout(r, 20));
      }
      return true;
    }

    throw new Error('Printer Bluetooth belum terhubung.');
  }

  /**
   * High-Level: Print Order Receipt
   */
  async printOrderReceipt(
    order: any,
    customOptions?: ReceiptOptions
  ): Promise<{ success: boolean; fallback?: boolean; message?: string }> {
    const settings = this.getSettings();
    const options: ReceiptOptions = {
      paperWidth: customOptions?.paperWidth || settings.paperWidth,
      kickDrawer: customOptions?.kickDrawer ?? settings.autoKickDrawer,
      cutPaper: customOptions?.cutPaper ?? true,
    };

    const status = await this.getStatus();
    if (!status.connected) {
      // Auto-reconnect if we have saved address in Capacitor
      if (this.isCapacitor() && settings.address) {
        try {
          await this.connect(settings.address, settings.name);
        } catch (e) {
          console.warn('Auto-reconnect failed, falling back to browser print', e);
        }
      }
    }

    const recheckStatus = await this.getStatus();
    if (recheckStatus.connected) {
      try {
        const bytes = generateOrderReceiptEscPos(order, options);
        await this.printBytes(bytes);
        return { success: true, message: `Struk dicetak ke ${recheckStatus.name}` };
      } catch (err: any) {
        console.error('Bluetooth print failed', err);
        return { success: false, fallback: true, message: err?.message || 'Gagal mengirim data ke printer' };
      }
    }

    // Fallback to browser dialog
    return { success: false, fallback: true, message: 'Printer Bluetooth belum terhubung.' };
  }

  /**
   * High-Level: Print Shift Summary (Z-Report)
   */
  async printShiftReceipt(
    shiftData: any,
    customOptions?: ReceiptOptions
  ): Promise<{ success: boolean; fallback?: boolean; message?: string }> {
    const settings = this.getSettings();
    const options: ReceiptOptions = {
      paperWidth: customOptions?.paperWidth || settings.paperWidth,
      kickDrawer: false,
      cutPaper: true,
    };

    const status = await this.getStatus();
    if (!status.connected && this.isCapacitor() && settings.address) {
      try {
        await this.connect(settings.address, settings.name);
      } catch (e) {}
    }

    const recheckStatus = await this.getStatus();
    if (recheckStatus.connected) {
      try {
        const bytes = generateShiftReceiptEscPos(shiftData, options);
        await this.printBytes(bytes);
        return { success: true, message: `Struk rekap shift dicetak ke ${recheckStatus.name}` };
      } catch (err: any) {
        return { success: false, fallback: true, message: err?.message || 'Gagal mencetak struk shift' };
      }
    }

    return { success: false, fallback: true, message: 'Printer Bluetooth belum terhubung.' };
  }

  /**
   * High-Level: Send Test Print
   */
  async testPrint(customOptions?: ReceiptOptions): Promise<{ success: boolean; message?: string }> {
    const settings = this.getSettings();
    const options: ReceiptOptions = {
      paperWidth: customOptions?.paperWidth || settings.paperWidth,
      kickDrawer: settings.autoKickDrawer,
      cutPaper: true,
    };

    const status = await this.getStatus();
    if (!status.connected) {
      throw new Error('Printer belum terhubung. Silakan hubungkan printer terlebih dahulu.');
    }

    const bytes = generateTestReceiptEscPos(options);
    await this.printBytes(bytes);
    return { success: true, message: 'Tes cetak berhasil dikirim!' };
  }
}

export const PrinterManager = new PrinterManagerService();
export default PrinterManager;
