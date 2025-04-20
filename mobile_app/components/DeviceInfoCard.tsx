import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { Map, Cpu, Signal, Wifi } from 'lucide-react-native';

interface DeviceInfoCardProps {
  device: any;
}

export function DeviceInfoCard({ device }: DeviceInfoCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Device Information</Text>
      
      <View style={styles.infoRow}>
        <View style={styles.infoIconContainer}>
          <Map size={16} color={colors.primary} />
        </View>
        <Text style={styles.infoLabel}>Location</Text>
        <Text style={styles.infoValue}>{device.location}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoIconContainer}>
          <Cpu size={16} color={colors.primary} />
        </View>
        <Text style={styles.infoLabel}>Firmware</Text>
        <Text style={styles.infoValue}>v{device.firmwareVersion}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoIconContainer}>
          <Wifi size={16} color={colors.primary} />
        </View>
        <Text style={styles.infoLabel}>Wi-Fi Signal</Text>
        <Text style={styles.infoValue}>{device.wifiStrength} dBm</Text>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoIconContainer}>
          <Signal size={16} color={colors.primary} />
        </View>
        <Text style={styles.infoLabel}>IP Address</Text>
        <Text style={styles.infoValue}>{device.ipAddress}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
});