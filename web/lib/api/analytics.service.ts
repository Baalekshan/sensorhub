import httpClient, { apiRequest } from './http-client';

export interface DeviceHealthStatus {
  deviceId: string;
  timestamp: string;
  overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  resources: {
    memory: {
      status: 'OK' | 'WARNING' | 'CRITICAL';
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      status: 'OK' | 'WARNING' | 'CRITICAL';
      load: number;
    };
    flash: {
      status: 'OK' | 'WARNING' | 'CRITICAL';
      used: number;
      total: number;
      percentage: number;
    };
  };
  battery?: {
    status: 'OK' | 'WARNING' | 'CRITICAL';
    level: number;
    charging: boolean;
    estimatedHoursRemaining?: number;
  };
  connectivity: {
    status: 'OK' | 'WARNING' | 'CRITICAL';
    signalStrength?: number;
    latency?: number;
    packetLoss?: number;
  };
  uptime: number;
  lastSeen: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  sensorId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  status: 'ACTIVE' | 'RESOLVED';
  reading?: {
    value: number;
    timestamp: string;
  };
}

export interface ReadingsQuery {
  deviceId: string;
  sensorId?: string;
  startTime: string;
  endTime: string;
  interval?: string;
}

export interface TrendAnalysisOptions {
  deviceId: string;
  sensorId: string;
  startTime: string;
  endTime: string;
  interval: string;
  detectSeasonality?: boolean;
  detectChangePoints?: boolean;
}

export interface AggregatedReadings {
  deviceId: string;
  sensorId: string;
  timerange: {
    start: string;
    end: string;
  };
  interval: string;
  datapoints: {
    timestamp: string;
    value: number;
    min?: number;
    max?: number;
    count?: number;
  }[];
}

export interface AlertsQuery {
  deviceId?: string;
  sensorId?: string;
  startTime?: string;
  endTime?: string;
  status?: 'ACTIVE' | 'RESOLVED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const analyticsService = {
  async getDeviceHealth(deviceId: string): Promise<DeviceHealthStatus> {
    return await apiRequest<DeviceHealthStatus>({
      url: `/analytics/device-health/${deviceId}`,
      method: 'GET'
    });
  },

  async getDeviceReadings(params: ReadingsQuery): Promise<AggregatedReadings> {
    return await apiRequest<AggregatedReadings>({
      url: '/analytics/readings',
      method: 'GET',
      params
    });
  },

  async getAlerts(params: AlertsQuery): Promise<Alert[]> {
    return await apiRequest<Alert[]>({
      url: '/analytics/alerts',
      method: 'GET',
      params
    });
  },

  async getTrendAnalysis(params: TrendAnalysisOptions) {
    return await apiRequest({
      url: '/analytics/trends',
      method: 'GET',
      params
    });
  },
  
  async resolveAlert(alertId: string): Promise<Alert> {
    return await apiRequest<Alert>({
      url: `/analytics/alerts/${alertId}/resolve`,
      method: 'POST'
    });
  },
  
  async acknowledgeAlert(alertId: string): Promise<Alert> {
    return await apiRequest<Alert>({
      url: `/analytics/alerts/${alertId}/acknowledge`,
      method: 'POST'
    });
  },
  
  async getDashboardSummary(): Promise<{
    totalDevices: number;
    onlineDevices: number;
    criticalAlerts: number;
    activeAlerts: number;
  }> {
    return await apiRequest({
      url: '/analytics/dashboard-summary',
      method: 'GET'
    });
  }
}; 