import httpClient, { apiRequest } from './http-client';

export interface SensorConfig {
  id: string;
  deviceId: string;
  sensorId: string;
  protocol: string;
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SensorProtocol {
  id: string;
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface CreateSensorConfigRequest {
  deviceId: string;
  sensorId: string;
  protocol: string;
  parameters: Record<string, any>;
}

export interface UpdateSensorConfigRequest {
  sensorId?: string;
  protocol?: string;
  parameters?: Record<string, any>;
}

export interface SensorData {
  deviceId: string;
  sensorId: string;
  timestamp: string;
  value: number;
  unit?: string;
  isAnomaly?: boolean;
}

export const sensorService = {
  async getSensorConfigs(deviceId: string): Promise<SensorConfig[]> {
    return await apiRequest<SensorConfig[]>({
      url: '/sensors/configs',
      method: 'GET',
      params: { deviceId }
    });
  },

  async getSensorConfigById(id: string): Promise<SensorConfig> {
    return await apiRequest<SensorConfig>({
      url: `/sensors/configs/${id}`,
      method: 'GET'
    });
  },

  async getAvailableProtocols(): Promise<SensorProtocol[]> {
    return await apiRequest<SensorProtocol[]>({
      url: '/sensors/protocols',
      method: 'GET'
    });
  },

  async createSensorConfig(config: CreateSensorConfigRequest): Promise<SensorConfig> {
    return await apiRequest<SensorConfig>({
      url: '/sensors/configs',
      method: 'POST',
      data: config
    });
  },

  async updateSensorConfig(id: string, config: UpdateSensorConfigRequest): Promise<SensorConfig> {
    return await apiRequest<SensorConfig>({
      url: `/sensors/configs/${id}`,
      method: 'PATCH',
      data: config
    });
  },

  async deleteSensorConfig(id: string): Promise<void> {
    await apiRequest<void>({
      url: `/sensors/configs/${id}`,
      method: 'DELETE'
    });
  },

  async getSuggestedProfiles(deviceId: string): Promise<SensorConfig[]> {
    return await apiRequest<SensorConfig[]>({
      url: '/sensors/suggested-profiles',
      method: 'GET',
      params: { deviceId }
    });
  },
  
  async calibrateSensor(deviceId: string, sensorId: string, calibrationData: any): Promise<void> {
    await apiRequest<void>({
      url: `/sensors/calibrate`,
      method: 'POST',
      data: {
        deviceId,
        sensorId,
        ...calibrationData
      }
    });
  },
  
  async getLatestSensorData(deviceId: string, sensorId?: string): Promise<SensorData[]> {
    return await apiRequest<SensorData[]>({
      url: '/sensors/latest-data',
      method: 'GET',
      params: {
        deviceId,
        sensorId
      }
    });
  }
}; 