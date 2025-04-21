import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { ArrowRight, Bluetooth, RefreshCw, Loader2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/ui/use-toast';
import { useDeviceOnboarding } from '../../../hooks/useDeviceOnboarding';
import { DeviceList } from '../../../components/devices/device-list';
import { SensorConfigForm } from '../../../components/devices/sensor-config-form';
import { ProfileSelector } from '../../../components/devices/profile-selector';
import { DeviceConfiguration } from '../../../components/devices/device-configuration';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Progress } from '../../../components/ui/progress';

export default function AddDevicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    step,
    isScanning,
    devices,
    selectedDevice,
    sensorInfo,
    availableProfiles,
    selectedProfile,
    progress,
    bluetoothAvailable,
    startScan,
    stopScan,
    selectDevice,
    connectToDevice,
    configureSensors,
    selectProfile,
    flashProfile,
    finalizeOnboarding,
    disconnectDevice,
    manualSensorConfig,
    updateManualSensorConfig,
  } = useDeviceOnboarding();

  // Function to display step-specific content
  const renderStepContent = () => {
    switch (step) {
      case 'scan':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Find Your Device</CardTitle>
              <CardDescription>
                Press the scan button to search for nearby ESP32 devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!bluetoothAvailable && (
                <Alert variant="destructive">
                  <AlertTitle>Web Bluetooth is not supported</AlertTitle>
                  <AlertDescription>
                    Your browser does not support Web Bluetooth or it's disabled.
                    Please use a supported browser like Chrome or Edge.
                  </AlertDescription>
                </Alert>
              )}
              
              {devices.length > 0 && <DeviceList devices={devices} onSelect={selectDevice} selectedDevice={selectedDevice} />}
              
              {isScanning && devices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
                  <p className="mt-4 text-center text-muted-foreground">Scanning for devices...</p>
                </div>
              )}
              
              {!isScanning && devices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Bluetooth className="h-16 w-16 text-muted-foreground" />
                  <p className="mt-4 text-center text-muted-foreground">
                    No devices found. Make sure your ESP32 device is powered on and in range.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/devices')}>
                Cancel
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant={isScanning ? "destructive" : "secondary"}
                  onClick={isScanning ? stopScan : startScan}
                  disabled={!bluetoothAvailable}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Stop Scanning
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Scan for Devices
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => connectToDevice()}
                  disabled={!selectedDevice || isScanning}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </>
        );

      case 'configure':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Configure Sensors</CardTitle>
              <CardDescription>
                {sensorInfo.length > 0 
                  ? "The following sensors were detected. Please verify or modify the configuration."
                  : "No sensors were automatically detected. Please manually configure your sensors."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SensorConfigForm 
                sensorInfo={sensorInfo} 
                manualConfig={manualSensorConfig}
                onChange={updateManualSensorConfig}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                disconnectDevice();
              }}>
                Back
              </Button>
              <Button onClick={configureSensors}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );

      case 'profile':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Select a Profile</CardTitle>
              <CardDescription>
                Choose a profile that matches your sensor configuration and use case.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileSelector 
                profiles={availableProfiles} 
                selectedProfile={selectedProfile}
                onSelect={selectProfile}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => disconnectDevice(true)}>
                Back
              </Button>
              <Button 
                onClick={flashProfile}
                disabled={!selectedProfile}
              >
                Flash Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );

      case 'flashing':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Flashing Profile</CardTitle>
              <CardDescription>
                Flashing the selected profile to your device. Please don't disconnect your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="py-8">
                <Progress value={progress} className="h-2 mb-4" />
                <p className="text-center text-muted-foreground">
                  {progress < 100 ? "Flashing profile..." : "Profile successfully flashed!"}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={finalizeOnboarding}
                disabled={progress < 100}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );

      case 'review':
        return (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Device Configuration</CardTitle>
              <CardDescription>
                Review your device configuration before finishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DeviceConfiguration 
                device={selectedDevice}
                sensors={sensorInfo.length > 0 ? sensorInfo : manualSensorConfig}
                profile={selectedProfile}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => disconnectDevice(true)}>
                Back
              </Button>
              <Button onClick={finalizeOnboarding}>
                Finish Setup
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-8">Add a New Device</h1>
      <Card>{renderStepContent()}</Card>
    </div>
  );
} 