# ESP32 Simulator Android App

This Android application simulates the behavior of an ESP32 device with Bluetooth capabilities for easier development and testing of web and mobile applications that interact with ESP32 devices.

## Features

1. **Bluetooth Low Energy (BLE) GATT Server**:
   - Simulates the exact same GATT profile as the real ESP32 firmware
   - Allows testing without physical ESP32 hardware

2. **Simulated Sensors**:
   - BME280 (Temperature/Humidity/Pressure)
   - HDC1080 (Humidity)
   - CCS811 (Air Quality)
   - BH1750 (Light)
   - Analog Temperature

3. **Full ESP32 Firmware Compatibility**:
   - Uses the same UUIDs for services and characteristics
   - Follows the same JSON data format for all communications
   - Supports the same commands and profile configurations

4. **Interactive UI**:
   - Toggle Bluetooth advertising
   - Toggle sensor data streaming
   - View connected devices
   - See current device status

## How to Use

1. **Installation**:
   - Build and install the app on an Android device (Android 6.0 or higher recommended)
   - Grant Bluetooth permissions when prompted

2. **Setup**:
   - Launch the app
   - Press "Start Advertising" to begin advertising as an ESP32 device
   - The device will appear as "ESP32-Sensor-Hub" in BLE scanners

3. **Connecting**:
   - Connect to the simulated device from your web app or other BLE client
   - The app will display when a client connects
   - Press "Start Streaming" to begin sending simulated sensor data

4. **Testing Features**:
   - Read device information
   - Read sensor information
   - Write profile configurations
   - Send commands like calibration or streaming control
   - Receive streaming sensor data

## GATT Service Structure

This simulator implements the same GATT service as the ESP32 firmware:

### Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b

With the following characteristics:

1. **Device Info** (UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8)
2. **Sensor Info** (UUID: 2a1f7dcd-8fc4-45ab-b81b-5391c6c29926)
3. **Profile** (UUID: 35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e)
4. **Live Data** (UUID: d6c94056-6996-4fed-a6e4-d58c38f57eed)
5. **Command** (UUID: 1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108)

## Requirements

- Android 6.0 (Marshmallow) or higher
- Device with Bluetooth Low Energy support
- Location permissions (required for Bluetooth scanning on Android)

## Development Notes

- For Android 12 (API level 31) and higher, you need `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, and `BLUETOOTH_CONNECT` permissions
- For older Android versions, you need `BLUETOOTH` and `BLUETOOTH_ADMIN` permissions
- The app simulates sensor data with random variations to mimic real sensor behavior 