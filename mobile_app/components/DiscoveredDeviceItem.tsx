import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Bluetooth, PlusCircle, Signal } from 'lucide-react-native';

interface DiscoveredDeviceItemProps {
  device: any;
  signalStrength: string;
  onPress?: () => void;
}

export function DiscoveredDeviceItem({ device, signalStrength, onPress }: DiscoveredDeviceItemProps) {
  // Get signal strength color
  const getSignalColor = (strength: string) => {
    switch (strength) {
      case 'Excellent':
        return colors.success;
      case 'Good':
        return colors.success;
      case 'Fair':
        return colors.warning;
      default:
        return colors.error;
    }
  };
  
  const signalColor = getSignalColor(signalStrength);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Bluetooth size={20} color={colors.primary} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceType}>{device.type || 'Unknown Device'}</Text>
        
        <View style={styles.signalContainer}>
          <Signal size={14} color={signalColor} />
          <Text style={[styles.signalText, { color: signalColor }]}>
            {signalStrength} ({device.rssi} dBm)
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <PlusCircle size={24} color={colors.primary} />
      </View>
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
    marginVertical: 8,
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
  deviceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  deviceType: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  buttonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});