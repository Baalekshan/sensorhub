import httpClient, { apiRequest } from './http-client';

export interface FirmwareVersion {
  id: string;
  version: string;
  releaseDate: string;
  deviceModel: string;
  description: string;
  size: number;
  releaseNotes?: string;
  fileUrl: string;
  isStable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirmwareUpdateJob {
  id: string;
  deviceId: string;
  firmwareVersionId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export const otaService = {
  async getAvailableFirmwareVersions(deviceModel?: string): Promise<FirmwareVersion[]> {
    return await apiRequest<FirmwareVersion[]>({
      url: '/ota/firmware',
      method: 'GET',
      params: { deviceModel }
    });
  },
  
  async getFirmwareVersion(id: string): Promise<FirmwareVersion> {
    return await apiRequest<FirmwareVersion>({
      url: `/ota/firmware/${id}`,
      method: 'GET'
    });
  },
  
  async uploadFirmware(formData: FormData): Promise<FirmwareVersion> {
    return await apiRequest<FirmwareVersion>({
      url: '/ota/firmware',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  async updateFirmwareMetadata(id: string, metadata: Partial<FirmwareVersion>): Promise<FirmwareVersion> {
    return await apiRequest<FirmwareVersion>({
      url: `/ota/firmware/${id}`,
      method: 'PATCH',
      data: metadata
    });
  },
  
  async deleteFirmwareVersion(id: string): Promise<void> {
    await apiRequest<void>({
      url: `/ota/firmware/${id}`,
      method: 'DELETE'
    });
  },
  
  async scheduleUpdate(deviceId: string, firmwareVersionId: string): Promise<FirmwareUpdateJob> {
    return await apiRequest<FirmwareUpdateJob>({
      url: '/ota/update',
      method: 'POST',
      data: {
        deviceId,
        firmwareVersionId
      }
    });
  },
  
  async cancelUpdate(updateId: string): Promise<void> {
    await apiRequest<void>({
      url: `/ota/update/${updateId}/cancel`,
      method: 'POST'
    });
  },
  
  async getUpdateStatus(deviceId: string): Promise<FirmwareUpdateJob | null> {
    try {
      return await apiRequest<FirmwareUpdateJob>({
        url: `/ota/update/status/${deviceId}`,
        method: 'GET'
      });
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
  
  async getUpdateHistory(deviceId: string): Promise<FirmwareUpdateJob[]> {
    return await apiRequest<FirmwareUpdateJob[]>({
      url: '/ota/update/history',
      method: 'GET',
      params: { deviceId }
    });
  }
}; 