'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deviceService, Device } from '@/lib/api/device.service';
import { analyticsService, DeviceHealthStatus } from '@/lib/api/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import MainLayout from '@/components/layout/main-layout';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceHealth, setDeviceHealth] = useState<Record<string, DeviceHealthStatus>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { error } = useToastNotifications();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const devicesData = await deviceService.getAllDevices();
      setDevices(devicesData);

      // Load health data for each device
      const healthData: Record<string, DeviceHealthStatus> = {};
      await Promise.all(devicesData.map(async (device) => {
        try {
          const health = await analyticsService.getDeviceHealth(device.id);
          healthData[device.id] = health;
        } catch (err) {
          console.error(`Failed to load health data for device ${device.id}:`, err);
        }
      }));
      
      setDeviceHealth(healthData);
    } catch (err) {
      error('Failed to load devices', 'Please try again later');
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500';
      case 'OFFLINE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'CRITICAL':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (devices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <h3 className="text-xl font-semibold mb-4">No devices found</h3>
          <p className="text-gray-500 mb-6">Add your first device to start monitoring</p>
          <Button onClick={() => router.push('/devices/new')}>
            Add New Device
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{device.name}</CardTitle>
                <Badge className={getStatusColor(device.status)}>
                  {device.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Device ID:</span>
                  <span className="font-mono">{device.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Seen:</span>
                  <span>{new Date(device.lastSeenAt).toLocaleString()}</span>
                </div>
                {deviceHealth[device.id] && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Health:</span>
                    <Badge className={getHealthColor(deviceHealth[device.id].overall)}>
                      {deviceHealth[device.id].overall}
                    </Badge>
                  </div>
                )}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/devices/${device.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Devices</h1>
          <Button onClick={() => router.push('/devices/new')}>
            Add New Device
          </Button>
        </div>

        {renderContent()}
      </div>
    </MainLayout>
  );
} 