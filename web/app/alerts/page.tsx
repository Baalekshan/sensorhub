'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsService, Alert } from '@/lib/api/analytics.service';
import { deviceService } from '@/lib/api/device.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import MainLayout from '@/components/layout/main-layout';
import { format } from 'date-fns';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const router = useRouter();
  const { success, error } = useToastNotifications();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, deviceFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load devices
      const devicesData = await deviceService.getAllDevices();
      setDevices(devicesData);
      
      // Load alerts
      await loadAlerts();
    } catch (err) {
      error('Failed to load data', 'Please try again later');
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const params: any = {};
      
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      
      if (deviceFilter !== 'ALL') {
        params.deviceId = deviceFilter;
      }
      
      const alertsData = await analyticsService.getAlerts(params);
      setAlerts(alertsData);
    } catch (err) {
      error('Failed to load alerts', 'Please try again later');
      console.error('Failed to load alerts:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await analyticsService.resolveAlert(alertId);
      success('Alert resolved', 'The alert has been marked as resolved');
      await loadAlerts();
    } catch (err) {
      error('Failed to resolve alert', 'Please try again later');
      console.error('Failed to resolve alert:', err);
    }
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : deviceId;
  };

  const getSeverityColor = (severity: string) => {
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (alerts.length === 0) {
      return (
        <div className="text-center py-12 bg-card rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No alerts found</h3>
          <p className="text-muted-foreground">
            {statusFilter !== 'ALL' || deviceFilter !== 'ALL'
              ? 'Try changing your filters to see more results'
              : 'Your system seems to be running smoothly'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
                <Badge variant={alert.status === 'ACTIVE' ? 'outline' : 'secondary'}>
                  {alert.status}
                </Badge>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{alert.message}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Device:</span>
                  <div>{getDeviceName(alert.deviceId)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Sensor ID:</span>
                  <div>{alert.sensorId}</div>
                </div>
              </div>
              
              {alert.reading && (
                <div className="bg-muted p-3 rounded-md mb-4">
                  <div className="text-sm font-medium mb-1">Reading Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Value:</span>
                      <div>{alert.reading.value}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Time:</span>
                      <div>{format(new Date(alert.reading.timestamp), 'HH:mm:ss')}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/devices/${alert.deviceId}`)}
                >
                  View Device
                </Button>
                {alert.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve Alert
                  </Button>
                )}
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
          <h1 className="text-3xl font-bold">Alerts</h1>
          <Button onClick={loadAlerts}>Refresh</Button>
        </div>

        <div className="bg-card p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Device</label>
              <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Devices</SelectItem>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </MainLayout>
  );
} 