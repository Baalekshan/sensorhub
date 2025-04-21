"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { useDeviceOnboarding } from '@/hooks/useDeviceOnboarding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bluetooth, Loader2, Cpu } from 'lucide-react';

export default function AddDevicePage() {
  const router = useRouter();
  const { toast } = useToastNotifications();
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
    disconnectDevice,
    configureSensors,
    selectProfile,
    flashProfile,
    finalizeOnboarding,
    setStep,
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
              ) : step === 'configure' ? (
                <div className="space-y-4">
                  <p>Device connected successfully! Found {sensorInfo.length} sensors.</p>
                  <div className="space-y-2">
                    {sensorInfo.map((sensor, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <div className="font-medium">{sensor.type}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {sensor.id} | Status: {sensor.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={configureSensors}>
                      Continue to Profile Selection
                    </Button>
                    <Button variant="outline" onClick={() => disconnectDevice(true)}>
                      Back
                    </Button>
                  </div>
                </div>
              ) : step === 'profile' ? (
                <div className="space-y-4">
                  <p>Select a profile for your device:</p>
                  <div className="space-y-2">
                    {availableProfiles.map((profile) => (
                      <div 
                        key={profile.id}
                        className={`p-3 border rounded-md cursor-pointer ${
                          selectedProfile?.id === profile.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => selectProfile(profile)}
                      >
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm">{profile.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      onClick={flashProfile}
                      disabled={!selectedProfile}
                    >
                      Apply Profile
                    </Button>
                    <Button variant="outline" onClick={() => setStep('configure')}>
                      Back
                    </Button>
                  </div>
                </div>
              ) : step === 'flashing' ? (
                <div className="space-y-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p>Applying profile to device...</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : step === 'review' ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-green-50">
                    <h3 className="font-medium text-green-800">Device Setup Complete!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your device has been configured successfully.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Device Summary:</p>
                    <div className="text-sm space-y-1">
                      <p>Name: {selectedDevice?.name}</p>
                      <p>Profile: {selectedProfile?.name}</p>
                      <p>Sensors: {sensorInfo.length}</p>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={finalizeOnboarding}>
                      Finish Setup
                    </Button>
                    <Button variant="outline" onClick={() => setStep('profile')}>
                      Back
                    </Button>
                  </div>
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