import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { registerDevice, configureSensor, startStream } from '../lib/api';

// GATT Service and Characteristics UUIDs - must match ESP32 firmware
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const DEVICE_INFO_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const SENSOR_INFO_CHARACTERISTIC_UUID = '2a1f7dcd-8fc4-45ab-b81b-5391c6c29926';
const PROFILE_CHARACTERISTIC_UUID = '35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e';
const LIVE_DATA_CHARACTERISTIC_UUID = 'd6c94056-6996-4fed-a6e4-d58c38f57eed';
const COMMAND_CHARACTERISTIC_UUID = '1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108';

// Types
export type OnboardingStep = 'scan' | 'configure' | 'profile' | 'flashing' | 'review';

export interface BluetoothDevice {
  device: any; // Web Bluetooth device
  name: string;
  id: string;
}

export interface SensorInfo {
  id: string;
  type: string;
  isCalibrated: boolean;
  isActive: boolean;
}

export interface DeviceProfile {
  id: string;
  name: string;
  description: string;
  compatibleSensors: string[];
  configuration: {
    sensors: {
      id: string;
      active: boolean;
      calibrationOffset?: number;
      calibrationMultiplier?: number;
      isCalibrated?: boolean;
    }[];
    sampling: {
      interval: number;
    };
  };
}

export function useDeviceOnboarding() {
  const { toast } = useToast();
  const router = useRouter();

  // State variables
  const [step, setStep] = useState<OnboardingStep>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [bluetoothServer, setBluetoothServer] = useState<any>(null);
  const [bluetoothService, setBluetoothService] = useState<any>(null);
  const [sensorInfo, setSensorInfo] = useState<SensorInfo[]>([]);
  const [manualSensorConfig, setManualSensorConfig] = useState<SensorInfo[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<DeviceProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<DeviceProfile | null>(null);
  const [progress, setProgress] = useState(0);
  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [liveDataSubscription, setLiveDataSubscription] = useState<any>(null);

  // Check if Web Bluetooth is available
  useEffect(() => {
    setBluetoothAvailable(
      typeof navigator !== 'undefined' && 
      navigator.bluetooth !== undefined
    );
  }, []);

  // Load available profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // In a real application, these would be fetched from an API
        const mockProfiles: DeviceProfile[] = [
          {
            id: 'temp-humidity',
            name: 'Temperature & Humidity Monitor',
            description: 'Optimized for temperature and humidity monitoring with 30-second intervals.',
            compatibleSensors: ['BME280', 'HDC1080', 'SHT31'],
            configuration: {
              sensors: [
                { id: 'sensor0', active: true },
                { id: 'sensor1', active: true },
              ],
              sampling: {
                interval: 30000,
              },
            },
          },
          {
            id: 'air-quality',
            name: 'Air Quality Monitor',
            description: 'Monitors air quality, CO2 levels, and temperature with 1-minute intervals.',
            compatibleSensors: ['CCS811', 'BME280'],
            configuration: {
              sensors: [
                { id: 'sensor0', active: true },
                { id: 'sensor2', active: true },
              ],
              sampling: {
                interval: 60000,
              },
            },
          },
          {
            id: 'full-environment',
            name: 'Full Environmental Monitoring',
            description: 'Comprehensive monitoring of temperature, humidity, air quality, and light.',
            compatibleSensors: ['BME280', 'HDC1080', 'SHT31', 'CCS811', 'BH1750', 'TSL2591'],
            configuration: {
              sensors: [
                { id: 'sensor0', active: true },
                { id: 'sensor1', active: true },
                { id: 'sensor2', active: true },
                { id: 'sensor3', active: true },
              ],
              sampling: {
                interval: 120000,
              },
            },
          },
        ];

        setAvailableProfiles(mockProfiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load device profiles',
          variant: 'destructive',
        });
      }
    };

    fetchProfiles();
  }, [toast]);

  // Start Bluetooth scanning
  const startScan = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast({
        title: 'Bluetooth Error',
        description: 'Web Bluetooth is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsScanning(true);
      setDevices([]);

      console.log('Requesting Bluetooth device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SERVICE_UUID] },
          { namePrefix: 'ESP32' },
        ],
        optionalServices: [SERVICE_UUID],
      });
      console.log('Bluetooth device obtained:', {
        name: device.name,
        id: device.id,
        connected: device.gatt?.connected
      });

      if (device) {
        const newDevice: BluetoothDevice = {
          device,
          name: device.name || 'Unknown Device',
          id: device.id,
        };

        setDevices([newDevice]);
        setSelectedDevice(newDevice);
        
        // Add event listener for disconnection
        console.log('Adding GATT server disconnection listener');
        device.addEventListener('gattserverdisconnected', (event: Event) => {
          console.log('GATT server disconnected event:', {
            event,
            deviceName: device.name,
            deviceId: device.id,
            currentStep: step
          });
          
          toast({
            title: 'Device Disconnected',
            description: `Lost connection to ${device.name || 'device'}`,
            variant: 'destructive',
          });
          
          // Clean up if in onboarding process
          if (step !== 'scan') {
            console.log('Cleaning up after disconnection in step:', step);
            disconnectDevice(false);
          }
        });
      }
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: 'Scan Error',
        description: error instanceof Error ? error.message : 'Failed to scan for devices',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast, step]);

  // Stop scanning
  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  // Select a device from the list
  const selectDevice = useCallback((device: BluetoothDevice) => {
    setSelectedDevice(device);
  }, []);

  // Connect to the selected device
  const connectToDevice = useCallback(async () => {
    if (!selectedDevice) {
      toast({
        title: 'Connection Error',
        description: 'No device selected',
        variant: 'destructive',
      });
      return;
    }

    const MAX_RETRIES = 3;
    let retryCount = 0;

    const attemptConnection = async () => {
      try {
        console.log(`Connection attempt ${retryCount + 1}/${MAX_RETRIES}`);
        console.log('Starting device connection process...');
        console.log('Selected Device:', {
          name: selectedDevice.name,
          id: selectedDevice.id,
          gatt: selectedDevice.device.gatt ? 'Available' : 'Not Available'
        });

        toast({
          title: 'Connecting',
          description: `Connecting to ${selectedDevice.name}... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
        });

        console.log('Attempting to connect to GATT server...');
        console.log('Device GATT state before connect:', {
          connected: selectedDevice.device.gatt?.connected,
          device: selectedDevice.device
        });

        const server = await selectedDevice.device.gatt.connect();
        console.log('GATT server connected successfully', {
          server: server,
          connected: server.connected,
          device: server.device
        });
        setBluetoothServer(server);

        console.log('Getting primary service with UUID:', SERVICE_UUID);
        const service = await server.getPrimaryService(SERVICE_UUID);
        console.log('Primary service obtained successfully', {
          service: service,
          uuid: service.uuid,
          isPrimary: service.isPrimary
        });
        setBluetoothService(service);

        // Get device information first
        console.log('Reading device information from characteristic:', DEVICE_INFO_CHARACTERISTIC_UUID);
        const deviceInfoCharacteristic = await service.getCharacteristic(DEVICE_INFO_CHARACTERISTIC_UUID);
        console.log('Device info characteristic obtained', {
          characteristic: deviceInfoCharacteristic,
          uuid: deviceInfoCharacteristic.uuid,
          properties: deviceInfoCharacteristic.properties
        });

        const deviceInfoData = await deviceInfoCharacteristic.readValue();
        const deviceInfoDecoder = new TextDecoder('utf-8');
        const deviceInfo = JSON.parse(deviceInfoDecoder.decode(deviceInfoData));
        console.log('Device Information:', {
          rawData: deviceInfoData,
          decodedData: deviceInfoDecoder.decode(deviceInfoData),
          parsedData: deviceInfo
        });

        // Verify device info response format
        if (!deviceInfo.name || !deviceInfo.version || !deviceInfo.model) {
          throw new Error('Invalid device info response format');
        }

        // Get sensor information
        console.log('Reading sensor information from characteristic:', SENSOR_INFO_CHARACTERISTIC_UUID);
        const sensorInfoCharacteristic = await service.getCharacteristic(SENSOR_INFO_CHARACTERISTIC_UUID);
        console.log('Sensor info characteristic obtained', {
          characteristic: sensorInfoCharacteristic,
          uuid: sensorInfoCharacteristic.uuid,
          properties: sensorInfoCharacteristic.properties
        });

        const sensorData = await sensorInfoCharacteristic.readValue();
        const decoder = new TextDecoder('utf-8');
        const sensorInfoJson = JSON.parse(decoder.decode(sensorData));
        console.log('Sensor Information:', {
          rawData: sensorData,
          decodedData: decoder.decode(sensorData),
          parsedData: sensorInfoJson
        });

        // Verify sensor info response format
        if (!sensorInfoJson.sensors || !Array.isArray(sensorInfoJson.sensors)) {
          throw new Error('Invalid sensor info response format');
        }

        console.log('Setting sensor info:', sensorInfoJson.sensors);
        setSensorInfo(sensorInfoJson.sensors);

        console.log('Connection process completed successfully');
        toast({
          title: 'Connected',
          description: `Successfully connected to ${selectedDevice.name}`,
        });

        // Move to the next step
        setStep('configure');
        return true;
      } catch (error) {
        console.error(`Connection attempt ${retryCount + 1} failed:`, error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          error: error
        });

        // Clean up any partial connections
        if (bluetoothServer) {
          try {
            console.log('Cleaning up partial connection...');
            await bluetoothServer.disconnect();
            console.log('Successfully disconnected from server');
          } catch (e) {
            console.error('Error during cleanup:', e);
          }
        }
        setBluetoothServer(null);
        setBluetoothService(null);

        if (retryCount < MAX_RETRIES - 1) {
          retryCount++;
          console.log(`Retrying connection in 1 second... (${retryCount}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptConnection();
        } else {
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to device after multiple attempts. Please ensure the device is in pairing mode and try again.',
            variant: 'destructive',
          });
          return false;
        }
      }
    };

    return attemptConnection();
  }, [selectedDevice, toast, bluetoothServer]);

  // Disconnect from the device
  const disconnectDevice = useCallback((keepState = false) => {
    console.log('Disconnecting device:', {
      keepState,
      currentStep: step,
      hasServer: !!bluetoothServer,
      hasService: !!bluetoothService,
      hasLiveDataSubscription: !!liveDataSubscription
    });

    try {
      // Unsubscribe from notifications
      if (liveDataSubscription) {
        console.log('Removing live data subscription');
        liveDataSubscription.removeEventListener('characteristicvaluechanged', handleLiveData);
        setLiveDataSubscription(null);
      }
      
      if (bluetoothServer) {
        console.log('Disconnecting GATT server');
        bluetoothServer.disconnect();
      }
      
      if (!keepState) {
        console.log('Resetting to initial state');
        // Reset to initial state
        setBluetoothServer(null);
        setBluetoothService(null);
        setSensorInfo([]);
        setManualSensorConfig([]);
        setSelectedProfile(null);
        setProgress(0);
        setLiveData(null);
        setStep('scan');
      } else {
        console.log('Moving back one step from:', step);
        // Just go back one step
        if (step === 'configure') setStep('scan');
        if (step === 'profile') setStep('configure');
        if (step === 'review') setStep('profile');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }, [bluetoothServer, step, liveDataSubscription]);

  // Event handler for live data notifications
  const handleLiveData = useCallback((event: any) => {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    try {
      const data = JSON.parse(decoder.decode(value));
      setLiveData(data);
      
      // In a real app, we would send this data to the backend
      console.log('Received live data:', data);
    } catch (error) {
      console.error('Error parsing live data:', error);
    }
  }, []);

  // Subscribe to live data notifications
  const subscribeLiveData = useCallback(async () => {
    if (!bluetoothService) return;
    
    try {
      const characteristic = await bluetoothService.getCharacteristic(LIVE_DATA_CHARACTERISTIC_UUID);
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleLiveData);
      setLiveDataSubscription(characteristic);
      
      console.log('Subscribed to live data');
    } catch (error) {
      console.error('Error subscribing to live data:', error);
    }
  }, [bluetoothService, handleLiveData]);

  // Configure sensors and move to profile selection
  const configureSensors = useCallback(() => {
    // If sensors were auto-detected, use those. Otherwise use manual config
    const sensorsToUse = sensorInfo.length > 0 ? sensorInfo : manualSensorConfig;
    
    // Filter profiles based on compatible sensors
    const sensorTypes = sensorsToUse.map(sensor => sensor.type);
    const compatibleProfiles = availableProfiles.filter(profile => {
      return profile.compatibleSensors.some(type => sensorTypes.includes(type));
    });
    
    setAvailableProfiles(compatibleProfiles.length > 0 ? compatibleProfiles : availableProfiles);
    setStep('profile');
  }, [sensorInfo, manualSensorConfig, availableProfiles]);

  // Update manual sensor configuration
  const updateManualSensorConfig = useCallback((config: SensorInfo[]) => {
    setManualSensorConfig(config);
  }, []);

  // Select a profile
  const selectProfile = useCallback((profile: DeviceProfile) => {
    setSelectedProfile(profile);
  }, []);

  // Flash the selected profile to the device
  const flashProfile = useCallback(async () => {
    if (!selectedProfile || !bluetoothService) {
      toast({
        title: 'Flash Error',
        description: 'No profile selected or device disconnected',
        variant: 'destructive',
      });
      return;
    }

    try {
      setStep('flashing');
      setProgress(0);

      // Get the profile characteristic
      const profileCharacteristic = await bluetoothService.getCharacteristic(PROFILE_CHARACTERISTIC_UUID);
      
      // Prepare the profile data
      const profileData = JSON.stringify(selectedProfile.configuration);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          return newProgress <= 90 ? newProgress : 90;
        });
      }, 250);

      // Write the profile data to the device
      const encoder = new TextEncoder();
      await profileCharacteristic.writeValue(encoder.encode(profileData));
      
      // Clear interval and set progress to 100%
      clearInterval(progressInterval);
      setProgress(100);
      
      toast({
        title: 'Profile Flashed',
        description: `Successfully flashed profile to device`,
      });

      // Wait a moment before proceeding
      setTimeout(() => {
        setStep('review');
      }, 1500);
    } catch (error) {
      console.error('Profile flashing error:', error);
      toast({
        title: 'Flash Error',
        description: error instanceof Error ? error.message : 'Failed to flash profile to device',
        variant: 'destructive',
      });
      setProgress(0);
    }
  }, [selectedProfile, bluetoothService, toast]);

  // Send a command to the device
  const sendCommand = useCallback(async (command: string, params: any = {}) => {
    if (!bluetoothService) {
      console.error('Device not connected');
      return false;
    }
    
    try {
      const commandCharacteristic = await bluetoothService.getCharacteristic(COMMAND_CHARACTERISTIC_UUID);
      const commandData = { command, ...params };
      const encoder = new TextEncoder();
      await commandCharacteristic.writeValue(encoder.encode(JSON.stringify(commandData)));
      return true;
    } catch (error) {
      console.error('Command error:', error);
      return false;
    }
  }, [bluetoothService]);

  // Start sensor calibration process
  const calibrateSensors = useCallback(async () => {
    const success = await sendCommand('CALIBRATE');
    if (success) {
      toast({
        title: 'Calibration',
        description: 'Sensor calibration started',
      });
      return true;
    } else {
      toast({
        title: 'Calibration Error',
        description: 'Failed to start sensor calibration',
        variant: 'destructive',
      });
      return false;
    }
  }, [sendCommand, toast]);

  // Finalize the onboarding process
  const finalizeOnboarding = useCallback(async () => {
    try {
      // Start streaming data
      await subscribeLiveData();
      const streamStarted = await sendCommand('START_STREAMING');
      
      if (!streamStarted) {
        throw new Error('Failed to start data streaming');
      }

      // Register the device with the backend
      const deviceData = {
        name: selectedDevice?.name || 'ESP32 Device',
        bluetoothAddress: selectedDevice?.id || '',
        sensors: sensorInfo.length > 0 ? sensorInfo : manualSensorConfig,
        profile: selectedProfile,
      };

      // Register device with backend
      const registrationResult = await registerDevice(deviceData);
      
      if (!registrationResult.success) {
        throw new Error('Device registration failed');
      }
      
      // Configure sensors
      await configureSensor(registrationResult.deviceId, deviceData.sensors);
      
      // Start backend stream
      await startStream(registrationResult.deviceId);
      
      toast({
        title: 'Device Registered',
        description: 'Your device has been successfully registered and is now streaming data.',
      });
      
      // Disconnect and redirect to the devices page
      disconnectDevice(false);
      router.push('/devices');
    } catch (error) {
      console.error('Finalization error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to finalize device setup',
        variant: 'destructive',
      });
    }
  }, [
    subscribeLiveData, 
    sendCommand, 
    selectedDevice, 
    sensorInfo, 
    manualSensorConfig, 
    selectedProfile, 
    disconnectDevice, 
    router, 
    toast
  ]);

  return {
    step,
    isScanning,
    devices,
    selectedDevice,
    sensorInfo,
    manualSensorConfig,
    availableProfiles,
    selectedProfile,
    progress,
    liveData,
    bluetoothAvailable,
    startScan,
    stopScan,
    selectDevice,
    connectToDevice,
    disconnectDevice,
    configureSensors,
    updateManualSensorConfig,
    selectProfile,
    flashProfile,
    finalizeOnboarding,
    calibrateSensors,
    sendCommand,
  };
} 