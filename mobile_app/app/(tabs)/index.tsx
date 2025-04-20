import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useDevices } from '@/hooks/useDevices';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import { DashboardCard } from '@/components/DashboardCard';
import { SensorReadingCard } from '@/components/SensorReadingCard';
import { DeviceSummaryCard } from '@/components/DeviceSummaryCard';
import { PageHeader } from '@/components/PageHeader';
import { Plus, RefreshCw } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const { devices, isLoading, fetchDevices } = useDevices();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  // Get the current time of day to customize greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  // Get most critical sensor reading across all devices
  const getMostCriticalSensor = () => {
    if (!devices || devices.length === 0) return null;
    
    let criticalSensor = null;
    let highestPriority = -1;
    
    devices.forEach(device => {
      device.sensors.forEach(sensor => {
        // Higher priority means more critical (0: normal, 1: warning, 2: critical)
        const priority = sensor.status === 'critical' ? 2 : sensor.status === 'warning' ? 1 : 0;
        
        if (priority > highestPriority) {
          highestPriority = priority;
          criticalSensor = { ...sensor, deviceName: device.name, deviceId: device.id };
        }
      });
    });
    
    return criticalSensor;
  };

  const criticalSensor = getMostCriticalSensor();
  
  // Count devices by status
  const deviceStats = {
    total: devices?.length || 0,
    online: devices?.filter(d => d.status === 'online').length || 0,
    offline: devices?.filter(d => d.status === 'offline').length || 0,
    warning: devices?.filter(d => d.status === 'warning').length || 0,
  };

  const handleAddDevice = () => {
    router.push('/devices/add');
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title={`${getGreeting()}, ${user?.displayName || 'User'}`}
        subtitle="Here's what's happening with your sensors"
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
        {/* Device stats summary */}
        <View style={styles.statsContainer}>
          <DashboardCard 
            title="Devices"
            value={deviceStats.total.toString()}
            subtitle="Total connected"
            color={colors.primary}
          />
          <DashboardCard 
            title="Online"
            value={deviceStats.online.toString()}
            subtitle="Active now"
            color={colors.success}
          />
          <DashboardCard 
            title="Alerts"
            value={deviceStats.warning.toString()}
            subtitle="Need attention"
            color={deviceStats.warning > 0 ? colors.warning : colors.textSecondary}
          />
        </View>

        {/* Critical sensor alert (if any) */}
        {criticalSensor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Critical Alert</Text>
            <SensorReadingCard
              sensor={criticalSensor}
              deviceName={criticalSensor.deviceName}
              onPress={() => router.push(`/devices/${criticalSensor.deviceId}`)}
            />
          </View>
        )}
        
        {/* Recent devices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Devices</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/devices')}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <Text style={styles.loadingText}>Loading devices...</Text>
          ) : devices && devices.length > 0 ? (
            devices.slice(0, 3).map(device => (
              <DeviceSummaryCard
                key={device.id}
                device={device}
                onPress={() => router.push(`/devices/${device.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No devices found</Text>
              <TouchableOpacity 
                style={styles.addDeviceButton}
                onPress={handleAddDevice}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addDeviceText}>Add Device</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    color: colors.primary,
    fontSize: 14,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    marginVertical: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addDeviceText: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
});