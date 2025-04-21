'use client';

import { useEffect, useState } from 'react';
import { deviceService } from '@/lib/api/device.service';
import { analyticsService, Alert, DeviceHealthStatus } from '@/lib/api/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DeviceAnalytics {
  deviceId: string;
  deviceName: string;
  health: DeviceHealthStatus;
  alerts: Alert[];
  readings: {
    timestamp: string;
    value: number;
  }[];
}

export default function AnalyticsPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [analytics, setAnalytics] = useState<DeviceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadAnalytics();
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const devicesData = await deviceService.getAllDevices();
      setDevices(devicesData);
      if (devicesData.length > 0) {
        setSelectedDevice(devicesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load devices',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [health, alerts, readings] = await Promise.all([
        analyticsService.getDeviceHealth(selectedDevice),
        analyticsService.getAlerts({ deviceId: selectedDevice }),
        analyticsService.getDeviceReadings({
          deviceId: selectedDevice,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
          interval: '1h'
        })
      ]);

      const device = devices.find(d => d.id === selectedDevice);
      setAnalytics({
        deviceId: selectedDevice,
        deviceName: device?.name || '',
        health,
        alerts,
        readings: readings.datapoints.map((point: any) => ({
          timestamp: point.timestamp,
          value: point.value
        }))
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load device analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Device Analytics</h1>
        <Select value={selectedDevice} onValueChange={setSelectedDevice}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a device" />
          </SelectTrigger>
          <SelectContent>
            {devices.map(device => (
              <SelectItem key={device.id} value={device.id}>
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Overall Status:</span>
                    <Badge className={getHealthColor(analytics.health.overall)}>
                      {analytics.health.overall}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage:</span>
                    <span>{analytics.health.resources.memory.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CPU Load:</span>
                    <span>{analytics.health.resources.cpu.load.toFixed(1)}%</span>
                  </div>
                  {analytics.health.battery && (
                    <div className="flex justify-between">
                      <span>Battery Level:</span>
                      <span>{analytics.health.battery.level}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.alerts.filter(alert => alert.status === 'ACTIVE').map(alert => (
                    <div key={alert.id} className="flex justify-between items-center">
                      <span>{alert.message}</span>
                      <Badge className={getAlertColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Device Name:</span>
                    <span>{analytics.deviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Seen:</span>
                    <span>{new Date(analytics.health.lastSeen).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{Math.floor(analytics.health.uptime / 3600)} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sensor Readings (Last 24 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.readings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 