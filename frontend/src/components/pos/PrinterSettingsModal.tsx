'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Settings,
  RefreshCw,
  Power,
  Sliders,
  DollarSign,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import PrinterManager, {
  BluetoothPrinterDevice,
  PrinterSettings,
} from '@/lib/printer/printer-manager';

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({
  isOpen,
  onClose,
}: PrinterSettingsModalProps) {
  const [settings, setSettings] = useState<PrinterSettings>(PrinterManager.getSettings());
  const [connected, setConnected] = useState(false);
  const [connectedName, setConnectedName] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [androidDevices, setAndroidDevices] = useState<BluetoothPrinterDevice[]>([]);
  const isCapacitor = PrinterManager.isCapacitor();
  const isWebBluetooth = PrinterManager.isWebBluetoothSupported();

  // Load status and paired devices on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      const current = PrinterManager.getSettings();
      setSettings(current);

      PrinterManager.getStatus().then((st) => {
        setConnected(st.connected);
        setConnectedName(st.name || current.name);
        setConnectedAddress(st.address || current.address);
      });

      if (isCapacitor) {
        loadAndroidPairedDevices();
      }
    }
  }, [isOpen, isCapacitor]);

  const loadAndroidPairedDevices = async () => {
    try {
      setLoading(true);
      const list = await PrinterManager.listAndroidPairedDevices();
      setAndroidDevices(list);
    } catch (e: any) {
      console.warn('Could not list paired devices', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCapacitor = async (device: BluetoothPrinterDevice) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await PrinterManager.connect(device.address, device.name);
      if (ok) {
        setConnected(true);
        setConnectedName(device.name);
        setConnectedAddress(device.address);
        setSuccessMsg(`Berhasil terhubung ke ${device.name}`);
      } else {
        setErrorMsg('Gagal terhubung ke printer.');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menghubungkan printer.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanWebBluetooth = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const dev = await PrinterManager.scanWebBluetoothDevice();
      const ok = await PrinterManager.connect(dev.address, dev.name);
      if (ok) {
        setConnected(true);
        setConnectedName(dev.name);
        setConnectedAddress(dev.address);
        setSuccessMsg(`Berhasil terhubung ke ${dev.name}`);
      }
    } catch (e: any) {
      if (!e?.message?.includes('dibatalkan')) {
        setErrorMsg(e?.message || 'Gagal mendeteksi printer Bluetooth.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await PrinterManager.disconnect();
      setConnected(false);
      setConnectedName('');
      setConnectedAddress('');
      setSuccessMsg('Printer berhasil diputuskan.');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal memutuskan printer.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await PrinterManager.testPrint({ paperWidth: settings.paperWidth });
      setSuccessMsg('Struk tes berhasil dicetak! Periksa printer Anda.');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal mencetak struk tes.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof PrinterSettings>(key: K, val: PrinterSettings[K]) => {
    const updated = PrinterManager.saveSettings({ [key]: val });
    if (updated) setSettings(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">Pengaturan Printer Thermal</h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    connected ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {connected ? 'Terhubung 🟢' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isCapacitor
                  ? 'Aplikasi Android Native • Mendukung Semua Printer Bluetooth'
                  : isWebBluetooth
                  ? 'Web Browser • Web Bluetooth (BLE 4.0+)'
                  : 'Web Browser Standar'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Status & Active Connection Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-700 uppercase tracking-wider text-[10px]">
                Koneksi Bluetooth
              </span>
              <div className="flex items-center gap-1.5 text-stone-500 font-medium">
                <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                <span>{isCapacitor ? 'Native Bluetooth' : 'Web Bluetooth'}</span>
              </div>
            </div>

            {connected ? (
              <div className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-900 truncate">{connectedName}</h4>
                    <p className="text-[10px] text-stone-400 truncate">{connectedAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={loading}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition active:scale-95 shadow-xs"
                  >
                    Tes Cetak
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
                    title="Putuskan Koneksi"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {isCapacitor ? (
                  <>
                    <p className="text-stone-500 text-[11px]">
                      Pilih printer yang sudah dipasangkan (*paired*) di pengaturan Bluetooth Android:
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {androidDevices.length === 0 ? (
                        <div className="p-3 bg-white rounded-xl border border-stone-200 text-center text-stone-400">
                          Belum ada printer Bluetooth yang dipasangkan. Buka Pengaturan Bluetooth tablet/HP dan hubungkan printer Anda terlebih dahulu.
                        </div>
                      ) : (
                        androidDevices.map((dev) => (
                          <div
                            key={dev.address}
                            className="p-2.5 bg-white border border-stone-200 rounded-xl flex items-center justify-between hover:border-orange-300 transition"
                          >
                            <div>
                              <p className="font-bold text-stone-800">{dev.name}</p>
                              <p className="text-[10px] text-stone-400 font-mono">{dev.address}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleConnectCapacitor(dev)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs active:scale-95 transition"
                            >
                              Hubungkan
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={loadAndroidPairedDevices}
                      disabled={loading}
                      className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>Segarkan Daftar Perangkat Paired</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center py-2 space-y-3">
                    <p className="text-stone-500 text-[11px]">
                      Nyalakan printer Bluetooth Anda dan pastikan Bluetooth browser aktif.
                    </p>
                    <button
                      type="button"
                      onClick={handleScanWebBluetooth}
                      disabled={loading}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-md shadow-orange-600/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>{loading ? 'Memindai...' : 'Pindai & Hubungkan Printer Bluetooth'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Format & Hardware Preferences */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <span className="font-black text-stone-700 uppercase tracking-wider text-[10px]">
              Format Struk & Hardware
            </span>

            {/* Paper Width Selector */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800 block">Lebar Kertas Thermal</span>
                <span className="text-[10px] text-stone-400">Pilih tipe kertas yang dipasang</span>
              </div>
              <div className="flex items-center bg-stone-200/80 p-1 rounded-xl gap-1">
                {(['58mm', '80mm'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateSetting('paperWidth', w)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                      settings.paperWidth === w
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {w} {w === '58mm' ? '(Standar)' : '(Lebar)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-200/60" />

            {/* Cash Drawer Kick Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800 block">Buka Laci Kasir Otomatis (RJ11)</span>
                <span className="text-[10px] text-stone-400">Kirim sinyal pulsa saat transaksi tunai</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoKickDrawer}
                onChange={(e) => updateSetting('autoKickDrawer', e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Android APK Promotion Card (If using web browser) */}
          {!isCapacitor && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-stone-900 text-xs">Gunakan Aplikasi Android POS (.APK)</h4>
                  <p className="text-[10px] text-stone-500">
                    Mendukung 100% semua printer Bluetooth murah (Classic SPP + BLE) & cetak lebih cepat.
                  </p>
                </div>
              </div>
              <a
                href="/downloads/CafePOS.apk"
                download="CafePOS.apk"
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-[11px] shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh APK</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/50">
          <span className="text-[10px] text-stone-400 font-medium">
            Cafe POS Thermal Engine v2.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
