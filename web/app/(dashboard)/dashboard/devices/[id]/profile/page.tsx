'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useToastNotifications from '@/hooks/use-toast-notifications';
import { DeviceProfile, SensorInfo } from '@/hooks/useDeviceOnboarding';
import { Loader2, Settings2 } from 'lucide-react';

interface DeviceProfilePageProps {
  params: {
    id: string;
  };
}

interface DeviceDetails {
  name: string;
  bluetoothAddress: string;
  sensors: SensorInfo[];
  profile: DeviceProfile;
  lastSeen: string;
  isOnline: boolean;
}

export default function DeviceProfilePage({ params }: DeviceProfilePageProps) {
  const { id } = params;
  const { toast } = useToastNotifications();
  const [device, setDevice] = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        const mockDevice: DeviceDetails = {
          name: 'ESP32 Environment Sensor',
          bluetoothAddress: id,
          sensors: [
            {
              id: 'temp1',
              type: 'BME280',
              isCalibrated: true,
              isActive: true,
            },
            {
              id: 'humid1',
              type: 'BME280',
              isCalibrated: true,
              isActive: true,
            }
          ],
          profile: {
            id: 'temp-humidity',
            name: 'Temperature & Humidity Monitor',
            description: 'Optimized for temperature and humidity monitoring with 30-second intervals.',
            compatibleSensors: ['BME280', 'HDC1080', 'SHT31'],
            configuration: {
              sensors: [
                { id: 'temp1', active: true },
                { id: 'humid1', active: true },
              ],
              sampling: {
                interval: 30000,
              },
            },
          },
          lastSeen: new Date().toISOString(),
          isOnline: true,
        };

        setDevice(mockDevice);
      } catch (error) {
        console.error('Error fetching device details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load device details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-4">
        <Card className="bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">Device not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Device Profile</h1>
        <Button variant="outline">
          <Settings2 className="mr-2 h-4 w-4" />
          Edit Configuration
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Name</span>
                <span>{device.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Bluetooth Address</span>
                <span className="font-mono">{device.bluetoothAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{device.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Last Seen</span>
                <span>{new Date(device.lastSeen).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Active Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{device.profile.name}</h3>
                <p className="text-sm text-muted-foreground">{device.profile.description}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Sampling Configuration</h4>
                <p className="text-sm">
                  Interval: {device.profile.configuration.sampling.interval / 1000} seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sensors */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configured Sensors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {device.sensors.map((sensor) => (
                <div key={sensor.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{sensor.type}</h4>
                      <p className="text-sm text-muted-foreground">ID: {sensor.id}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      sensor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sensor.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span>Calibration:</span>
                      <div className={`h-2 w-2 rounded-full ${
                        sensor.isCalibrated ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <span>{sensor.isCalibrated ? 'Calibrated' : 'Needs Calibration'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 