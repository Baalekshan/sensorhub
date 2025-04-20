import { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Mock device data
const mockDevices = [
  {
    id: 'device1',
    name: 'Home ESP32 Sensor Hub',
    type: 'ESP32',
    location: 'Living Room',
    status: 'online',
    batteryLevel: 85,
    lastUpdated: '10 min ago',
    firmwareVersion: '1.2.3',
    wifiStrength: -67,
    ipAddress: '192.168.1.105',
    sensors: [
      {
        id: 'sensor1',
        name: 'Temperature',
        type: 'temperature',
        value: 24.5,
        unit: '°C',
        status: 'normal',
        minValue: 10,
        maxValue: 35,
        lastUpdated: '1 min ago',
      },
      {
        id: 'sensor2',
        name: 'Humidity',
        type: 'humidity',
        value: 48,
        unit: '%',
        status: 'normal',
        minValue: 30,
        maxValue: 60,
        lastUpdated: '1 min ago',
      },
      {
        id: 'sensor3',
        name: 'CO2 Level',
        type: 'gas',
        value: 650,
        unit: 'ppm',
        status: 'normal',
        minValue: 400,
        maxValue: 1000,
        lastUpdated: '2 min ago',
      },
    ],
  },
  {
    id: 'device2',
    name: 'Garden Monitor',
    type: 'ESP32',
    location: 'Garden',
    status: 'warning',
    batteryLevel: 32,
    lastUpdated: '25 min ago',
    firmwareVersion: '1.1.0',
    wifiStrength: -78,
    ipAddress: '192.168.1.106',
    sensors: [
      {
        id: 'sensor4',
        name: 'Soil Moisture',
        type: 'moisture',
        value: 22,
        unit: '%',
        status: 'warning',
        minValue: 30,
        maxValue: 80,
        lastUpdated: '25 min ago',
      },
      {
        id: 'sensor5',
        name: 'Light Level',
        type: 'light',
        value: 870,
        unit: 'lux',
        status: 'normal',
        minValue: 100,
        maxValue: 2000,
        lastUpdated: '25 min ago',
      },
      {
        id: 'sensor6',
        name: 'Temperature',
        type: 'temperature',
        value: 28.2,
        unit: '°C',
        status: 'normal',
        minValue: 10,
        maxValue: 40,
        lastUpdated: '25 min ago',
      },
    ],
  },
  {
    id: 'device3',
    name: 'Garage Monitor',
    type: 'ESP32',
    location: 'Garage',
    status: 'offline',
    batteryLevel: 0,
    lastUpdated: '2 days ago',
    firmwareVersion: '1.0.5',
    wifiStrength: -90,
    ipAddress: '192.168.1.107',
    sensors: [
      {
        id: 'sensor7',
        name: 'Gas Detector',
        type: 'gas',
        value: 120,
        unit: 'ppm',
        status: 'critical',
        minValue: 0,
        maxValue: 50,
        lastUpdated: '2 days ago',
      },
      {
        id: 'sensor8',
        name: 'Temperature',
        type: 'temperature',
        value: 18.3,
        unit: '°C',
        status: 'normal',
        minValue: 5,
        maxValue: 30,
        lastUpdated: '2 days ago',
      },
    ],
  },
];

// Define context type
type DeviceContextType = {
  devices: any[] | null;
  isLoading: boolean;
  fetchDevices: () => Promise<void>;
  getDeviceById: (id: string) => any;
  refreshDevice: (id: string) => Promise<any>;
  pairDevice: (device: any) => Promise<void>;
  calibrateSensor: (id: string) => Promise<void>;
  scanForDevices: () => Promise<any[]>;
};

// Create the context
export const DeviceContext = createContext<DeviceContextType>({
  devices: null,
  isLoading: true,
  fetchDevices: async () => {},
  getDeviceById: () => null,
  refreshDevice: async () => null,
  pairDevice: async () => {},
  calibrateSensor: async () => {},
  scanForDevices: async () => [],
});

// Storage helper for web platform
const webStorage = {
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    return Promise.resolve(value);
  },
};

// Use SecureStore on native platforms, localStorage on web
const storage = Platform.OS === 'web' ? webStorage : SecureStore;

// Create the provider component
export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);
  
  // Fetch devices from storage or API
  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // Try to load from storage first
      const storedDevices = await storage.getItem('devices');
      
      if (storedDevices) {
        setDevices(JSON.parse(storedDevices));
      } else {
        // If no stored devices, use mock data
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setDevices(mockDevices);
        // Save to storage
        await storage.setItem('devices', JSON.stringify(mockDevices));
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      // Fallback to mock data if storage fails
      setDevices(mockDevices);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get a specific device by ID
  const getDeviceById = (id: string) => {
    if (!devices) return null;
    return devices.find(device => device.id === id) || null;
  };
  
  // Refresh a specific device (simulate fetching new data)
  const refreshDevice = async (id: string) => {
    if (!devices) return null;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const deviceIndex = devices.findIndex(device => device.id === id);
    if (deviceIndex === -1) return null;
    
    // Create a copy of the device and update some values to simulate refresh
    const updatedDevice = { ...devices[deviceIndex] };
    
    // Update some values to simulate refreshed data
    updatedDevice.lastUpdated = '1 min ago';
    
    // Update sensors with new values
    updatedDevice.sensors = updatedDevice.sensors.map((sensor: any) => ({
      ...sensor,
      value: sensor.type === 'temperature' 
        ? Math.round((sensor.value + (Math.random() * 2 - 1)) * 10) / 10
        : sensor.type === 'humidity' || sensor.type === 'moisture'
        ? Math.min(100, Math.max(0, Math.round(sensor.value + (Math.random() * 10 - 5))))
        : Math.round(sensor.value + (Math.random() * 50 - 25)),
      lastUpdated: '1 min ago',
      // Update status based on new value
      status: ((value: number, min: number, max: number) => {
        if (value < min * 0.8 || value > max * 1.2) return 'critical';
        if (value < min || value > max) return 'warning';
        return 'normal';
      })(sensor.value, sensor.minValue, sensor.maxValue),
    }));
    
    // Check if any sensors are in warning or critical state
    const hasWarning = updatedDevice.sensors.some((s: any) => s.status === 'warning');
    const hasCritical = updatedDevice.sensors.some((s: any) => s.status === 'critical');
    
    // Update device status based on sensor statuses
    if (updatedDevice.status !== 'offline') {
      updatedDevice.status = hasCritical ? 'critical' : hasWarning ? 'warning' : 'online';
    }
    
    // Update the devices array
    const updatedDevices = [...devices];
    updatedDevices[deviceIndex] = updatedDevice;
    
    // Update state and storage
    setDevices(updatedDevices);
    await storage.setItem('devices', JSON.stringify(updatedDevices));
    
    return updatedDevice;
  };
  
  // Pair a new device
  const pairDevice = async (device: any) => {
    // Simulate pairing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a new device with the discovered properties and additional defaults
    const newDevice = {
      id: device.id,
      name: device.name,
      type: device.type || 'ESP32',
      location: 'New Location',
      status: 'online',
      batteryLevel: Math.floor(Math.random() * 30) + 70, // Random battery level between 70-100
      lastUpdated: 'Just now',
      firmwareVersion: '1.0.0',
      wifiStrength: device.rssi || -65,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 100) + 100}`,
      sensors: [
        {
          id: `${device.id}-temp`,
          name: 'Temperature',
          type: 'temperature',
          value: Math.floor(Math.random() * 10) + 20, // Random temperature between 20-30
          unit: '°C',
          status: 'normal',
          minValue: 15,
          maxValue: 30,
          lastUpdated: 'Just now',
        },
        {
          id: `${device.id}-humid`,
          name: 'Humidity',
          type: 'humidity',
          value: Math.floor(Math.random() * 20) + 40, // Random humidity between 40-60
          unit: '%',
          status: 'normal',
          minValue: 30,
          maxValue: 70,
          lastUpdated: 'Just now',
        },
      ],
    };
    
    // Add the new device to the list
    const updatedDevices = devices ? [...devices, newDevice] : [newDevice];
    setDevices(updatedDevices);
    
    // Update storage
    await storage.setItem('devices', JSON.stringify(updatedDevices));
  };
  
  // Calibrate a device's sensors
  const calibrateSensor = async (id: string) => {
    if (!devices) return;
    
    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deviceIndex = devices.findIndex(device => device.id === id);
    if (deviceIndex === -1) return;
    
    // Create a copy of the device and update sensor calibration
    const updatedDevice = { ...devices[deviceIndex] };
    
    // Update sensors with calibrated values
    updatedDevice.sensors = updatedDevice.sensors.map((sensor: any) => ({
      ...sensor,
      // Reset sensor status to normal
      status: 'normal',
      // Adjust min/max values to better fit current value
      minValue: Math.round(sensor.value * 0.7),
      maxValue: Math.round(sensor.value * 1.3),
      lastUpdated: 'Just now',
    }));
    
    // Update device status to online
    updatedDevice.status = 'online';
    updatedDevice.lastUpdated = 'Just now';
    
    // Update the devices array
    const updatedDevices = [...devices];
    updatedDevices[deviceIndex] = updatedDevice;
    
    // Update state and storage
    setDevices(updatedDevices);
    await storage.setItem('devices', JSON.stringify(updatedDevices));
  };
  
  // Scan for nearby devices
  const scanForDevices = async () => {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock discovered devices
    const discoveredDevices = [
      { id: 'disc1', name: 'ESP32 Sensor Hub', rssi: -65, type: 'ESP32' },
      { id: 'disc2', name: 'ESP32 Soil Monitor', rssi: -72, type: 'ESP32' },
      { id: 'disc3', name: 'ESP32 Weather Station', rssi: -80, type: 'ESP32' },
    ];
    
    return discoveredDevices;
  };
  
  return (
    <DeviceContext.Provider 
      value={{ 
        devices, 
        isLoading, 
        fetchDevices, 
        getDeviceById, 
        refreshDevice,
        pairDevice,
        calibrateSensor,
        scanForDevices,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}