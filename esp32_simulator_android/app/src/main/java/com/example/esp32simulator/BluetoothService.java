package com.example.esp32simulator;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;

import com.google.gson.Gson;

import java.util.UUID;

public class BluetoothService {
    private static final String TAG = "BluetoothService";
    private static final String DEVICE_NAME = "V25";
    private static final UUID SERVICE_UUID = UUID.fromString("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
    private static final UUID DEVICE_INFO_CHAR_UUID = UUID.fromString("beb5483e-36e1-4688-b7f5-ea07361b26a8");
    private static final UUID SENSOR_INFO_CHAR_UUID = UUID.fromString("beb5483e-36e1-4688-b7f5-ea07361b26a9");
    private static final UUID SENSOR_DATA_CHAR_UUID = UUID.fromString("beb5483e-36e1-4688-b7f5-ea07361b26aa");
    private static final UUID CCCD_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    private Context context;
    private BluetoothManager bluetoothManager;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothGattServer gattServer;
    private BluetoothLeAdvertiser advertiser;
    private Gson gson;

    public BluetoothService(Context context) {
        this.context = context;
        this.gson = new Gson();
        initializeBluetooth();
    }

    private void initializeBluetooth() {
        bluetoothManager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        bluetoothAdapter = bluetoothManager.getAdapter();
    }

    public void startAdvertising() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Log.e(TAG, "Bluetooth is not enabled");
            return;
        }

        advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            Log.e(TAG, "Bluetooth LE Advertiser is not supported");
            return;
        }

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_BALANCED)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
                .setConnectable(true)
                .build();

        AdvertiseData data = new AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .addServiceUuid(new ParcelUuid(SERVICE_UUID))
                .build();

        advertiser.startAdvertising(settings, data, advertiseCallback);
    }

    private AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            Log.i(TAG, "LE Advertise Started.");
            setupGattServer();
        }

        @Override
        public void onStartFailure(int errorCode) {
            Log.e(TAG, "Advertising onStartFailure: " + errorCode);
        }
    };

    private void setupGattServer() {
        gattServer = bluetoothManager.openGattServer(context, gattServerCallback);

        // Create the service
        BluetoothGattService service = new BluetoothGattService(SERVICE_UUID,
                BluetoothGattService.SERVICE_TYPE_PRIMARY);

        // Device Info Characteristic
        BluetoothGattCharacteristic deviceInfoChar = new BluetoothGattCharacteristic(
                DEVICE_INFO_CHAR_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ);

        // Sensor Info Characteristic
        BluetoothGattCharacteristic sensorInfoChar = new BluetoothGattCharacteristic(
                SENSOR_INFO_CHAR_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ | BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ);

        // Sensor Data Characteristic
        BluetoothGattCharacteristic sensorDataChar = new BluetoothGattCharacteristic(
                SENSOR_DATA_CHAR_UUID,
                BluetoothGattCharacteristic.PROPERTY_NOTIFY | BluetoothGattCharacteristic.PROPERTY_READ,
                BluetoothGattCharacteristic.PERMISSION_READ);

        // Add CCCD descriptors
        BluetoothGattDescriptor deviceInfoCccd = new BluetoothGattDescriptor(CCCD_UUID,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE);
        deviceInfoChar.addDescriptor(deviceInfoCccd);

        BluetoothGattDescriptor sensorInfoCccd = new BluetoothGattDescriptor(CCCD_UUID,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE);
        sensorInfoChar.addDescriptor(sensorInfoCccd);

        BluetoothGattDescriptor sensorDataCccd = new BluetoothGattDescriptor(CCCD_UUID,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE);
        sensorDataChar.addDescriptor(sensorDataCccd);

        service.addCharacteristic(deviceInfoChar);
        service.addCharacteristic(sensorInfoChar);
        service.addCharacteristic(sensorDataChar);

        gattServer.addService(service);
    }

    private BluetoothGattServerCallback gattServerCallback = new BluetoothGattServerCallback() {
        @Override
        public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.i(TAG, "Device connected: " + device.getAddress());
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.i(TAG, "Device disconnected: " + device.getAddress());
            }
        }

        @Override
        public void onCharacteristicReadRequest(BluetoothDevice device, int requestId, int offset,
                                              BluetoothGattCharacteristic characteristic) {
            if (characteristic.getUuid().equals(DEVICE_INFO_CHAR_UUID)) {
                String deviceInfo = gson.toJson(new DeviceInfo());
                characteristic.setValue(deviceInfo.getBytes());
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset,
                        characteristic.getValue());
            } else if (characteristic.getUuid().equals(SENSOR_INFO_CHAR_UUID)) {
                String sensorInfo = gson.toJson(new SensorInfo());
                characteristic.setValue(sensorInfo.getBytes());
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset,
                        characteristic.getValue());
            }
        }

        @Override
        public void onDescriptorWriteRequest(BluetoothDevice device, int requestId,
                                           BluetoothGattDescriptor descriptor, boolean preparedWrite,
                                           boolean responseNeeded, int offset, byte[] value) {
            if (descriptor.getUuid().equals(CCCD_UUID)) {
                boolean notificationsEnabled = (value[0] & 0x01) != 0;
                if (notificationsEnabled) {
                    // Start sending notifications
                    startNotifications(descriptor.getCharacteristic());
                } else {
                    // Stop sending notifications
                    stopNotifications(descriptor.getCharacteristic());
                }
                if (responseNeeded) {
                    gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
                }
            }
        }
    };

    private void startNotifications(BluetoothGattCharacteristic characteristic) {
        // Implement notification logic here
        // This is where you would start sending periodic updates
    }

    private void stopNotifications(BluetoothGattCharacteristic characteristic) {
        // Implement stop notification logic here
    }

    public void stop() {
        if (advertiser != null) {
            advertiser.stopAdvertising(advertiseCallback);
        }
        if (gattServer != null) {
            gattServer.close();
        }
    }

    // Device Info JSON model
    private static class DeviceInfo {
        String name = "V25";
        String version = "1.0.0";
        String model = "ESP32-Simulator";
        String status = "success";
        String message = "Device info retrieved successfully";
    }

    // Sensor Info JSON model
    private static class SensorInfo {
        Sensor[] sensors = {
            new Sensor("temp1", "BME280", true, true),
            new Sensor("humid1", "HDC1080", true, true)
        };
    }

    private static class Sensor {
        String id;
        String type;
        boolean isCalibrated;
        boolean isActive;

        Sensor(String id, String type, boolean isCalibrated, boolean isActive) {
            this.id = id;
            this.type = type;
            this.isCalibrated = isCalibrated;
            this.isActive = isActive;
        }
    }
} 