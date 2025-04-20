# ESP32 Bluetooth Sensor Hub Firmware

This firmware turns an ESP32 device into a Bluetooth-enabled sensor hub that can detect connected sensors, receive profile configurations wirelessly, and stream live sensor data to a web or mobile application.

## GATT Service Structure

The firmware establishes a Bluetooth Low Energy (BLE) GATT server with the following structure:

### Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b

This service contains five characteristics:

1. **Device Info Characteristic** (UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8)
   - Properties: READ
   - Purpose: Provides basic information about the device
   - Format: JSON string with the following fields:
     ```json
     {
       "deviceId": "ESP32-[MAC_ADDRESS]",
       "name": "ESP32-Sensor-Hub",
       "firmwareVersion": "1.0.0",
       "freeMemory": 123456,
       "uptime": 3600
     }
     ```

2. **Sensor Info Characteristic** (UUID: 2a1f7dcd-8fc4-45ab-b81b-5391c6c29926)
   - Properties: READ
   - Purpose: Provides information about detected sensors
   - Format: JSON string with the following fields:
     ```json
     {
       "sensors": [
         {
           "id": "sensor0", 
           "type": "BME280", 
           "isCalibrated": false,
           "isActive": true
         },
         ...
       ]
     }
     ```

3. **Profile Characteristic** (UUID: 35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e)
   - Properties: WRITE
   - Purpose: Receives profile configurations to be applied to the device
   - Format: JSON string with the following fields:
     ```json
     {
       "name": "Temperature Monitoring",
       "sensors": [
         {
           "id": "sensor0",
           "active": true,
           "calibrationOffset": 0.0,
           "calibrationMultiplier": 1.0,
           "isCalibrated": true
         },
         ...
       ],
       "sampling": {
         "interval": 1000
       }
     }
     ```

4. **Live Data Characteristic** (UUID: d6c94056-6996-4fed-a6e4-d58c38f57eed)
   - Properties: NOTIFY
   - Purpose: Streams live sensor data
   - Format: JSON string with the following fields:
     ```json
     {
       "deviceId": "ESP32-[MAC_ADDRESS]",
       "timestamp": 1234567890,
       "sensors": [
         {
           "id": "sensor0",
           "type": "BME280",
           "value": 25.5
         },
         ...
       ]
     }
     ```

5. **Command Characteristic** (UUID: 1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108)
   - Properties: WRITE
   - Purpose: Receives commands to control the device
   - Supported commands:
     ```json
     {"command": "START_STREAMING"}
     {"command": "STOP_STREAMING"}
     {"command": "CALIBRATE", "sensorId": "sensor0"}
     {"command": "REBOOT"}
     ```

## Sensor Auto-Recognition

The firmware attempts to auto-detect I2C sensors using the following process:
1. Scans the I2C bus for connected devices
2. For each detected device, tries to identify it based on known signatures
3. Adds identified sensors to the internal sensor list
4. Additionally adds an analog temperature sensor for demonstration

Currently recognized sensors include:
- BME280 (Temperature/Humidity/Pressure)
- HDC1080 (Temperature/Humidity)
- SHT31 (Temperature/Humidity)
- CCS811 (Air Quality/eCO2/TVOC)
- BH1750 (Light)
- TSL2591 (Light)
- MPU6050 (Accelerometer/Gyroscope)

## Profile Management

Profiles define which sensors are active and their calibration data. When a new profile is received:
1. The profile is saved to SPIFFS for persistence
2. The profile is applied to the current configuration
3. Sensor active states are updated
4. Calibration data is applied if provided
5. Sampling interval is updated if specified

## Sensor Calibration

The firmware supports on-demand calibration of sensors. For demonstration purposes, the calibration process:
1. Reads the current raw value of the specified sensor
2. Applies a simple calibration based on sensor type
3. Updates the calibration offset and multiplier
4. Marks the sensor as calibrated

## Getting Started

### Required Hardware
- ESP32 development board
- I2C sensors (optional)
- Resistors for analog sensors (optional)

### Required Libraries
- BLEDevice
- ArduinoJson
- Wire (I2C)
- EEPROM
- SPIFFS

### Installation
1. Install the Arduino IDE and ESP32 board support
2. Install all required libraries
3. Upload the firmware to your ESP32

### Connecting with the Device
1. Use a BLE scanner to find the device (named "ESP32-Sensor-Hub")
2. Connect to the device
3. Read device info and sensor info
4. Send commands to control the device
5. Subscribe to live data notifications

## Customization

To add support for additional sensors:
1. Add the sensor signature to the `knownSensors` array
2. Add specific reading logic in the `readSensorValue` function
3. Add specific calibration logic in the `calibrateSensor` function 