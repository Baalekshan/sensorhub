import { useContext } from 'react';
import { DeviceContext } from '@/context/DeviceContext';

export function useDevices() {
  return useContext(DeviceContext);
}