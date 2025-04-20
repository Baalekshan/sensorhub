import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { colors } from '@/constants/colors';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
}

export function PageHeader({ title, subtitle, leftComponent, rightComponent }: PageHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {leftComponent}
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
});