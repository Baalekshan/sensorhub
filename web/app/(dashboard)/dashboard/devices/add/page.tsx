"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeviceOnboarding } from '@/hooks/useDeviceOnboarding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bluetooth, Loader2, Cpu } from 'lucide-react';

export default function AddDevicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bluetooth');
  const {
    step,
    isScanning,
    devices,
    selectedDevice,
    sensorInfo,
    bluetoothAvailable,
    availableProfiles,
    selectedProfile,
    progress,
    startScan,
    stopScan,
    selectDevice,
    connectToDevice,
    configureSensors,
    selectProfile,
    flashProfile,
    finalizeOnboarding,
  } = useDeviceOnboarding();

  const handleCancel = () => {
    router.push('/dashboard/devices');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Device</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="bluetooth">
            <Bluetooth className="mr-2 h-4 w-4" />
            Bluetooth Setup
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Cpu className="mr-2 h-4 w-4" />
            Manual Setup
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bluetooth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bluetooth Device Setup</CardTitle>
              <CardDescription>
                Connect to your device using Bluetooth Low Energy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!bluetoothAvailable ? (
                <div className="p-4 border rounded-md bg-amber-50 text-amber-800 mb-4">
                  <p className="font-medium">Web Bluetooth Not Available</p>
                  <p className="text-sm mt-1">
                    Your browser doesn't support Web Bluetooth API. Please use Chrome, Edge, or another compatible browser.
                  </p>
                </div>
              ) : step === 'scan' ? (
                <div className="space-y-4">
                  <p>
                    Start scanning for nearby ESP32 devices with Bluetooth enabled. Make sure your device is powered on and in pairing mode.
                  </p>
                  <div className="flex space-x-4">
                    <Button onClick={startScan} disabled={isScanning}>
                      {isScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Bluetooth className="mr-2 h-4 w-4" />
                          Start Scan
                        </>
                      )}
                    </Button>
                    {isScanning && (
                      <Button variant="outline" onClick={stopScan}>
                        Stop Scan
                      </Button>
                    )}
                  </div>
                  
                  {devices.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Available Devices</h3>
                      <div className="space-y-2">
                        {devices.map((device) => (
                          <div 
                            key={device.id}
                            className={`p-3 border rounded-md cursor-pointer ${
                              selectedDevice?.id === device.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => selectDevice(device)}
                          >
                            <div className="font-medium">{device.name}</div>
                            <div className="text-xs text-muted-foreground">{device.id}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex space-x-4">
                        <Button 
                          onClick={connectToDevice} 
                          disabled={!selectedDevice}
                        >
                          Connect
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Processing device setup, please wait...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Device Setup</CardTitle>
              <CardDescription>
                Configure your device manually by entering its details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Manual setup allows you to register your device without using Bluetooth. 
                You'll need to enter device details like MAC address and sensor types.
              </p>
              <p className="text-sm text-muted-foreground">
                The manual setup functionality is coming soon. For now, please use Bluetooth setup.
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 