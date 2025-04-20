import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDevices } from '@/hooks/useDevices';
import { colors } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { SensorReadingCard } from '@/components/SensorReadingCard';
import { DeviceInfoCard } from '@/components/DeviceInfoCard';
import { ChevronLeft, Settings, Wrench, Battery, RefreshCw } from 'lucide-react-native';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getDeviceById, refreshDevice } = useDevices();
  const [device, setDevice] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (id) {
      const deviceData = getDeviceById(id as string);
      setDevice(deviceData);
    }
  }, [id, getDeviceById]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) {
      const refreshedDevice = await refreshDevice(id as string);
      setDevice(refreshedDevice);
    }
    setRefreshing(false);
  };

  const handleCalibrateDevice = () => {
    router.push(`/devices/calibrate/${id}`);
  };

  const handleDeviceSettings = () => {
    router.push(`/devices/settings/${id}`);
  };

  if (!device) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Device Details"
          leftComponent={
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading device information...</Text>
        </View>
      </View>
    );
  }

  const getBatteryIcon = (level: number) => {
    if (level > 75) return <Battery size={16} color={colors.success} />;
    if (level > 30) return <Battery size={16} color={colors.warning} />;
    return <Battery size={16} color={colors.error} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return colors.success;
      case 'offline': return colors.error;
      case 'warning': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title={device.name}
        leftComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleDeviceSettings}>
            <Settings size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Device status information */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(device.status) }]} />
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>{device.status}</Text>
          </View>
          
          <View style={styles.statusItem}>
            {getBatteryIcon(device.batteryLevel)}
            <Text style={styles.statusLabel}>Battery</Text>
            <Text style={styles.statusValue}>{device.batteryLevel}%</Text>
          </View>
          
          <View style={styles.statusItem}>
            <RefreshCw size={16} color={colors.textSecondary} />
            <Text style={styles.statusLabel}>Last Update</Text>
            <Text style={styles.statusValue}>{device.lastUpdated}</Text>
          </View>
        </View>

        {/* Device information card */}
        <DeviceInfoCard device={device} />
        
        {/* Calibration button */}
        <TouchableOpacity 
          style={styles.calibrateButton}
          onPress={handleCalibrateDevice}
        >
          <Wrench size={20} color="#FFFFFF" style={styles.calibrateIcon} />
          <Text style={styles.calibrateText}>Calibrate Sensors</Text>
        </TouchableOpacity>
        
        {/* Sensor readings section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sensor Readings</Text>
          <Text style={styles.sectionSubtitle}>Real-time data from your device</Text>
        </View>
        
        {device.sensors.map((sensor: any) => (
          <SensorReadingCard
            key={sensor.id}
            sensor={sensor}
            onPress={() => router.push(`/sensors/${sensor.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  calibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  calibrateIcon: {
    marginRight: 8,
  },
  calibrateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});