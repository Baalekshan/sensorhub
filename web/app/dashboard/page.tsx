'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsService } from '@/lib/api/analytics.service';
import { deviceService } from '@/lib/api/device.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import MainLayout from '@/components/layout/main-layout';
import { Activity, AlertTriangle, BarChart, ServerCrash, Server } from 'lucide-react';

interface DashboardSummary {
  totalDevices: number;
  onlineDevices: number;
  criticalAlerts: number;
  activeAlerts: number;
}

interface Device {
  id: string;
  name: string;
  createdAt: string;
  // Add other device properties as needed
}

interface Alert {
  id: string;
  message: string;
  deviceId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  // Add other alert properties as needed
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentDevices, setRecentDevices] = useState<Device[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { error } = useToastNotifications();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard summary
      const summaryData = await analyticsService.getDashboardSummary();
      setSummary(summaryData);
      
      // Fetch recent devices
      const devicesData = await deviceService.getAllDevices();
      setRecentDevices(devicesData.slice(0, 5));
      
      // Fetch recent alerts
      const alertsData = await analyticsService.getAlerts({
        status: 'ACTIVE'
      });
      setRecentAlerts(alertsData.slice(0, 5));
    } catch (err) {
      error('Failed to load dashboard data', 'Please try again later');
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCards = () => {
    if (!summary) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {summary.onlineDevices} online
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalDevices > 0 
                ? `${Math.round((summary.onlineDevices / summary.totalDevices) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalDevices - summary.onlineDevices} offline
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {summary.criticalAlerts} critical
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Device Health</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalDevices > 0 
                ? `${Math.round(((summary.totalDevices - summary.criticalAlerts) / summary.totalDevices) * 100)}%` 
                : '100%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.criticalAlerts} in critical state
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={() => loadDashboardData()}>Refresh</Button>
        </div>

        {renderSummaryCards()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Devices</CardTitle>
              <CardDescription>Recently registered devices in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDevices.length > 0 ? (
                <div className="space-y-4">
                  {recentDevices.map((device: any) => (
                    <div key={device.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                      <div>
                        <div className="font-semibold">{device.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(device.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/devices/${device.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No devices found
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Alerts that require attention</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {recentAlerts.map((alert: any) => (
                    <div key={alert.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                      <div>
                        <div className="font-semibold flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            alert.severity === 'CRITICAL' ? 'bg-red-500' :
                            alert.severity === 'HIGH' ? 'bg-orange-500' :
                            alert.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></span>
                          {alert.message}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Device: {alert.deviceId.substring(0, 8)}...
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/alerts')}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active alerts
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 