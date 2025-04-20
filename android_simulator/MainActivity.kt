package com.example.esp32simulator

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

class MainActivity : AppCompatActivity() {
    private val TAG = "ESP32Simulator"
    private val REQUEST_ENABLE_BT = 1
    private val REQUEST_PERMISSIONS = 2

    // GATT Service and Characteristics UUIDs - must match ESP32 firmware
    private val SERVICE_UUID = UUID.fromString("4fafc201-1fb5-459e-8fcc-c5c9c331914b")
    private val DEVICE_INFO_CHARACTERISTIC_UUID = UUID.fromString("beb5483e-36e1-4688-b7f5-ea07361b26a8")
    private val SENSOR_INFO_CHARACTERISTIC_UUID = UUID.fromString("2a1f7dcd-8fc4-45ab-b81b-5391c6c29926")
    private val PROFILE_CHARACTERISTIC_UUID = UUID.fromString("35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e")
    private val LIVE_DATA_CHARACTERISTIC_UUID = UUID.fromString("d6c94056-6996-4fed-a6e4-d58c38f57eed")
    private val COMMAND_CHARACTERISTIC_UUID = UUID.fromString("1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108")
    private val CLIENT_CONFIG_DESCRIPTOR_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

    // Bluetooth components
    private lateinit var bluetoothManager: BluetoothManager
    private lateinit var bluetoothAdapter: BluetoothAdapter
    private var bluetoothLeAdvertiser: BluetoothLeAdvertiser? = null
    private var bluetoothGattServer: BluetoothGattServer? = null

    // UI components
    private lateinit var statusTextView: TextView
    private lateinit var connectedClientsTextView: TextView
    private lateinit var toggleAdvertisingButton: Button
    private lateinit var toggleStreamingButton: Button

    // State
    private var isAdvertising = false
    private var isStreaming = false
    private val connectedDevices = mutableSetOf<BluetoothDevice>()
    private val handler = Handler(Looper.getMainLooper())
    private var streamingRunnable: Runnable? = null

    // Simulated device data
    private val deviceId = "ESP32-SIMULATOR"
    private val deviceName = "ESP32-Sensor-Hub"
    private val firmwareVersion = "1.0.0"
    private val sensors = mutableListOf<SensorData>()
    private var currentProfile: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize UI components
        statusTextView = findViewById(R.id.statusTextView)
        connectedClientsTextView = findViewById(R.id.connectedClientsTextView)
        toggleAdvertisingButton = findViewById(R.id.toggleAdvertisingButton)
        toggleStreamingButton = findViewById(R.id.toggleStreamingButton)

        // Set up button click listeners
        toggleAdvertisingButton.setOnClickListener {
            if (isAdvertising) stopAdvertising() else startAdvertising()
        }
        toggleStreamingButton.setOnClickListener {
            if (isStreaming) stopStreaming() else startStreaming()
        }
        toggleStreamingButton.isEnabled = false // Disable initially

        // Initialize Bluetooth
        initializeBluetooth()

        // Initialize simulated sensors
        initializeSimulatedSensors()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopStreaming()
        stopAdvertising()
        bluetoothGattServer?.close()
    }

    private fun initializeBluetooth() {
        // Get the Bluetooth manager and adapter
        bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter

        // Check if Bluetooth is supported
        if (bluetoothAdapter == null) {
            Toast.makeText(this, "Bluetooth is not supported on this device", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Request Bluetooth permissions
        requestPermissions()
    }

    private fun requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_ADVERTISE,
                    Manifest.permission.BLUETOOTH_CONNECT
                ),
                REQUEST_PERMISSIONS
            )
        } else {
            // For older Android versions
            if (!bluetoothAdapter.isEnabled) {
                val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
                startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
            } else {
                setupGattServer()
            }
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_PERMISSIONS) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                if (!bluetoothAdapter.isEnabled) {
                    val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
                    startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
                } else {
                    setupGattServer()
                }
            } else {
                Toast.makeText(this, "Bluetooth permissions are required", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_ENABLE_BT) {
            if (resultCode == Activity.RESULT_OK) {
                setupGattServer()
            } else {
                Toast.makeText(this, "Bluetooth must be enabled", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun setupGattServer() {
        bluetoothLeAdvertiser = bluetoothAdapter.bluetoothLeAdvertiser
        if (bluetoothLeAdvertiser == null) {
            Toast.makeText(this, "Bluetooth LE Advertising not supported", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        bluetoothGattServer = bluetoothManager.openGattServer(this, gattServerCallback)
        if (bluetoothGattServer == null) {
            Toast.makeText(this, "Unable to create GATT server", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Create the GATT service
        val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)

        // Add Device Info characteristic
        val deviceInfoCharacteristic = BluetoothGattCharacteristic(
            DEVICE_INFO_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        deviceInfoCharacteristic.value = createDeviceInfoJson().toString().toByteArray()

        // Add Sensor Info characteristic
        val sensorInfoCharacteristic = BluetoothGattCharacteristic(
            SENSOR_INFO_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        sensorInfoCharacteristic.value = createSensorInfoJson().toString().toByteArray()

        // Add Profile characteristic
        val profileCharacteristic = BluetoothGattCharacteristic(
            PROFILE_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )

        // Add Command characteristic
        val commandCharacteristic = BluetoothGattCharacteristic(
            COMMAND_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )

        // Add Live Data characteristic
        val liveDataCharacteristic = BluetoothGattCharacteristic(
            LIVE_DATA_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ
        )

        // Add descriptor to live data characteristic
        val descriptor = BluetoothGattDescriptor(
            CLIENT_CONFIG_DESCRIPTOR_UUID,
            BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE
        )
        liveDataCharacteristic.addDescriptor(descriptor)

        // Add all characteristics to the service
        service.addCharacteristic(deviceInfoCharacteristic)
        service.addCharacteristic(sensorInfoCharacteristic)
        service.addCharacteristic(profileCharacteristic)
        service.addCharacteristic(commandCharacteristic)
        service.addCharacteristic(liveDataCharacteristic)

        // Add the service to the GATT server
        bluetoothGattServer?.addService(service)

        updateStatus("GATT server initialized")
    }

    private fun startAdvertising() {
        if (bluetoothLeAdvertiser == null) return

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true)
            .setTimeout(0)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .build()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .addServiceUuid(ParcelUuid(SERVICE_UUID))
            .build()

        bluetoothAdapter.name = deviceName

        bluetoothLeAdvertiser?.startAdvertising(settings, data, advertiseCallback)
    }

    private fun stopAdvertising() {
        bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
        updateStatus("Advertising stopped")
        toggleAdvertisingButton.text = "Start Advertising"
        isAdvertising = false
    }

    private fun startStreaming() {
        if (isStreaming) return

        isStreaming = true
        toggleStreamingButton.text = "Stop Streaming"
        updateStatus("Streaming started")

        streamingRunnable = object : Runnable {
            override fun run() {
                if (isStreaming && connectedDevices.isNotEmpty()) {
                    sendLiveData()
                }
                handler.postDelayed(this, 1000) // Send data every second
            }
        }
        handler.post(streamingRunnable!!)
    }

    private fun stopStreaming() {
        isStreaming = false
        toggleStreamingButton.text = "Start Streaming"
        updateStatus("Streaming stopped")

        streamingRunnable?.let {
            handler.removeCallbacks(it)
            streamingRunnable = null
        }
    }

    private fun sendLiveData() {
        val service = bluetoothGattServer?.getService(SERVICE_UUID) ?: return
        val characteristic = service.getCharacteristic(LIVE_DATA_CHARACTERISTIC_UUID) ?: return

        val jsonString = createLiveDataJson().toString()
        characteristic.value = jsonString.toByteArray()

        for (device in connectedDevices) {
            bluetoothGattServer?.notifyCharacteristicChanged(device, characteristic, false)
        }

        Log.d(TAG, "Sent live data: $jsonString")
    }

    private fun initializeSimulatedSensors() {
        // Add some simulated sensors
        sensors.add(SensorData("sensor0", "BME280", true, false, 25.0))
        sensors.add(SensorData("sensor1", "HDC1080", true, false, 45.0))
        sensors.add(SensorData("sensor2", "CCS811", true, false, 850.0))
        sensors.add(SensorData("sensor3", "BH1750", true, false, 500.0))
        sensors.add(SensorData("analog_temp", "ANALOG_TEMPERATURE", true, false, 22.5))
    }

    private fun createDeviceInfoJson(): JSONObject {
        return JSONObject().apply {
            put("deviceId", deviceId)
            put("name", deviceName)
            put("firmwareVersion", firmwareVersion)
            put("freeMemory", 131072)
            put("uptime", System.currentTimeMillis() / 1000)
        }
    }

    private fun createSensorInfoJson(): JSONObject {
        val sensorsJson = JSONArray()
        for (sensor in sensors) {
            sensorsJson.put(JSONObject().apply {
                put("id", sensor.id)
                put("type", sensor.type)
                put("isCalibrated", sensor.isCalibrated)
                put("isActive", sensor.isActive)
            })
        }

        return JSONObject().apply {
            put("sensors", sensorsJson)
        }
    }

    private fun createLiveDataJson(): JSONObject {
        val sensorsJson = JSONArray()
        for (sensor in sensors) {
            if (sensor.isActive) {
                // Add some random variation to the sensor values for realism
                val variation = (Math.random() * 2 - 1) // -1 to +1
                val value = sensor.value + variation

                sensorsJson.put(JSONObject().apply {
                    put("id", sensor.id)
                    put("type", sensor.type)
                    put("value", value)
                })
            }
        }

        return JSONObject().apply {
            put("deviceId", deviceId)
            put("timestamp", System.currentTimeMillis())
            put("sensors", sensorsJson)
        }
    }

    private fun updateStatus(message: String) {
        Log.d(TAG, message)
        statusTextView.text = message
    }

    private fun updateConnectedClients() {
        val clientsText = if (connectedDevices.isEmpty()) {
            "No connected clients"
        } else {
            "Connected clients: ${connectedDevices.size}"
        }
        connectedClientsTextView.text = clientsText
    }

    private fun handleProfileWrite(value: ByteArray) {
        val profileJson = String(value)
        currentProfile = profileJson
        
        try {
            val json = JSONObject(profileJson)
            val profileName = json.optString("name", "Unknown Profile")
            val sensorConfigs = json.optJSONArray("sensors")
            
            if (sensorConfigs != null) {
                for (i in 0 until sensorConfigs.length()) {
                    val sensorConfig = sensorConfigs.getJSONObject(i)
                    val sensorId = sensorConfig.getString("id")
                    val isActive = sensorConfig.optBoolean("active", true)
                    
                    // Update sensor state
                    sensors.find { it.id == sensorId }?.isActive = isActive
                }
            }
            
            updateStatus("Applied profile: $profileName")
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing profile: ${e.message}")
            updateStatus("Error applying profile")
        }
    }

    private fun handleCommandWrite(value: ByteArray) {
        try {
            val commandJson = JSONObject(String(value))
            val command = commandJson.optString("command", "")
            
            when (command) {
                "START_STREAMING" -> startStreaming()
                "STOP_STREAMING" -> stopStreaming()
                "CALIBRATE" -> {
                    val sensorId = commandJson.optString("sensorId", "")
                    val sensor = sensors.find { it.id == sensorId }
                    if (sensor != null) {
                        sensor.isCalibrated = true
                        updateStatus("Calibrated sensor: $sensorId")
                    }
                }
                "REBOOT" -> {
                    updateStatus("Simulating reboot...")
                    stopStreaming()
                    stopAdvertising()
                    
                    handler.postDelayed({
                        updateStatus("Reboot complete")
                        startAdvertising()
                    }, 2000)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing command: ${e.message}")
        }
    }

    // Bluetooth LE advertising callback
    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            super.onStartSuccess(settingsInEffect)
            isAdvertising = true
            updateStatus("Advertising started")
            toggleAdvertisingButton.text = "Stop Advertising"
        }

        override fun onStartFailure(errorCode: Int) {
            super.onStartFailure(errorCode)
            isAdvertising = false
            val errorMessage = when (errorCode) {
                ADVERTISE_FAILED_ALREADY_STARTED -> "Already started"
                ADVERTISE_FAILED_DATA_TOO_LARGE -> "Data too large"
                ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "Feature unsupported"
                ADVERTISE_FAILED_INTERNAL_ERROR -> "Internal error"
                ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Too many advertisers"
                else -> "Unknown error $errorCode"
            }
            updateStatus("Failed to start advertising: $errorMessage")
        }
    }

    // GATT server callback
    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState == BluetoothGatt.STATE_CONNECTED) {
                connectedDevices.add(device)
                updateStatus("Device connected: ${device.address}")
                toggleStreamingButton.isEnabled = true
            } else if (newState == BluetoothGatt.STATE_DISCONNECTED) {
                connectedDevices.remove(device)
                updateStatus("Device disconnected: ${device.address}")
                if (connectedDevices.isEmpty()) {
                    toggleStreamingButton.isEnabled = false
                    stopStreaming()
                }
            }
            updateConnectedClients()
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic
        ) {
            var value: ByteArray? = null
            
            when (characteristic.uuid) {
                DEVICE_INFO_CHARACTERISTIC_UUID -> {
                    value = createDeviceInfoJson().toString().toByteArray()
                }
                SENSOR_INFO_CHARACTERISTIC_UUID -> {
                    value = createSensorInfoJson().toString().toByteArray()
                }
            }
            
            if (value != null) {
                bluetoothGattServer?.sendResponse(
                    device, requestId, BluetoothGatt.GATT_SUCCESS, offset,
                    if (offset > value.size) ByteArray(0) else value.copyOfRange(offset, value.size)
                )
            } else {
                bluetoothGattServer?.sendResponse(
                    device, requestId, BluetoothGatt.GATT_FAILURE, 0, null
                )
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            if (value == null) {
                if (responseNeeded) {
                    bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_FAILURE, 0, null)
                }
                return
            }
            
            when (characteristic.uuid) {
                PROFILE_CHARACTERISTIC_UUID -> {
                    handleProfileWrite(value)
                }
                COMMAND_CHARACTERISTIC_UUID -> {
                    handleCommandWrite(value)
                }
            }
            
            if (responseNeeded) {
                bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
            }
        }

        override fun onDescriptorReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor
        ) {
            bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            if (descriptor.uuid == CLIENT_CONFIG_DESCRIPTOR_UUID) {
                // Enable notifications if requested
                if (value?.contentEquals(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE) == true) {
                    Log.d(TAG, "Notifications enabled for device: ${device.address}")
                }
            }
            
            if (responseNeeded) {
                bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
            }
        }
    }

    // Data class to represent a sensor
    data class SensorData(
        val id: String,
        val type: String,
        var isActive: Boolean,
        var isCalibrated: Boolean,
        var value: Double
    )
} 