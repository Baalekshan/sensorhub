'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sensorService, SensorConfig, SensorProtocol } from '@/lib/api/sensor.service';
import { deviceService } from '@/lib/api/device.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface FormData {
  sensorId: string;
  [key: string]: string | number;
}

export default function DeviceSensorsPage() {
  const { id: deviceId } = useParams();
  const [sensorConfigs, setSensorConfigs] = useState<SensorConfig[]>([]);
  const [protocols, setProtocols] = useState<SensorProtocol[]>([]);
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({ sensorId: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deviceData, configs, protocolsData] = await Promise.all([
        deviceService.getDeviceById(deviceId as string),
        sensorService.getSensorConfigs(deviceId as string),
        sensorService.getAvailableProtocols()
      ]);
      setDevice(deviceData);
      setSensorConfigs(configs);
      setProtocols(protocolsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load device and sensor data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolChange = (value: string) => {
    setSelectedProtocol(value);
    const protocol = protocols.find(p => p.id === value);
    if (protocol) {
      const initialFormData: FormData = { sensorId: '' };
      protocol.parameters.forEach(param => {
        initialFormData[param.name] = '';
      });
      setFormData(initialFormData);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newConfig: Omit<SensorConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        deviceId: deviceId as string,
        sensorId: formData.sensorId,
        protocol: selectedProtocol,
        parameters: formData
      };
      await sensorService.createSensorConfig(newConfig);
      toast({
        title: 'Success',
        description: 'Sensor configuration created successfully'
      });
      loadData();
    } catch (error) {
      console.error('Failed to create sensor config:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sensor configuration',
        variant: 'destructive'
      });
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
        <h1 className="text-3xl font-bold">Sensor Configuration</h1>
        <h2 className="text-xl text-gray-600">{device?.name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocol</Label>
                <Select onValueChange={handleProtocolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    {protocols.map(protocol => (
                      <SelectItem key={protocol.id} value={protocol.id}>
                        {protocol.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sensorId">Sensor ID</Label>
                <Input
                  id="sensorId"
                  type="text"
                  required
                  value={formData.sensorId}
                  onChange={(e) => handleInputChange('sensorId', e.target.value)}
                  placeholder="Enter sensor ID"
                />
              </div>

              {selectedProtocol && protocols.find(p => p.id === selectedProtocol)?.parameters.map(param => (
                <div key={param.name} className="space-y-2">
                  <Label htmlFor={param.name}>{param.name}</Label>
                  <Input
                    id={param.name}
                    type={param.type === 'number' ? 'number' : 'text'}
                    required={param.required}
                    value={formData[param.name] || ''}
                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                    placeholder={param.description}
                  />
                </div>
              ))}

              <Button type="submit" className="w-full">
                Add Sensor
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configured Sensors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sensorConfigs.map(config => (
                <Card key={config.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Sensor ID: {config.sensorId}</h3>
                      <p className="text-sm text-gray-500">Protocol: {config.protocol}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit functionality
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 