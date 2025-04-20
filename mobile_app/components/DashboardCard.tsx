import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

export function DashboardCard({ title, value, subtitle, color }: DashboardCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  value: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});