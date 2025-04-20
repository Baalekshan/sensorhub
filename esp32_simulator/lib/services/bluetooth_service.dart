import 'dart:async';
import 'dart:convert';
import 'package:flutter_reactive_ble/flutter_reactive_ble.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/device_info.dart';
import '../models/sensor_info.dart';

class BluetoothService {
  static const String SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  static const String DEVICE_INFO_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  static const String SENSOR_INFO_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
  static const String SENSOR_DATA_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26aa';

  final _ble = FlutterReactiveBle();
  Timer? _notificationTimer;
  bool _isAdvertising = false;
  StreamSubscription? _peripheralStateSubscription;

  Future<void> startAdvertising() async {
    if (_isAdvertising) return;

    try {
      // Request necessary permissions
      await _requestPermissions();

      // Prepare the advertisement data
      final deviceInfo = DeviceInfo();
      final sensorInfo = SensorInfo();
      final initialSensorData = {
        'temperature': 25.0,
        'humidity': 60.0,
        'timestamp': DateTime.now().toIso8601String(),
      };

      // Create the GATT service
      final service = GattService(
        serviceId: Uuid.parse(SERVICE_UUID),
        characteristics: [
          GattCharacteristic(
            characteristicId: Uuid.parse(DEVICE_INFO_CHAR_UUID),
            properties: const GattCharacteristicProperties(
              read: true,
              write: false,
              notify: true,
            ),
            value: utf8.encode(jsonEncode(deviceInfo.toJson())),
          ),
          GattCharacteristic(
            characteristicId: Uuid.parse(SENSOR_INFO_CHAR_UUID),
            properties: const GattCharacteristicProperties(
              read: true,
              write: false,
              notify: true,
            ),
            value: utf8.encode(jsonEncode(sensorInfo.toJson())),
          ),
          GattCharacteristic(
            characteristicId: Uuid.parse(SENSOR_DATA_CHAR_UUID),
            properties: const GattCharacteristicProperties(
              read: true,
              write: false,
              notify: true,
            ),
            value: utf8.encode(jsonEncode(initialSensorData)),
          ),
        ],
      );

      // Start peripheral mode
      _peripheralStateSubscription = _ble.peripheralManager.observePeripheralState().listen((state) {
        print('Peripheral state: $state');
      });

      await _ble.peripheralManager.start(
        name: 'V25',
        services: [service],
      );

      _isAdvertising = true;
      _startNotifications();
    } catch (e) {
      print('Error starting advertising: $e');
      rethrow;
    }
  }

  Future<void> _requestPermissions() async {
    // Request location permission (required for BLE on Android)
    var status = await Permission.location.request();
    if (!status.isGranted) {
      throw Exception('Location permission is required for BLE advertising');
    }

    // Request Bluetooth permissions (required for Android 12+)
    status = await Permission.bluetooth.request();
    if (!status.isGranted) {
      throw Exception('Bluetooth permission is required');
    }

    status = await Permission.bluetoothAdvertise.request();
    if (!status.isGranted) {
      throw Exception('Bluetooth advertise permission is required');
    }

    status = await Permission.bluetoothConnect.request();
    if (!status.isGranted) {
      throw Exception('Bluetooth connect permission is required');
    }
  }

  void _startNotifications() {
    _notificationTimer?.cancel();
    _notificationTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (!_isAdvertising) return;

      try {
        // Simulate sensor data updates
        final sensorData = {
          'temperature': 20.0 + DateTime.now().second % 10,
          'humidity': 50.0 + DateTime.now().second % 20,
          'timestamp': DateTime.now().toIso8601String(),
        };

        // Update sensor data characteristic
        await _ble.peripheralManager.updateCharacteristicValue(
          Uuid.parse(SERVICE_UUID),
          Uuid.parse(SENSOR_DATA_CHAR_UUID),
          utf8.encode(jsonEncode(sensorData)),
        );
      } catch (e) {
        print('Error updating characteristic value: $e');
      }
    });
  }

  Future<void> stopAdvertising() async {
    if (!_isAdvertising) return;

    try {
      await _ble.peripheralManager.stop();
      _peripheralStateSubscription?.cancel();
      _notificationTimer?.cancel();
      _isAdvertising = false;
    } catch (e) {
      print('Error stopping advertising: $e');
      rethrow;
    }
  }

  bool get isAdvertising => _isAdvertising;
} 