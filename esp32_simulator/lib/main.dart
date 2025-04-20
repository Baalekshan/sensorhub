import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'services/bluetooth_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ESP32 Simulator',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final BluetoothService _bluetoothService = BluetoothService();
  bool _hasPermissions = false;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    final bluetoothScan = await Permission.bluetoothScan.status;
    final bluetoothConnect = await Permission.bluetoothConnect.status;
    final bluetoothAdvertise = await Permission.bluetoothAdvertise.status;
    final location = await Permission.location.status;

    if (!bluetoothScan.isGranted ||
        !bluetoothConnect.isGranted ||
        !bluetoothAdvertise.isGranted ||
        !location.isGranted) {
      final statuses = await [
        Permission.bluetoothScan,
        Permission.bluetoothConnect,
        Permission.bluetoothAdvertise,
        Permission.location,
      ].request();

      setState(() {
        _hasPermissions = statuses.values.every((status) => status.isGranted);
      });
    } else {
      setState(() {
        _hasPermissions = true;
      });
    }
  }

  Future<void> _toggleAdvertising() async {
    try {
      if (_bluetoothService.isAdvertising) {
        await _bluetoothService.stopAdvertising();
      } else {
        await _bluetoothService.startAdvertising();
      }
      setState(() {});
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('ESP32 Simulator'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!_hasPermissions)
              const Text(
                'Please grant the required permissions',
                style: TextStyle(color: Colors.red),
              )
            else
              Column(
                children: [
                  Icon(
                    _bluetoothService.isAdvertising
                        ? Icons.bluetooth_connected
                        : Icons.bluetooth_disabled,
                    size: 100,
                    color: _bluetoothService.isAdvertising
                        ? Colors.blue
                        : Colors.grey,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _bluetoothService.isAdvertising
                        ? 'Device is advertising as "V25"'
                        : 'Device is not advertising',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 40),
                  ElevatedButton(
                    onPressed: _toggleAdvertising,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                    ),
                    child: Text(
                      _bluetoothService.isAdvertising
                          ? 'Stop Advertising'
                          : 'Start Advertising',
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
