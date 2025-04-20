import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';

interface CalibrationStepCardProps {
  step: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    imageUrl: string;
  };
  isLastStep: boolean;
  isCalibrating: boolean;
}

export function CalibrationStepCard({ step, isLastStep, isCalibrating }: CalibrationStepCardProps) {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: step.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsLabel}>Instructions:</Text>
          <Text style={styles.instructions}>{step.instructions}</Text>
        </View>
        
        {isLastStep && isCalibrating && (
          <View style={styles.calibratingContainer}>
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            <Text style={styles.calibratingText}>Calibrating sensors... This may take a moment.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  instructions: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  calibratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: 12,
    borderRadius: 8,
  },
  loader: {
    marginRight: 12,
  },
  calibratingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
});