import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDevices } from '@/hooks/useDevices';
import { colors } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { ChevronLeft, Bluetooth, RefreshCw, Info, Shield, AlertTriangle } from 'lucide-react-native';
import { DiscoveredDeviceItem } from '@/components/DiscoveredDeviceItem';
import * as SecureStore from 'expo-secure-store';

// Interface for device type
interface Device {
  id: string;
  name: string;
  rssi: number;
  type: string;
  status?: string;
  lastSeen?: string;
  firmwareVersion?: string;
}

export default function AddDeviceScreen() {
  const router = useRouter();
  const { scanForDevices, pairDevice } = useDevices();
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pairingDevice, setPairingDevice] = useState<string | null>(null);
  
  // Start scanning for devices automatically
  useEffect(() => {
    startScan();
    return () => {
      // Cleanup any ongoing scan operations
      if (scanning) {
        // Implement scan cleanup if needed
      }
    };
  }, []);
  
  // Handle device discovery scan
  const startScan = async () => {
    setScanning(true);
    setError(null);
    try {
      // Check if this is web platform (limited functionality)
      if (Platform.OS === 'web') {
        // In web environment, we'll use mock devices
        const mockDevices = [
          { id: 'device1', name: 'ESP32 Sensor Hub', rssi: -65, type: 'ESP32' },
          { id: 'device2', name: 'ESP32 Smart Garden', rssi: -72, type: 'ESP32' },
          { id: 'device3', name: 'ESP32 Weather Station', rssi: -88, type: 'ESP32' },
        ];
        
        // Simulate delay for scan
        await new Promise(resolve => setTimeout(resolve, 2000));
        setDiscoveredDevices(mockDevices);
      } else {
        // Check for Bluetooth permissions and availability
        const hasPermission = await checkBluetoothPermissions();
        if (!hasPermission) {
          setError('Bluetooth permission is required to scan for devices');
          return;
        }

        // Real device implementation for native platforms
        const devices = await scanForDevices();
        if (devices.length === 0) {
          setError('No devices found nearby. Make sure your devices are powered on and in range.');
        }
        setDiscoveredDevices(devices);
      }
    } catch (error: any) {
      console.error('Error scanning for devices:', error);
      setError(error.message || 'Failed to scan for devices. Please try again.');
    } finally {
      setScanning(false);
    }
  };
  
  // Check Bluetooth permissions
  const checkBluetoothPermissions = async () => {
    if (Platform.OS === 'web') return true;
    
    try {
      // Implement platform-specific Bluetooth permission checks
      // This is a placeholder - implement actual permission checks
      return true;
    } catch (error) {
      console.error('Error checking Bluetooth permissions:', error);
      return false;
    }
  };
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await startScan();
    setRefreshing(false);
  }, []);
  
  // Handle device selection and pairing
  const handleDeviceSelect = async (device: Device) => {
    // Show confirmation dialog
    if (Platform.OS === 'web') {
      if (!confirm(`Do you want to pair with ${device.name}?`)) {
        return;
      }
    } else {
      Alert.alert(
        'Pair Device',
        `Do you want to pair with ${device.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pair',
            onPress: () => initiateDevicePairing(device)
          }
        ]
      );
      return;
    }
    
    await initiateDevicePairing(device);
  };

  // Handle the actual device pairing process
  const initiateDevicePairing = async (device: Device) => {
    setPairingDevice(device.id);
    setError(null);
    
    try {
      await pairDevice(device);
      
      // Store the paired device info securely
      if (Platform.OS !== 'web') {
        await SecureStore.setItem(`device_${device.id}`, JSON.stringify({
          lastPaired: new Date().toISOString(),
          name: device.name,
          type: device.type
        }));
      }
      
      // Show success message
      if (Platform.OS === 'web') {
        alert('Device paired successfully!');
      } else {
        Alert.alert(
          'Success',
          'Device paired successfully!',
          [{ text: 'OK', onPress: () => router.replace('/devices') }]
        );
      }
    } catch (error: any) {
      console.error('Error pairing device:', error);
      setError(error.message || 'Failed to pair device. Please try again.');
      
      // Show error message
      if (Platform.OS === 'web') {
        alert('Failed to pair device. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to pair device. Please try again.');
      }
    } finally {
      setPairingDevice(null);
    }
  };
  
  // Get signal strength indicator
  const getSignalStrength = (rssi: number) => {
    if (rssi >= -65) return 'Excellent';
    if (rssi >= -75) return 'Good';
    if (rssi >= -85) return 'Fair';
    return 'Poor';
  };

  // Render list item with memo for performance
  const renderDeviceItem = useCallback(({ item }: { item: Device }) => (
    <DiscoveredDeviceItem
      device={item}
      signalStrength={getSignalStrength(item.rssi)}
      onPress={() => handleDeviceSelect(item)}
      isPairing={pairingDevice === item.id}
    />
  ), [pairingDevice]);

  // Optimize list performance
  const keyExtractor = useCallback((item: Device) => item.id, []);
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 80, // Adjust based on your item height
    offset: 80 * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Add Device"
        subtitle="Discover and connect your ESP32 sensors"
        leftComponent={
          <TouchableOpacity 
            onPress={() => router.back()}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {/* Bluetooth status indicator */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Bluetooth size={24} color={colors.primary} />
            <Text style={styles.statusTitle}>Bluetooth Scanning</Text>
          </View>
          <Text style={styles.statusDescription}>
            Make sure your ESP32 device is powered on and within range.
            {Platform.OS === 'web' ? ' Limited functionality in web mode.' : ''}
          </Text>
          
          <TouchableOpacity 
            style={[styles.scanButton, scanning && styles.scanningButton]} 
            onPress={startScan}
            disabled={scanning}
            accessible={true}
            accessibilityLabel={scanning ? "Scanning for devices" : "Scan for devices"}
            accessibilityRole="button"
            accessibilityState={{ disabled: scanning }}
          >
            {scanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" style={styles.scanningIcon} />
            ) : (
              <RefreshCw size={20} color="#FFFFFF" style={styles.scanIcon} />
            )}
            <Text style={styles.scanButtonText}>
              {scanning ? 'Scanning...' : 'Scan for Devices'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Discovered devices list */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>Discovered Devices</Text>
          <FlatList
            data={discoveredDevices}
            keyExtractor={keyExtractor}
            renderItem={renderDeviceItem}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.devicesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {scanning ? (
                  <Text style={styles.emptyText}>Searching for devices...</Text>
                ) : (
                  <>
                    <Text style={styles.emptyTitle}>No devices found</Text>
                    <Text style={styles.emptyText}>
                      Make sure your device is powered on and in pairing mode,
                      then try scanning again.
                    </Text>
                  </>
                )}
              </View>
            }
          />
        </View>
        
        {/* Pairing instructions */}
        {discoveredDevices.length > 0 && (
          <View style={styles.helpCard}>
            <View style={styles.helpIconContainer}>
              <Info size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>How to pair your device</Text>
              <Text style={styles.helpText}>
                1. Select your device from the list above{'\n'}
                2. Confirm the pairing code on your device{'\n'}
                3. Wait for connection to complete
              </Text>
            </View>
          </View>
        )}
        
        {/* Security note */}
        <View style={styles.securityNote}>
          <Shield size={16} color={colors.textSecondary} style={styles.securityIcon} />
          <Text style={styles.securityText}>
            All connections are secure and encrypted
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  statusDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  scanningButton: {
    backgroundColor: colors.primaryLight,
  },
  scanIcon: {
    marginRight: 8,
  },
  scanningIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
  devicesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  devicesList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpIconContainer: {
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  securityIcon: {
    marginRight: 8,
  },
  securityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});