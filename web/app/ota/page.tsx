'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deviceService, Device } from '@/lib/api/device.service';
import { otaService, FirmwareVersion, FirmwareUpdateJob } from '@/lib/api/ota.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import MainLayout from '@/components/layout/main-layout';
import { Progress } from '@/components/ui/progress';

export default function OtaUpdatePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [firmwareVersions, setFirmwareVersions] = useState<FirmwareVersion[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedFirmware, setSelectedFirmware] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<FirmwareUpdateJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { success, error } = useToastNotifications();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      checkUpdateStatus();
    }
  }, [selectedDevice]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load devices and firmware versions in parallel
      const [devicesData, firmwareData] = await Promise.all([
        deviceService.getAllDevices(),
        otaService.getAvailableFirmwareVersions()
      ]);
      
      setDevices(devicesData);
      setFirmwareVersions(firmwareData);
      
      // Set first device as selected if available
      if (devicesData.length > 0) {
        setSelectedDevice(devicesData[0].id);
      }
    } catch (err) {
      error('Failed to load data', 'Please try again later');
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkUpdateStatus = async () => {
    try {
      const status = await otaService.getUpdateStatus(selectedDevice);
      setUpdateStatus(status);
    } catch (err) {
      console.error('Failed to check update status:', err);
      setUpdateStatus(null);
    }
  };

  const startUpdate = async () => {
    if (!selectedDevice || !selectedFirmware) {
      error('Missing information', 'Please select both device and firmware version');
      return;
    }

    try {
      setUpdating(true);
      await otaService.scheduleUpdate(selectedDevice, selectedFirmware);
      success('Update scheduled', 'Firmware update has been scheduled');
      
      // Check status immediately after scheduling
      await checkUpdateStatus();
    } catch (err) {
      error('Failed to schedule update', 'Please try again later');
      console.error('Failed to schedule update:', err);
    } finally {
      setUpdating(false);
    }
  };

  const cancelUpdate = async () => {
    if (!updateStatus) return;

    try {
      setUpdating(true);
      await otaService.cancelUpdate(updateStatus.id);
      success('Update cancelled', 'Firmware update has been cancelled');
      
      // Refresh status
      await checkUpdateStatus();
    } catch (err) {
      error('Failed to cancel update', 'Please try again later');
      console.error('Failed to cancel update:', err);
    } finally {
      setUpdating(false);
    }
  };

  const renderUpdateStatus = () => {
    if (!updateStatus) return null;

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge 
                className={
                  updateStatus.status === 'COMPLETED' ? 'bg-green-500' :
                  updateStatus.status === 'FAILED' ? 'bg-red-500' :
                  updateStatus.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }
              >
                {updateStatus.status}
              </Badge>
            </div>
            
            {updateStatus.progress !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span>{updateStatus.progress}%</span>
                </div>
                <Progress value={updateStatus.progress} className="w-full" />
              </div>
            )}
            
            {updateStatus.startedAt && (
              <div className="flex justify-between">
                <span>Started:</span>
                <span>{new Date(updateStatus.startedAt).toLocaleString()}</span>
              </div>
            )}
            
            {updateStatus.completedAt && (
              <div className="flex justify-between">
                <span>Completed:</span>
                <span>{new Date(updateStatus.completedAt).toLocaleString()}</span>
              </div>
            )}
            
            {updateStatus.errorMessage && (
              <div className="mt-2 text-red-500">
                Error: {updateStatus.errorMessage}
              </div>
            )}
            
            {updateStatus.status === 'PENDING' || updateStatus.status === 'IN_PROGRESS' ? (
              <Button 
                variant="destructive" 
                className="w-full mt-4"
                onClick={cancelUpdate}
                disabled={updating}
              >
                Cancel Update
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={checkUpdateStatus}
              >
                Refresh Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return (
      <>
        {renderUpdateStatus()}
        
        <Card>
          <CardHeader>
            <CardTitle>Schedule Firmware Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Device</label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} ({device.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Firmware Version</label>
                <Select value={selectedFirmware} onValueChange={setSelectedFirmware}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select firmware version" />
                  </SelectTrigger>
                  <SelectContent>
                    {firmwareVersions.map(firmware => (
                      <SelectItem key={firmware.id} value={firmware.id}>
                        {firmware.version} ({firmware.isStable ? 'Stable' : 'Beta'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full"
                onClick={startUpdate}
                disabled={!selectedDevice || !selectedFirmware || updating || 
                  (updateStatus?.status === 'PENDING' || updateStatus?.status === 'IN_PROGRESS')}
              >
                {updating ? 'Scheduling...' : 'Schedule Update'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Firmware Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {firmwareVersions.map(firmware => (
                  <div key={firmware.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium flex items-center">
                          {firmware.version}
                          {firmware.isStable && (
                            <Badge className="ml-2 bg-green-500">Stable</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Released on: {new Date(firmware.releaseDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge>{firmware.deviceModel}</Badge>
                    </div>
                    
                    <div className="mt-2 text-sm">{firmware.description}</div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Size: {(firmware.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">OTA Updates</h1>
          <Button variant="outline" onClick={loadInitialData}>
            Refresh
          </Button>
        </div>

        {renderContent()}
      </div>
    </MainLayout>
  );
} 