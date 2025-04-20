import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Cpu, ChevronRight, AlertTriangle } from 'lucide-react-native';

interface DeviceListItemProps {
  device: any;
  onPress?: () => void;
}

export function DeviceListItem({ device, onPress }: DeviceListItemProps) {
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
  
  // Count warning and critical sensor states
  const warningCount = device.sensors.filter((s: any) => s.status === 'warning').length;
  const criticalCount = device.sensors.filter((s: any) => s.status === 'critical').length;
  
  // Check if there are any warnings or critical alerts
  const hasAlerts = warningCount > 0 || criticalCount > 0;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Cpu size={20} color={colors.primary} />
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
          <Text style={[
            styles.statusText,
            device.status === 'offline' && styles.offlineText,
            device.status === 'warning' && styles.warningText
          ]}>
            {device.status}
          </Text>
        </View>
        
        <Text style={styles.location}>{device.location}</Text>
        
        {hasAlerts && (
          <View style={styles.alertsContainer}>
            <AlertTriangle size={14} color={colors.warning} />
            <Text style={styles.alertsText}>
              {criticalCount > 0 && `${criticalCount} critical${warningCount > 0 ? ', ' : ''}`}
              {warningCount > 0 && `${warningCount} warnings`}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.lastUpdated}>{device.lastUpdated}</Text>
      
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.success,
    textTransform: 'capitalize',
  },
  offlineText: {
    color: colors.error,
  },
  warningText: {
    color: colors.warning,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  alertsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
  },
  lastUpdated: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
});