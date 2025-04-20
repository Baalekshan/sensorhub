import { useEffect, useState } from 'react';
import { BluetoothDevice } from '../../hooks/useDeviceOnboarding';
import { Card, CardContent } from '../ui/card';
import { Bluetooth, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DeviceListProps {
  devices: BluetoothDevice[];
  selectedDevice: BluetoothDevice | null;
  onSelect: (device: BluetoothDevice) => void;
}

export function DeviceList({ devices, selectedDevice, onSelect }: DeviceListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Available Devices</h3>
      {devices.map((device) => (
        <Card 
          key={device.id}
          className={`cursor-pointer transition-colors hover:bg-slate-50 ${
            selectedDevice?.id === device.id ? 'border-primary' : ''
          }`}
          onClick={() => onSelect(device)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
                <Bluetooth className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.id}</p>
              </div>
            </div>
            {selectedDevice?.id === device.id ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 