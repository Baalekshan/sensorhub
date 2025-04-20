# ESP32 Bluetooth Onboarding Integration

This document provides an overview of the ESP32 Bluetooth onboarding integration, including all components and how they work together.

## Overview

The ESP32 Bluetooth onboarding feature allows users to easily add and configure ESP32 devices directly from the web interface using Web Bluetooth API. The implementation includes:

1. **ESP32 Firmware**: Handles Bluetooth advertisement, sensor detection, profile management, and data streaming
2. **Android Simulator App**: Simulates ESP32 behavior for testing without physical hardware
3. **Web Frontend**: Provides UI for scanning, connecting, configuring, and flashing profiles
4. **Backend**: Manages device registration, configuration, and data streaming

## Component Architecture

```
┌───────────────────┐            ┌───────────────────┐
│                   │            │                   │
│   ESP32 Device    │◄──BLE─────►│   Web Browser     │
│   (Real/Simulated)│            │   (Frontend)      │
│                   │            │                   │
└───────────────────┘            └──────────┬────────┘
                                            │
                                            │ HTTP/WS
                                            ▼
                                 ┌──────────────────────┐
                                 │                      │
                                 │   NestJS Backend     │
                                 │                      │
                                 └──────────────────────┘
```

## 1. ESP32 Firmware

### Key Features

- **BLE GATT Server** with standardized UUIDs and characteristics
- **Auto-sensor detection** using I2C bus scanning and sensor signatures
- **Profile management** allowing wireless configuration
- **Live data streaming** of sensor readings

### GATT Service Structure

- **Service UUID**: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
- **Characteristics**:
  - **Device Info** (UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8): READ
  - **Sensor Info** (UUID: 2a1f7dcd-8fc4-45ab-b81b-5391c6c29926): READ
  - **Profile** (UUID: 35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e): WRITE
  - **Live Data** (UUID: d6c94056-6996-4fed-a6e4-d58c38f57eed): NOTIFY
  - **Command** (UUID: 1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108): WRITE

### Sensor Recognition

The firmware scans for I2C devices and identifies them based on known address patterns and register contents. It currently supports:
- BME280 (Temperature/Humidity/Pressure)
- HDC1080 (Temperature/Humidity)
- SHT31 (Temperature/Humidity)
- CCS811 (Air Quality)
- BH1750 (Light)
- TSL2591 (Light)
- MPU6050 (Accelerometer/Gyroscope)
- Analog temperature sensors

## 2. Android Simulator App

### Purpose

The simulator app mimics the behavior of an ESP32 device for development and testing without physical hardware.

### Features

- Acts as a BLE peripheral with the same GATT service and characteristics
- Simulates sensor data for all supported sensor types
- Processes profile configurations and commands
- Streams simulated sensor readings

### Implementation

- Uses Android Bluetooth LE API to advertise and respond to connections
- Manages the same GATT service structure as the ESP32 firmware
- Provides UI controls for advertising and streaming

## 3. Web Frontend

### Onboarding Flow

1. **Scan**: User initiates scanning for nearby ESP32 devices
2. **Connect**: User selects and connects to a device
3. **Configure**: Detected sensors are displayed or manual configuration is provided
4. **Profile**: User selects an appropriate profile based on sensors
5. **Flash**: Selected profile is flashed to the device
6. **Review**: User reviews the configuration before finishing
7. **Stream**: Device begins streaming data to the backend

### Key Components

- **device-list.tsx**: Displays available Bluetooth devices
- **sensor-config-form.tsx**: Handles sensor configuration
- **profile-selector.tsx**: Allows selection of predefined profiles
- **device-configuration.tsx**: Shows the final device configuration

### Custom Hooks

- **useDeviceOnboarding.ts**: Manages the entire onboarding process
  - Handles Bluetooth scanning, connection, and communication
  - Manages state transitions between onboarding steps
  - Communicates with the backend to register and configure devices

## 4. Backend (NestJS)

### API Endpoints

- **POST /devices/register**: Register a new device after onboarding
- **PUT /devices/:id/configure**: Update device configuration
- **POST /devices/:id/start-stream**: Begin listening to live data
- **GET /devices**: Get all registered devices
- **GET /devices/:id**: Get a specific device
- **DELETE /devices/:id**: Remove a device

### Data Models

- **Device**: Stores device information and links to sensors
  - ID, name, Bluetooth address, firmware version
  - Active profile, online status, last seen timestamp

- **Sensor**: Stores sensor information and readings
  - Device ID, sensor ID, type
  - Calibration status and data
  - Last value and timestamp

### WebSocket Integration

The backend provides a WebSocket gateway for real-time data streaming:
- Clients can subscribe to specific devices
- Data is forwarded to analytics and storage
- Connected clients receive real-time updates

## Data Flow

### Onboarding Process

1. Web app scans for and connects to ESP32 device via Web Bluetooth
2. App reads device info and sensor information
3. User configures sensors and selects a profile
4. App writes profile configuration to the device
5. Device applies the configuration and begins streaming
6. App registers the device with the backend
7. Backend prepares to receive data from the device

### Data Streaming

1. ESP32 reads sensor values at configured intervals
2. Device sends data via Bluetooth to connected web app
3. Web app forwards data to backend via HTTP or WebSocket
4. Backend stores readings and forwards to analytics
5. WebSocket clients receive real-time updates

## Integration Strategy

The integration strategy focuses on:

1. **Standardized Communication**: Using well-defined JSON structures for all communications
2. **Graceful Fallbacks**: Supporting manual configuration when auto-detection fails
3. **Modular Design**: Each component operates independently with clear interfaces
4. **Real-time Updates**: WebSockets provide immediate data feedback

## Testing Without Hardware

To test without physical ESP32 hardware:

1. Install and run the Android simulator app
2. Access the web app and initiate device scanning
3. Connect to the simulated device
4. Complete the onboarding process
5. Observe simulated data streaming

## Security Considerations

- Backend endpoints are protected with JWT authentication
- WebSocket connections require authentication tokens
- Data validation is performed at all levels
- Sensitive operations require proper authorization

## Future Improvements

1. Support for more sensor types
2. Enhanced profile management and custom profile creation
3. Firmware update capability over Bluetooth
4. Improved error handling and recovery mechanisms
5. More sophisticated auto-calibration algorithms 