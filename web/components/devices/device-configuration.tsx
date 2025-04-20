import React from 'react';
import { SensorInfo, DeviceProfile, BluetoothDevice } from '../../hooks/useDeviceOnboarding';
import { Card, CardContent } from '../ui/card';
import { Bluetooth, Cpu, Settings, Clock, Zap, Waves } from 'lucide-react';

interface DeviceConfigurationProps {
  device: BluetoothDevice | null;
  sensors: SensorInfo[];
  profile: DeviceProfile | null;
}

// Sensor icons mapping
const sensorIcons: Record<string, React.ReactNode> = {
  'BME280': <Zap className="h-4 w-4 text-blue-500" />,
  'HDC1080': <Waves className="h-4 w-4 text-green-500" />,
  'SHT31': <Waves className="h-4 w-4 text-green-500" />,
  'CCS811': <Zap className="h-4 w-4 text-purple-500" />,
  'BH1750': <Zap className="h-4 w-4 text-yellow-500" />,
  'TSL2591': <Zap className="h-4 w-4 text-yellow-500" />,
  'MPU6050': <Zap className="h-4 w-4 text-red-500" />,
  'ANALOG_TEMPERATURE': <Waves className="h-4 w-4 text-blue-500" />,
};

// Profile icons mapping
const profileIcons: Record<string, React.ReactNode> = {
  'temp-humidity': <Waves className="h-5 w-5 text-blue-500" />,
  'air-quality': <Zap className="h-5 w-5 text-green-500" />,
  'full-environment': <Clock className="h-5 w-5 text-purple-500" />,
};

export function DeviceConfiguration({ device, sensors, profile }: DeviceConfigurationProps) {
  if (!device || !profile) {
    return <div>Missing device or profile information</div>;
  }

  // Get active sensors
  const activeSensors = sensors.filter(sensor => sensor.isActive);

  return (
    <div className="space-y-6">
      {/* Device Information */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
              <Bluetooth className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium">Device Information</h3>
              <p className="text-xs text-muted-foreground">Basic device details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{device.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bluetooth ID</p>
              <p className="font-medium truncate">{device.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sensors Configuration */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
              <Cpu className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium">Sensors</h3>
              <p className="text-xs text-muted-foreground">{activeSensors.length} active sensors</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            {activeSensors.length === 0 ? (
              <p className="text-muted-foreground">No active sensors configured</p>
            ) : (
              activeSensors.map(sensor => (
                <div key={sensor.id} className="flex items-center space-x-2">
                  {sensorIcons[sensor.type] || <Cpu className="h-4 w-4 text-slate-500" />}
                  <span className="font-medium">{sensor.type}</span>
                  <span className="text-xs text-muted-foreground">({sensor.id})</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Profile Configuration */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
              {profileIcons[profile.id] || <Settings className="h-5 w-5 text-slate-600" />}
            </div>
            <div>
              <h3 className="font-medium">{profile.name}</h3>
              <p className="text-xs text-muted-foreground">{profile.description}</p>
            </div>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sampling Interval</p>
              <p className="font-medium">{profile.configuration.sampling.interval / 1000} seconds</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Compatible Sensors</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.compatibleSensors.map(sensor => (
                  <span key={sensor} className="bg-slate-100 px-2 py-1 rounded-full text-xs">
                    {sensor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Data Streaming */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
              <Zap className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-medium">Data Streaming</h3>
              <p className="text-xs text-muted-foreground">
                Upon completion, the device will begin streaming data to the server
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 