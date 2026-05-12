package com.dcelup.kasir;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = { Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN }
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    private static final String BLUETOOTH_PERMISSION_ALIAS = "bluetooth";
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    @PluginMethod
    public void getPairedPrinters(PluginCall call) {
        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter == null) {
            call.reject("Bluetooth is not supported on this device");
            return;
        }
        if (!hasBluetoothPermission()) {
            call.reject("Bluetooth permission not granted");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("Bluetooth is disabled");
            return;
        }

        JSArray printers = new JSArray();
        Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
        for (BluetoothDevice device : bondedDevices) {
            JSObject printer = new JSObject();
            printer.put("id", device.getAddress());
            printer.put("name", device.getName() != null ? device.getName() : "Unknown Printer");
            printer.put("address", device.getAddress());
            printers.put(printer);
        }

        JSObject result = new JSObject();
        result.put("printers", printers);
        result.put("enabled", true);
        call.resolve(result);
    }

    @PluginMethod
    public void print(PluginCall call) {
        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter == null) {
            call.reject("Bluetooth is not supported on this device");
            return;
        }
        if (!hasBluetoothPermission()) {
            call.reject("Bluetooth permission not granted");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("Bluetooth is disabled");
            return;
        }

        String address = call.getString("address");
        String payload = call.getString("payload");
        String encoding = call.getString("encoding", "CP437");

        if (address == null || address.trim().isEmpty()) {
            call.reject("Printer address is required");
            return;
        }
        if (payload == null) {
            call.reject("Print payload is required");
            return;
        }

        BluetoothDevice device = findBondedDevice(adapter, address);
        if (device == null) {
            call.reject("Printer is not paired with this device");
            return;
        }

        getBridge().execute(() -> {
            if (adapter.isDiscovering()) {
                adapter.cancelDiscovery();
            }

            Charset charset;
            try {
                charset = Charset.forName(encoding);
            } catch (Exception ignored) {
                charset = StandardCharsets.ISO_8859_1;
            }

            try (BluetoothSocket socket = device.createRfcommSocketToServiceRecord(SPP_UUID)) {
                socket.connect();
                try (OutputStream outputStream = socket.getOutputStream()) {
                    outputStream.write(payload.getBytes(charset));
                    outputStream.flush();
                }
                call.resolve();
            } catch (Exception exception) {
                call.reject("Failed to print: " + exception.getMessage(), exception);
            }
        });
    }

    @PluginMethod
    public void prepare(PluginCall call) {
        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter == null) {
            call.reject("Bluetooth is not supported on this device");
            return;
        }

        if (!hasBluetoothPermission()) {
            requestPermissionForAlias(BLUETOOTH_PERMISSION_ALIAS, call, "permissionsCallback");
            return;
        }

        resolveBluetoothState(call, adapter);
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        BluetoothAdapter adapter = getBluetoothAdapter();
        if (adapter == null) {
            call.reject("Bluetooth is not supported on this device");
            return;
        }
        if (!hasBluetoothPermission()) {
            call.reject("Bluetooth permission not granted");
            return;
        }

        resolveBluetoothState(call, adapter);
    }

    private BluetoothAdapter getBluetoothAdapter() {
        BluetoothManager bluetoothManager =
            (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return bluetoothManager != null ? bluetoothManager.getAdapter() : null;
    }

    private boolean hasBluetoothPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }
        return getPermissionState(BLUETOOTH_PERMISSION_ALIAS) == PermissionState.GRANTED;
    }

    private BluetoothDevice findBondedDevice(BluetoothAdapter adapter, String address) {
        Set<BluetoothDevice> bondedDevices = adapter.getBondedDevices();
        for (BluetoothDevice device : bondedDevices) {
            if (address.equalsIgnoreCase(device.getAddress())) {
                return device;
            }
        }
        return null;
    }

    private void resolveBluetoothState(PluginCall call, BluetoothAdapter adapter) {
        JSObject result = new JSObject();
        result.put("granted", true);
        result.put("enabled", adapter.isEnabled());
        result.put("permission", getPermissionState(BLUETOOTH_PERMISSION_ALIAS).toString());
        call.resolve(result);
    }
}
