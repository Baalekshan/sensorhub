import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { createLiveDataStream } from '../lib/api';

interface UseLiveDataOptions {
  deviceId?: string;
  onData?: (data: any) => void;
  autoConnect?: boolean;
}

export function useLiveData({
  deviceId,
  onData,
  autoConnect = true,
}: UseLiveDataOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastData, setLastData] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    
    try {
      const newSocket = io(`${protocol}//${host}`, {
        path: '/api/socket.io',
        transports: ['websocket'],
      });
      
      newSocket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        
        if (deviceId) {
          newSocket.emit('subscribeToDevice', deviceId, (response: any) => {
            if (!response.success) {
              setError(new Error(response.message || 'Failed to subscribe to device'));
            }
          });
        }
      });
      
      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });
      
      newSocket.on('connect_error', (err) => {
        setError(err);
        setIsConnected(false);
      });
      
      if (deviceId) {
        newSocket.on(`sensorData`, (data) => {
          if (data.deviceId === deviceId) {
            handleData(data);
          }
        });
      }
      
      setSocket(newSocket);
      
      return () => {
        if (deviceId) {
          newSocket.emit('unsubscribeFromDevice', deviceId);
        }
        newSocket.disconnect();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket server'));
      return () => {/* no cleanup needed */};
    }
  }, [autoConnect, deviceId]);
  
  // Setup separate WebBluetooth live data stream if needed
  useEffect(() => {
    if (!deviceId) return;
    
    try {
      const cleanup = createLiveDataStream(deviceId, handleData);
      setCleanupFunction(() => cleanup);
      
      return () => {
        if (cleanup) cleanup();
        setCleanupFunction(null);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create live data stream'));
    }
  }, [deviceId]);
  
  // Handle incoming data
  const handleData = useCallback((data: any) => {
    setLastData(data);
    setDataHistory(prev => {
      const newHistory = [...prev, data];
      // Keep last 100 data points
      if (newHistory.length > 100) {
        return newHistory.slice(-100);
      }
      return newHistory;
    });
    
    if (onData) {
      onData(data);
    }
  }, [onData]);
  
  // Subscribe to a device
  const subscribeToDevice = useCallback((deviceId: string) => {
    if (!socket) return false;
    
    socket.emit('subscribeToDevice', deviceId, (response: any) => {
      if (!response.success) {
        setError(new Error(response.message || 'Failed to subscribe to device'));
      }
    });
    
    return true;
  }, [socket]);
  
  // Unsubscribe from a device
  const unsubscribeFromDevice = useCallback((deviceId: string) => {
    if (!socket) return false;
    
    socket.emit('unsubscribeFromDevice', deviceId);
    return true;
  }, [socket]);
  
  // Clear the data history
  const clearHistory = useCallback(() => {
    setDataHistory([]);
  }, []);
  
  return {
    isConnected,
    error,
    lastData,
    dataHistory,
    socket,
    subscribeToDevice,
    unsubscribeFromDevice,
    clearHistory,
  };
} 