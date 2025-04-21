import httpClient, { apiRequest } from './http-client';

export interface Device {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  modelNumber?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceRequest {
  name: string;
  modelNumber?: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  modelNumber?: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

export const deviceService = {
  async getAllDevices(): Promise<Device[]> {
    return await apiRequest<Device[]>({
      url: '/devices',
      method: 'GET'
    });
  },

  async getDeviceById(id: string): Promise<Device> {
    return await apiRequest<Device>({
      url: `/devices/${id}`,
      method: 'GET'
    });
  },

  async createDevice(deviceData: CreateDeviceRequest): Promise<Device> {
    return await apiRequest<Device>({
      url: '/devices',
      method: 'POST',
      data: deviceData
    });
  },

  async updateDevice(id: string, deviceData: UpdateDeviceRequest): Promise<Device> {
    return await apiRequest<Device>({
      url: `/devices/${id}`,
      method: 'PATCH',
      data: deviceData
    });
  },

  async deleteDevice(id: string): Promise<void> {
    await apiRequest<void>({
      url: `/devices/${id}`,
      method: 'DELETE'
    });
  },

  async getDeviceHealth(deviceId: string) {
    return await apiRequest({
      url: `/analytics/device-health/${deviceId}`,
      method: 'GET'
    });
  },

  async getDeviceReadings(deviceId: string, params: {
    startTime: string;
    endTime: string;
    interval?: string;
    sensorId?: string;
  }) {
    return await apiRequest({
      url: '/analytics/readings',
      method: 'GET',
      params: {
        deviceId,
        ...params
      }
    });
  },
  
  async restartDevice(deviceId: string): Promise<void> {
    await apiRequest<void>({
      url: `/devices/${deviceId}/restart`,
      method: 'POST'
    });
  },
  
  async factoryResetDevice(deviceId: string): Promise<void> {
    await apiRequest<void>({
      url: `/devices/${deviceId}/factory-reset`,
      method: 'POST'
    });
  }
}; 