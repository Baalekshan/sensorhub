'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deviceService, CreateDeviceRequest } from '@/lib/api/device.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import MainLayout from '@/components/layout/main-layout';

export default function NewDevicePage() {
  const [formData, setFormData] = useState<CreateDeviceRequest>({
    name: '',
    modelNumber: '',
    serialNumber: '',
    firmwareVersion: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToastNotifications();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Validation Error', 'Device name is required');
      return;
    }

    try {
      setLoading(true);
      await deviceService.createDevice(formData);
      success('Device Created', 'Device has been successfully added');
      router.push('/devices');
    } catch (err) {
      error('Failed to create device', 'Please try again later');
      console.error('Failed to create device:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Add New Device</h1>
          <Button variant="outline" onClick={() => router.push('/devices')}>
            Back to Devices
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter device name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input
                  id="modelNumber"
                  name="modelNumber"
                  value={formData.modelNumber}
                  onChange={handleChange}
                  placeholder="Enter model number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Enter serial number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmwareVersion">Firmware Version</Label>
                <Input
                  id="firmwareVersion"
                  name="firmwareVersion"
                  value={formData.firmwareVersion}
                  onChange={handleChange}
                  placeholder="Enter firmware version"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Device'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 