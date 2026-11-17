package id.web.abstech.cafe;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "BluetoothPrinter")
public class BluetoothPrinterPlugin extends Plugin {
    // Standard Serial Port Profile (SPP) UUID for Bluetooth thermal printers
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter bluetoothAdapter = null;
    private BluetoothSocket currentSocket = null;
    private OutputStream currentOutputStream = null;
    private String connectedAddress = null;
    private String connectedName = null;

    @Override
    public void load() {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    }

    @PluginMethod
    public void listPairedDevices(PluginCall call) {
        if (bluetoothAdapter == null) {
            call.reject("Perangkat ini tidak memiliki Bluetooth adapter.");
            return;
        }

        if (!bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth tidak aktif. Silakan nyalakan Bluetooth di pengaturan tablet/HP.");
            return;
        }

        try {
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            JSArray deviceList = new JSArray();

            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSObject dev = new JSObject();
                    dev.put("name", device.getName() != null ? device.getName() : "Printer Bluetooth");
                    dev.put("address", device.getAddress());
                    dev.put("type", device.getType());
                    deviceList.put(dev);
                }
            }

            JSObject ret = new JSObject();
            ret.put("devices", deviceList);
            call.resolve(ret);
        } catch (SecurityException e) {
            call.reject("Izin akses Bluetooth ditolak: " + e.getMessage());
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Alamat MAC printer tidak boleh kosong.");
            return;
        }

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth mati.");
            return;
        }

        disconnectInternal();

        new Thread(() -> {
            try {
                BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
                if (device == null) {
                    call.reject("Printer dengan alamat " + address + " tidak ditemukan.");
                    return;
                }

                BluetoothSocket socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                bluetoothAdapter.cancelDiscovery();
                socket.connect();

                currentSocket = socket;
                currentOutputStream = socket.getOutputStream();
                connectedAddress = address;
                connectedName = device.getName() != null ? device.getName() : "Printer Bluetooth";

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("name", connectedName);
                ret.put("address", connectedAddress);
                call.resolve(ret);
            } catch (Exception e) {
                disconnectInternal();
                call.reject("Gagal menghubungkan ke printer: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    private synchronized void disconnectInternal() {
        if (currentOutputStream != null) {
            try { currentOutputStream.close(); } catch (Exception ignored) {}
            currentOutputStream = null;
        }
        if (currentSocket != null) {
            try { currentSocket.close(); } catch (Exception ignored) {}
            currentSocket = null;
        }
        connectedAddress = null;
        connectedName = null;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        boolean isConnected = currentSocket != null && currentSocket.isConnected();
        JSObject ret = new JSObject();
        ret.put("connected", isConnected);
        ret.put("name", connectedName != null ? connectedName : "");
        ret.put("address", connectedAddress != null ? connectedAddress : "");
        call.resolve(ret);
    }

    @PluginMethod
    public void printRaw(PluginCall call) {
        String base64Data = call.getString("data");
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Data cetak kosong.");
            return;
        }

        if (currentSocket == null || !currentSocket.isConnected() || currentOutputStream == null) {
            call.reject("Printer belum terhubung. Silakan hubungkan printer terlebih dahulu.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            currentOutputStream.write(bytes);
            currentOutputStream.flush();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (IOException e) {
            disconnectInternal();
            call.reject("Gagal mencetak: " + e.getMessage());
        }
    }
}
