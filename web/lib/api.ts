/**
 * API functions for the ESP32 device onboarding and data streaming
 */

import axios from 'axios';
import { SensorInfo } from '@/hooks/useDeviceOnboarding';

// API base URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Register a new device with the backend
 * @param deviceData Device registration data
 * @returns Registration result with success status and deviceId
 */
export async function registerDevice(deviceData: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/devices/register`, deviceData);
    return {
      success: true,
      deviceId: response.data.id,
      ...response.data
    };
  } catch (error) {
    console.error('Error registering device:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Configure sensors for a device
 * @param deviceId Device ID
 * @param sensorData Sensor configuration data
 * @returns Configuration result
 */
export async function configureSensor(deviceId: string, sensorData: SensorInfo[]) {
  try {
    const response = await axios.post(`${API_BASE_URL}/devices/${deviceId}/configure`, {
      sensors: sensorData
    });
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error configuring sensors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Start streaming data from a device
 * @param deviceId Device ID
 * @returns Stream start result
 */
export async function startStream(deviceId: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/devices/${deviceId}/start-stream`);
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error starting stream:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send sensor data to the backend
 * @param deviceId Device ID
 * @param sensorData Sensor reading data
 * @returns Send result
 */
export async function sendSensorData(deviceId: string, sensorData: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/devices/${deviceId}/data`, sensorData);
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error sending sensor data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get available profiles for a device with specific sensors
 * @param sensorTypes Array of sensor types
 * @returns List of compatible profiles
 */
export async function getCompatibleProfiles(sensorTypes: string[]) {
  try {
    const response = await axios.post(`${API_BASE_URL}/profiles/compatible`, {
      sensorTypes
    });
    return {
      success: true,
      profiles: response.data
    };
  } catch (error) {
    console.error('Error getting compatible profiles:', error);
    return {
      success: false,
      profiles: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a WebSocket connection for live data streaming
 * @param deviceId Device ID
 * @param onData Callback for incoming data
 * @returns WebSocket cleanup function
 */
export function createLiveDataStream(deviceId: string, onData: (data: any) => void) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
  const ws = new WebSocket(`${protocol}//${host}/api/devices/${deviceId}/live`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onData(data);
    } catch (error) {
      console.error('Error parsing WebSocket data:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  // Return cleanup function
  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
} 