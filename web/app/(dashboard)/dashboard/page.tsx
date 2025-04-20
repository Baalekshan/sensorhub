"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ActivitySquare, 
  AlertCircle, 
  Battery, 
  BatteryWarning, 
  ChevronRight, 
  Clock, 
  Cpu, 
  Plus, 
  Signal, 
  ThermometerSun, 
  Wifi, 
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '@/context/auth-context';

// Mock data for the dashboard
const recentMockDevices = [
  {
    id: '1',
    name: 'Soil Moisture Sensor',
    type: 'Soil Moisture',
    status: 'online',
    battery: 87,
    lastSync: '2 minutes ago',
    reading: '42%',
    unit: '%',
    statusClass: 'text-green-500',
    batteryClass: 'bg-green-500',
    icon: <ActivitySquare className="h-5 w-5" />,
  },
  {
    id: '2',
    name: 'Greenhouse Temperature',
    type: 'Temperature',
    status: 'online',
    battery: 64,
    lastSync: '5 minutes ago',
    reading: '26°C',
    unit: '°C',
    statusClass: 'text-green-500',
    batteryClass: 'bg-green-500',
    icon: <ThermometerSun className="h-5 w-5" />,
  },
  {
    id: '3',
    name: 'Water Level Sensor',
    type: 'Water Level',
    status: 'offline',
    battery: 22,
    lastSync: '3 hours ago',
    reading: '18%',
    unit: '%',
    statusClass: 'text-red-500',
    batteryClass: 'bg-red-500',
    icon: <ActivitySquare className="h-5 w-5" />,
  },
];

const mockAlerts = [
  {
    id: '1',
    device: 'Water Level Sensor',
    message: 'Battery level critically low',
    time: '2 hours ago',
    severity: 'high',
    icon: <BatteryWarning className="h-5 w-5" />,
  },
  {
    id: '2',
    device: 'Greenhouse Temperature',
    message: 'Temperature above normal range',
    time: '3 hours ago',
    severity: 'medium',
    icon: <AlertCircle className="h-5 w-5" />,
  },
];

const mockChartData = [
  { time: '00:00', temp: 22, humidity: 45 },
  { time: '02:00', temp: 21, humidity: 48 },
  { time: '04:00', temp: 19, humidity: 52 },
  { time: '06:00', temp: 18, humidity: 55 },
  { time: '08:00', temp: 20, humidity: 49 },
  { time: '10:00', temp: 24, humidity: 45 },
  { time: '12:00', temp: 27, humidity: 40 },
  { time: '14:00', temp: 28, humidity: 37 },
  { time: '16:00', temp: 26, humidity: 39 },
  { time: '18:00', temp: 24, humidity: 42 },
  { time: '20:00', temp: 22, humidity: 45 },
  { time: '22:00', temp: 21, humidity: 47 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState(recentMockDevices);
  const [stats, setStats] = useState({
    totalDevices: 5,
    onlineDevices: 4,
    activeAlerts: 2,
    dataPoints: '12.4K',
  });
  
  useEffect(() => {
    // This would be a real API call in production
    // fetchDevices() 
    // fetchStats()
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's an overview of your sensor network.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/devices/add">
            <Plus className="mr-2 h-4 w-4" /> Add Device
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">Devices in your network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Status</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineDevices}/{stats.totalDevices}</div>
            <Progress
              value={(stats.onlineDevices / stats.totalDevices) * 100}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">Devices currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Alerts requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataPoints}</div>
            <p className="text-xs text-muted-foreground">Total readings today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center">
                    {device.icon}
                    <CardTitle className="ml-2 text-sm font-medium">{device.name}</CardTitle>
                  </div>
                  <Badge variant={device.status === 'online' ? 'default' : 'destructive'} className="ml-auto">
                    {device.status === 'online' ? (
                      <Wifi className="mr-1 h-3 w-3" />
                    ) : (
                      <WifiOff className="mr-1 h-3 w-3" />
                    )}
                    {device.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{device.battery}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{device.lastSync}</span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <div className="text-2xl font-bold">{device.reading}</div>
                    <p className="text-xs text-muted-foreground">{device.type}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-1">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/devices/${device.id}`}>
                      View Details <ChevronRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Sensor Readings</CardTitle>
              <CardDescription>
                Temperature and humidity trends from your main sensors
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockChartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="hsl(var(--chart-1))" 
                      name="Temperature (°C)"
                      strokeWidth={2}
                      dot={{ strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="hsl(var(--chart-2))" 
                      name="Humidity (%)"
                      strokeWidth={2}
                      dot={{ strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                Notifications requiring your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className={`rounded-full p-2 ${
                      alert.severity === 'high' ? 'bg-destructive/10 text-destructive' : 
                      alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {alert.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-none">{alert.device}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/alerts">View All Alerts</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}