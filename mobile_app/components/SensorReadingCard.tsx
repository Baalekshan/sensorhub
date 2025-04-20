import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Thermometer, Droplets, Warehouse, Zap, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react-native';

interface SensorReadingCardProps {
  sensor: any;
  deviceName?: string;
  onPress?: () => void;
}

export function SensorReadingCard({ sensor, deviceName, onPress }: SensorReadingCardProps) {
  // Get appropriate icon based on sensor type
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer size={24} color={colors.primary} />;
      case 'humidity':
        return <Droplets size={24} color={colors.info} />;
      case 'moisture':
        return <Droplets size={24} color={colors.info} />;
      case 'gas':
        return <Zap size={24} color={colors.warning} />;
      default:
        return <Warehouse size={24} color={colors.textSecondary} />;
    }
  };
  
  // Get status indicator based on sensor status
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertCircle size={20} color={colors.error} />;
      case 'warning':
        return <AlertTriangle size={20} color={colors.warning} />;
      default:
        return <CheckCircle2 size={20} color={colors.success} />;
    }
  };
  
  // Get progress bar color based on sensor status
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical':
        return colors.error;
      case 'warning':
        return colors.warning;
      default:
        return colors.success;
    }
  };
  
  // Calculate progress percentage based on min and max values
  const getProgressPercentage = () => {
    const { value, minValue, maxValue } = sensor;
    const range = maxValue - minValue;
    const normalizedValue = value - minValue;
    
    // Clamp the percentage between 0 and 100
    const percentage = Math.min(100, Math.max(0, (normalizedValue / range) * 100));
    return `${percentage}%`;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        sensor.status === 'critical' && styles.criticalContainer,
        sensor.status === 'warning' && styles.warningContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getSensorIcon(sensor.type)}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.sensorName}>{sensor.name}</Text>
          <View style={styles.statusContainer}>
            {getStatusIndicator(sensor.status)}
            <Text style={[
              styles.statusText,
              sensor.status === 'critical' && styles.criticalText,
              sensor.status === 'warning' && styles.warningText
            ]}>
              {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
            </Text>
          </View>
        </View>
        
        {deviceName && (
          <Text style={styles.deviceName}>{deviceName}</Text>
        )}
        
        <View style={styles.valueRow}>
          <Text style={styles.value}>{sensor.value}</Text>
          <Text style={styles.unit}>{sensor.unit}</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: getProgressPercentage(), backgroundColor: getProgressColor(sensor.status) }
            ]} 
          />
        </View>
        
        <View style={styles.rangeRow}>
          <Text style={styles.rangeText}>{sensor.minValue}{sensor.unit}</Text>
          <Text style={styles.lastUpdated}>Updated {sensor.lastUpdated}</Text>
          <Text style={styles.rangeText}>{sensor.maxValue}{sensor.unit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  criticalContainer: {
    borderColor: colors.error,
    borderWidth: 1,
    backgroundColor: colors.errorLight,
  },
  warningContainer: {
    borderColor: colors.warning,
    borderWidth: 1,
    backgroundColor: colors.warningLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sensorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.success,
    marginLeft: 4,
  },
  criticalText: {
    color: colors.error,
  },
  warningText: {
    color: colors.warning,
  },
  deviceName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  unit: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  lastUpdated: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});