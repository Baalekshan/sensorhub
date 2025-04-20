"use client"

import { useState } from 'react';
import Link from 'next/link';
import { ActivitySquare, Battery, DotIcon, Edit, ExternalLink, MoreHorizontal, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Mock data for devices
const mockDevices = [
  {
    id: '1',
    name: 'Soil Moisture Sensor',
    type: 'Soil Moisture',
    status: 'online',
    battery: 87,
    lastSync: '2 minutes ago',
    location: 'Greenhouse',
    group: 'Garden',
  },
  {
    id: '2',
    name: 'Greenhouse Temperature',
    type: 'Temperature',
    status: 'online',
    battery: 64,
    lastSync: '5 minutes ago',
    location: 'Greenhouse',
    group: 'Garden',
  },
  {
    id: '3',
    name: 'Water Level Sensor',
    type: 'Water Level',
    status: 'offline',
    battery: 22,
    lastSync: '3 hours ago',
    location: 'Garden Pond',
    group: 'Garden',
  },
  {
    id: '4',
    name: 'Indoor Humidity',
    type: 'Humidity',
    status: 'online',
    battery: 91,
    lastSync: '10 minutes ago',
    location: 'Living Room',
    group: 'Home',
  },
  {
    id: '5',
    name: 'Weather Station',
    type: 'Weather',
    status: 'online',
    battery: 76,
    lastSync: '15 minutes ago',
    location: 'Roof',
    group: 'Home',
  },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState(mockDevices);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(search.toLowerCase()) ||
    device.type.toLowerCase().includes(search.toLowerCase()) ||
    device.location.toLowerCase().includes(search.toLowerCase()) ||
    device.group.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemoveDevice = (id: string) => {
    // In a real app, this would call an API
    setDevices(devices.filter(device => device.id !== id));
    toast({
      title: "Device removed",
      description: "The device has been removed from your account.",
    });
  };

  const getDevicesGroupedBy = (key: 'group' | 'location') => {
    const groups: Record<string, typeof mockDevices> = {};
    
    filteredDevices.forEach(device => {
      const keyValue = device[key];
      if (!groups[keyValue]) {
        groups[keyValue] = [];
      }
      groups[keyValue].push(device);
    });
    
    return groups;
  };

  const groupedByGroup = getDevicesGroupedBy('group');
  const groupedByLocation = getDevicesGroupedBy('location');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Devices</h2>
          <p className="text-muted-foreground">
            Manage and monitor all your connected sensors.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/devices/add">
            <Plus className="mr-2 h-4 w-4" /> Add Device
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Input
          placeholder="Search devices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Devices</TabsTrigger>
          <TabsTrigger value="by-group">By Group</TabsTrigger>
          <TabsTrigger value="by-location">By Location</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDevices.map((device) => (
              <Card key={device.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center">
                    <ActivitySquare className="h-5 w-5" />
                    <CardTitle className="ml-2 text-sm font-medium">{device.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/devices/${device.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/devices/${device.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRemoveDevice(device.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between my-1">
                    <div className="flex items-center">
                      <Badge variant={device.status === 'online' ? 'default' : 'destructive'} className="mr-1">
                        {device.status === 'online' ? (
                          <Wifi className="mr-1 h-3 w-3" />
                        ) : (
                          <WifiOff className="mr-1 h-3 w-3" />
                        )}
                        {device.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span 
                        className={`text-sm ${
                          device.battery > 70 ? 'text-green-500' : 
                          device.battery > 30 ? 'text-amber-500' : 
                          'text-red-500'
                        }`}
                      >
                        {device.battery}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p>{device.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Sync</p>
                      <p>{device.lastSync}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p>{device.location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Group</p>
                      <p>{device.group}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="by-group" className="space-y-6">
          {Object.entries(groupedByGroup).map(([group, devices]) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold">{group}</h3>
                <Badge variant="outline" className="ml-2">
                  {devices.length} {devices.length === 1 ? 'device' : 'devices'}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => (
                  <Card key={device.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
                      <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                        {device.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p>{device.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p>{device.location}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Battery</p>
                          <p>{device.battery}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Sync</p>
                          <p>{device.lastSync}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                        <Link href={`/dashboard/devices/${device.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="by-location" className="space-y-6">
          {Object.entries(groupedByLocation).map(([location, devices]) => (
            <div key={location} className="space-y-3">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold">{location}</h3>
                <Badge variant="outline" className="ml-2">
                  {devices.length} {devices.length === 1 ? 'device' : 'devices'}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => (
                  <Card key={device.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
                      <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                        {device.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p>{device.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Group</p>
                          <p>{device.group}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Battery</p>
                          <p>{device.battery}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Sync</p>
                          <p>{device.lastSync}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                        <Link href={`/dashboard/devices/${device.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}