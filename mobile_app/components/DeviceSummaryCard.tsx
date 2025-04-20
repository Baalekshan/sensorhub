import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Cpu, BatteryMedium, Wifi, AlertTriangle } from 'lucide-react-native';

interface DeviceSummaryCardProps {
  device: any;
  onPress?: () => void;
}

export function DeviceSummaryCard({ device, onPress }: DeviceSummaryCardProps) {
  // Get status color based on device status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return colors.success;
      case 'offline':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };
  
  // Get battery icon and color based on battery level
  const getBatteryInfo = (level: number) => {
    let color = colors.success;
    
    if (level < 20) {
      color = colors.error;
    } else if (level < 50) {
      color = colors.warning;
    }
    
    return { icon: <BatteryMedium size={16} color={color} />, color };
  };
  
  // Get wifi strength icon and color based on signal strength
  const getWifiInfo = (strength: number) => {
    let color = colors.success;
    
    if (strength < -80) {
      color = colors.error;
    } else if (strength < -70) {
      color = colors.warning;
    }
    
    return { icon: <Wifi size={16} color={color} />, color };
  };
  
  // Check if device has sensors in warning or critical state
  const hasWarnings = device.sensors.some((s: any) => s.status === 'warning' || s.status === 'critical');
  
  // Get battery display
  const batteryInfo = getBatteryInfo(device.batteryLevel);
  
  // Get wifi display
  const wifiInfo = getWifiInfo(device.wifiStrength);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Cpu size={20} color={colors.primary} />
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.location}>{device.location}</Text>
        </View>
        
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(device.status) }]} />
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          {batteryInfo.icon}
          <Text style={styles.infoText}>{device.batteryLevel}%</Text>
        </View>
        
        <View style={styles.infoItem}>
          {wifiInfo.icon}
          <Text style={styles.infoText}>{device.wifiStrength} dBm</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>{device.lastUpdated}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.sensorsContainer}>
        <Text style={styles.sensorsTitle}>Sensors ({device.sensors.length})</Text>
        
        <View style={styles.sensorsList}>
          {device.sensors.slice(0, 3).map((sensor: any) => (
            <View key={sensor.id} style={styles.sensorItem}>
              <View 
                style={[
                  styles.sensorStatusDot, 
                  { backgroundColor: getStatusColor(sensor.status) }
                ]} 
              />
              <Text style={styles.sensorName}>{sensor.name}</Text>
              <Text style={styles.sensorValue}>{sensor.value}{sensor.unit}</Text>
            </View>
          ))}
          
          {device.sensors.length > 3 && (
            <Text style={styles.moreSensors}>+{device.sensors.length - 3} more</Text>
          )}
        </View>
        
        {hasWarnings && (
          <View style={styles.warningContainer}>
            <AlertTriangle size={16} color={colors.warning} />
            <Text style={styles.warningText}>Attention needed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  deviceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  sensorsContainer: {
  },
  sensorsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sensorsList: {
  },
  sensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sensorStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sensorName: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
  sensorValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  moreSensors: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.warning,
    marginLeft: 6,
  },
});