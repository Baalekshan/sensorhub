import React, { useState, useEffect } from 'react';
import { SensorInfo } from '../../hooks/useDeviceOnboarding';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Thermometer, Droplets, Wind, Sun, Gauge, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface SensorConfigFormProps {
  sensorInfo: SensorInfo[];
  manualConfig: SensorInfo[];
  onChange: (config: SensorInfo[]) => void;
}

// Available sensor types and their icons
const sensorTypes = [
  { value: 'BME280', label: 'Temperature', icon: <Thermometer className="h-4 w-4" /> },
  { value: 'HDC1080', label: 'Humidity', icon: <Droplets className="h-4 w-4" /> },
  { value: 'SHT31', label: 'Humidity/Temp', icon: <Droplets className="h-4 w-4" /> },
  { value: 'CCS811', label: 'Air Quality', icon: <Wind className="h-4 w-4" /> },
  { value: 'BH1750', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'TSL2591', label: 'Light (High Precision)', icon: <Sun className="h-4 w-4" /> },
  { value: 'MPU6050', label: 'Accelerometer', icon: <Gauge className="h-4 w-4" /> },
  { value: 'ANALOG_TEMPERATURE', label: 'Analog Temperature', icon: <Thermometer className="h-4 w-4" /> },
];

export function SensorConfigForm({ sensorInfo, manualConfig, onChange }: SensorConfigFormProps) {
  // Use detected sensors if available, otherwise use manual config
  const [sensors, setSensors] = useState<SensorInfo[]>([]);
  const isManualMode = sensorInfo.length === 0;

  useEffect(() => {
    setSensors(isManualMode ? manualConfig : sensorInfo);
  }, [sensorInfo, manualConfig, isManualMode]);

  // Update sensors state and propagate changes
  const updateSensors = (newSensors: SensorInfo[]) => {
    setSensors(newSensors);
    if (isManualMode) {
      onChange(newSensors);
    }
  };

  // Toggle sensor active state
  const toggleActive = (index: number) => {
    const newSensors = [...sensors];
    newSensors[index].isActive = !newSensors[index].isActive;
    updateSensors(newSensors);
  };

  // Add a new sensor (manual mode only)
  const addSensor = () => {
    if (!isManualMode) return;
    
    const newSensor: SensorInfo = {
      id: `manual-${Date.now()}`,
      type: 'BME280',
      isCalibrated: false,
      isActive: true,
    };
    
    updateSensors([...sensors, newSensor]);
  };

  // Remove a sensor (manual mode only)
  const removeSensor = (index: number) => {
    if (!isManualMode) return;
    
    const newSensors = [...sensors];
    newSensors.splice(index, 1);
    updateSensors(newSensors);
  };

  // Update sensor type (manual mode only)
  const updateSensorType = (index: number, type: string) => {
    if (!isManualMode) return;
    
    const newSensors = [...sensors];
    newSensors[index].type = type;
    updateSensors(newSensors);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          {isManualMode ? 'Manual Sensor Configuration' : 'Detected Sensors'}
        </h3>
        {isManualMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={addSensor}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Sensor
          </Button>
        )}
      </div>

      {sensors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No sensors configured. Add sensors to continue.
        </div>
      ) : (
        <div className="space-y-3">
          {sensors.map((sensor, index) => {
            const sensorType = sensorTypes.find(type => type.value === sensor.type);
            
            return (
              <Card key={sensor.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
                      {sensorType?.icon || <Gauge className="h-5 w-5 text-slate-600" />}
                    </div>
                    
                    {isManualMode ? (
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`sensor-type-${index}`} className="text-xs">Type</Label>
                          <Select
                            value={sensor.type}
                            onValueChange={(value) => updateSensorType(index, value)}
                          >
                            <SelectTrigger id={`sensor-type-${index}`}>
                              <SelectValue placeholder="Select sensor type" />
                            </SelectTrigger>
                            <SelectContent>
                              {sensorTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center">
                                    {type.icon}
                                    <span className="ml-2">{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`sensor-id-${index}`} className="text-xs">ID</Label>
                          <Input
                            id={`sensor-id-${index}`}
                            value={sensor.id}
                            disabled
                            className="bg-slate-50"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{sensorType?.label || sensor.type}</p>
                        <p className="text-xs text-muted-foreground">ID: {sensor.id}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`sensor-active-${index}`}
                        checked={sensor.isActive}
                        onCheckedChange={() => toggleActive(index)}
                      />
                      <Label htmlFor={`sensor-active-${index}`} className="text-sm">
                        {sensor.isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    
                    {isManualMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSensor(index)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 