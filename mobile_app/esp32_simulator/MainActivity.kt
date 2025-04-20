package com.example.esp32simulator

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
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
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import kotlin.random.Random

class MainActivity : AppCompatActivity() {
    private val TAG = "ESP32Simulator"
    
    // GATT Service and Characteristics UUIDs - must match ESP32 firmware and frontend
    private val SERVICE_UUID = UUID.fromString("4fafc201-1fb5-459e-8fcc-c5c9c331914b")
    private val DEVICE_INFO_UUID = UUID.fromString("beb5483e-36e1-4688-b7f5-ea07361b26a8")
    private val SENSOR_INFO_UUID = UUID.fromString("2a1f7dcd-8fc4-45ab-b81b-5391c6c29926")
    private val PROFILE_UUID = UUID.fromString("35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e")
    private val LIVE_DATA_UUID = UUID.fromString("d6c94056-6996-4fed-a6e4-d58c38f57eed")
    private val COMMAND_UUID = UUID.fromString("1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108")
    
    // CCCD (Client Characteristic Configuration Descriptor) UUID
    private val CCCD_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
    
    // BLE components
    private lateinit var bluetoothManager: BluetoothManager
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bluetoothGattServer: BluetoothGattServer? = null
    private var bluetoothLeAdvertiser: BluetoothLeAdvertiser? = null
    
    // UI components
    private lateinit var statusTextView: TextView
    private lateinit var connectedDevicesTextView: TextView
    private lateinit var startStopButton: Button
    private lateinit var sendDataSwitch: Switch
    
    // Connected devices
    private val connectedDevices = mutableSetOf<BluetoothDevice>()
    
    // Streaming state
    private var isStreaming = false
    private var profileLoaded = false
    private val handler = Handler(Looper.getMainLooper())
    private val streamInterval = 5000L  // Stream every 5 seconds
    
    // Simulated sensors
    private val sensors = arrayOf(
        SimulatedSensor("BME280", "Temperature", 20.0, 30.0, "°C"),
        SimulatedSensor("BME280", "Humidity", 30.0, 80.0, "%"),
        SimulatedSensor("BME280", "Pressure", 990.0, 1020.0, "hPa"),
        SimulatedSensor("CCS811", "eCO2", 400.0, 8000.0, "ppm"),
        SimulatedSensor("CCS811", "TVOC", 0.0, 1000.0, "ppb"),
        SimulatedSensor("BH1750", "Light", 0.0, 50000.0, "lux")
    )
    
    // Permission request code
    private val REQUEST_BLUETOOTH_PERMISSIONS = 1
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize UI components
        statusTextView = findViewById(R.id.statusTextView)
        connectedDevicesTextView = findViewById(R.id.connectedDevicesTextView)
        startStopButton = findViewById(R.id.startStopButton)
        sendDataSwitch = findViewById(R.id.sendDataSwitch)
        
        // Set up button click listener
        startStopButton.setOnClickListener {
            if (bluetoothGattServer == null) {
                if (checkAndRequestPermissions()) {
                    setupBLE()
                    startGattServer()
                    startAdvertising()
                    startStopButton.text = "Stop BLE Server"
                    updateStatus("Server started. Advertising...")
                }
            } else {
                stopGattServer()
                startStopButton.text = "Start BLE Server"
                updateStatus("Server stopped")
            }
        }
        
        // Set up switch listener
        sendDataSwitch.setOnCheckedChangeListener { _, isChecked ->
            isStreaming = isChecked
            if (isChecked) {
                startDataStreaming()
            } else {
                stopDataStreaming()
            }
        }
        
        // Initialize Bluetooth components
        setupBLE()
    }
    
    private fun setupBLE() {
        // Get Bluetooth services
        bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter
        
        // Check if Bluetooth is supported
        if (bluetoothAdapter == null) {
            updateStatus("Bluetooth not supported")
            return
        }
        
        // Enable Bluetooth if not enabled
        if (!bluetoothAdapter!!.isEnabled) {
            val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT)
            } else {
                updateStatus("Bluetooth permission required")
            }
            return
        }
        
        // Get the BLE advertiser
        bluetoothLeAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser
        if (bluetoothLeAdvertiser == null) {
            updateStatus("BLE advertising not supported")
        }
    }
    
    // Start the GATT server
    private fun startGattServer() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            updateStatus("Bluetooth permission required")
            return
        }
        
        bluetoothGattServer = bluetoothManager.openGattServer(this, gattServerCallback)
        
        // Create the GATT service
        val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        
        // Device Info characteristic
        val deviceInfoCharacteristic = BluetoothGattCharacteristic(
            DEVICE_INFO_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        
        // Sensor Info characteristic
        val sensorInfoCharacteristic = BluetoothGattCharacteristic(
            SENSOR_INFO_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        
        // Profile characteristic
        val profileCharacteristic = BluetoothGattCharacteristic(
            PROFILE_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        
        // Live Data characteristic
        val liveDataCharacteristic = BluetoothGattCharacteristic(
            LIVE_DATA_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ
        )
        
        // Add CCCD to Live Data characteristic
        val cccdDescriptor = BluetoothGattDescriptor(CCCD_UUID, 
            BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE
        )
        liveDataCharacteristic.addDescriptor(cccdDescriptor)
        
        // Command characteristic
        val commandCharacteristic = BluetoothGattCharacteristic(
            COMMAND_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE,
            BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        
        // Add characteristics to service
        service.addCharacteristic(deviceInfoCharacteristic)
        service.addCharacteristic(sensorInfoCharacteristic)
        service.addCharacteristic(profileCharacteristic)
        service.addCharacteristic(liveDataCharacteristic)
        service.addCharacteristic(commandCharacteristic)
        
        // Add service to GATT server
        bluetoothGattServer?.addService(service)
        
        // Set initial values
        setDeviceInfoValue()
        setSensorInfoValue()
    }
    
    // Start advertising the BLE service
    private fun startAdvertising() {
        if (bluetoothLeAdvertiser == null) {
            updateStatus("BLE advertising not supported")
            return
        }
        
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
            updateStatus("Bluetooth advertise permission required")
            return
        }
        
        // Create settings for advertising
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true)
            .setTimeout(0)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .build()
        
        // Create advertising data
        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .addServiceUuid(ParcelUuid(SERVICE_UUID))
            .build()
        
        // Create scan response data
        val scanResponseData = AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .build()
        
        // Start advertising
        bluetoothLeAdvertiser?.startAdvertising(settings, data, scanResponseData, advertiseCallback)
    }
    
    // Stop the GATT server
    private fun stopGattServer() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
        
        connectedDevices.clear()
        updateConnectedDevicesUI()
        
        if (bluetoothGattServer != null) {
            bluetoothGattServer?.close()
            bluetoothGattServer = null
        }
        
        stopDataStreaming()
    }
    
    // Start data streaming
    private fun startDataStreaming() {
        if (!isStreaming) return
        
        // Schedule next data update
        handler.postDelayed(streamRunnable, streamInterval)
    }
    
    // Stop data streaming
    private fun stopDataStreaming() {
        isStreaming = false
        handler.removeCallbacks(streamRunnable)
    }
    
    // Streaming runnable
    private val streamRunnable = object : Runnable {
        override fun run() {
            if (isStreaming && connectedDevices.isNotEmpty()) {
                sendLiveData()
                handler.postDelayed(this, streamInterval)
            }
        }
    }
    
    // Set Device Info characteristic value
    private fun setDeviceInfoValue() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        
        val deviceInfo = JSONObject().apply {
            put("name", getDeviceName())
            put("firmwareVersion", "1.0.0-sim")
            put("batteryLevel", 100)
        }
        
        val service = bluetoothGattServer?.getService(SERVICE_UUID)
        val characteristic = service?.getCharacteristic(DEVICE_INFO_UUID)
        
        characteristic?.value = deviceInfo.toString().toByteArray()
    }
    
    // Set Sensor Info characteristic value
    private fun setSensorInfoValue() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        
        val sensorTypes = sensors.map { it.type }.distinct()
        
        val sensorInfo = JSONObject().apply {
            val sensorsArray = JSONArray()
            
            sensorTypes.forEachIndexed { index, type ->
                sensorsArray.put(JSONObject().apply {
                    put("id", "sensor$index")
                    put("type", type)
                    put("isCalibrated", true)
                    put("isActive", true)
                })
            }
            
            put("sensors", sensorsArray)
        }
        
        val service = bluetoothGattServer?.getService(SERVICE_UUID)
        val characteristic = service?.getCharacteristic(SENSOR_INFO_UUID)
        
        characteristic?.value = sensorInfo.toString().toByteArray()
    }
    
    // Send Live Data
    private fun sendLiveData() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return
        }
        
        val liveData = JSONObject().apply {
            put("deviceId", getDeviceName())
            put("timestamp", System.currentTimeMillis())
            
            val sensorsArray = JSONArray()
            
            sensors.forEach { sensor ->
                val value = sensor.generateValue()
                sensorsArray.put(JSONObject().apply {
                    put("id", "${sensor.type.toLowerCase()}_${sensor.name.toLowerCase()}")
                    put("value", value)
                })
            }
            
            put("sensors", sensorsArray)
        }
        
        val service = bluetoothGattServer?.getService(SERVICE_UUID)
        val characteristic = service?.getCharacteristic(LIVE_DATA_UUID)
        
        characteristic?.value = liveData.toString().toByteArray()
        
        // Notify all connected devices
        for (device in connectedDevices) {
            bluetoothGattServer?.notifyCharacteristicChanged(device, characteristic, false)
        }
        
        runOnUiThread {
            updateStatus("Sent data: ${liveData.toString().take(50)}...")
        }
    }
    
    // Get device name
    private fun getDeviceName(): String {
        return "ESP32-Sim-Android"
    }
    
    // Update status TextView
    private fun updateStatus(status: String) {
        runOnUiThread {
            statusTextView.text = status
            Log.d(TAG, status)
        }
    }
    
    // Update connected devices UI
    private fun updateConnectedDevicesUI() {
        runOnUiThread {
            if (connectedDevices.isEmpty()) {
                connectedDevicesTextView.text = "No connected devices"
            } else {
                connectedDevicesTextView.text = "Connected devices: ${connectedDevices.size}\n" +
                        connectedDevices.joinToString("\n") { it.address }
            }
        }
    }
    
    // GATT Server callback
    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                if (ActivityCompat.checkSelfPermission(this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                    return
                }
                connectedDevices.add(device)
                updateStatus("Device connected: ${device.address}")
                updateConnectedDevicesUI()
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                connectedDevices.remove(device)
                updateStatus("Device disconnected: ${device.address}")
                updateConnectedDevicesUI()
            }
        }
        
        override fun onCharacteristicReadRequest(device: BluetoothDevice, requestId: Int, offset: Int, characteristic: BluetoothGattCharacteristic) {
            if (ActivityCompat.checkSelfPermission(this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                return
            }
            
            // Respond to read requests
            bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, characteristic.value)
            updateStatus("Read request for ${characteristic.uuid}")
        }
        
        override fun onCharacteristicWriteRequest(device: BluetoothDevice, requestId: Int, characteristic: BluetoothGattCharacteristic, preparedWrite: Boolean, responseNeeded: Boolean, offset: Int, value: ByteArray) {
            if (ActivityCompat.checkSelfPermission(this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                return
            }
            
            // Handle write requests
            when (characteristic.uuid) {
                PROFILE_UUID -> {
                    // Handle profile write
                    val profileJson = String(value)
                    updateStatus("Profile received: ${profileJson.take(50)}...")
                    profileLoaded = true
                }
                COMMAND_UUID -> {
                    // Handle command
                    val commandJson = String(value)
                    try {
                        val command = JSONObject(commandJson)
                        if (command.has("command")) {
                            when (command.getString("command")) {
                                "START_STREAMING" -> {
                                    runOnUiThread {
                                        sendDataSwitch.isChecked = true
                                    }
                                }
                                "STOP_STREAMING" -> {
                                    runOnUiThread {
                                        sendDataSwitch.isChecked = false
                                    }
                                }
                                "CALIBRATE" -> {
                                    updateStatus("Calibration command received")
                                }
                                "REBOOT" -> {
                                    updateStatus("Reboot command received")
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing command", e)
                    }
                }
            }
            
            // Send response if needed
            if (responseNeeded) {
                bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
            }
        }
        
        override fun onDescriptorReadRequest(device: BluetoothDevice, requestId: Int, offset: Int, descriptor: BluetoothGattDescriptor) {
            if (ActivityCompat.checkSelfPermission(this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                return
            }
            
            // Respond to descriptor read
            bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, descriptor.value)
        }
        
        override fun onDescriptorWriteRequest(device: BluetoothDevice, requestId: Int, descriptor: BluetoothGattDescriptor, preparedWrite: Boolean, responseNeeded: Boolean, offset: Int, value: ByteArray) {
            if (ActivityCompat.checkSelfPermission(this@MainActivity, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                return
            }
            
            // Handle CCCD writes
            if (descriptor.uuid == CCCD_UUID) {
                // Set the value of the descriptor
                descriptor.value = value
                
                // Check if notifications are enabled
                if (value.isNotEmpty() && value[0].toInt() != 0) {
                    // Notifications enabled
                    updateStatus("Notifications enabled for ${device.address}")
                } else {
                    // Notifications disabled
                    updateStatus("Notifications disabled for ${device.address}")
                }
            }
            
            // Send response if needed
            if (responseNeeded) {
                bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
            }
        }
    }
    
    // Advertising callback
    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            updateStatus("Advertising started successfully")
        }
        
        override fun onStartFailure(errorCode: Int) {
            val errorMessage = when (errorCode) {
                ADVERTISE_FAILED_ALREADY_STARTED -> "Already started"
                ADVERTISE_FAILED_DATA_TOO_LARGE -> "Data too large"
                ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "Feature unsupported"
                ADVERTISE_FAILED_INTERNAL_ERROR -> "Internal error"
                ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Too many advertisers"
                else -> "Unknown error $errorCode"
            }
            updateStatus("Advertising failed: $errorMessage")
        }
    }
    
    // Check and request necessary permissions
    private fun checkAndRequestPermissions(): Boolean {
        val permissionsToRequest = mutableListOf<String>()
        
        // Check for required permissions based on API level
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ needs BLUETOOTH_SCAN, BLUETOOTH_ADVERTISE, and BLUETOOTH_CONNECT
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH_SCAN)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH_ADVERTISE)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        } else {
            // Older versions need LOCATION permission
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
            }
        }
        
        // Request permissions if needed
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), REQUEST_BLUETOOTH_PERMISSIONS)
            return false
        }
        
        return true
    }
    
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == REQUEST_BLUETOOTH_PERMISSIONS) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                // Permissions granted, continue with BLE setup
                setupBLE()
                startGattServer()
                startAdvertising()
                startStopButton.text = "Stop BLE Server"
                updateStatus("Server started. Advertising...")
            } else {
                // Permissions denied
                Toast.makeText(this, "Required permissions not granted", Toast.LENGTH_SHORT).show()
                updateStatus("Required permissions not granted")
            }
        }
    }
    
    companion object {
        private const val REQUEST_ENABLE_BT = 1
    }
    
    // Class to represent a simulated sensor
    data class SimulatedSensor(
        val type: String,
        val name: String,
        val minValue: Double,
        val maxValue: Double,
        val unit: String
    ) {
        fun generateValue(): Double {
            return minValue + (maxValue - minValue) * Random.nextDouble()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopGattServer()
    }
} 