import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDevices } from '@/hooks/useDevices';
import { colors } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { CalibrationStepCard } from '@/components/CalibrationStepCard';
import { ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

export default function DeviceCalibrateScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getDeviceById, calibrateSensor } = useDevices();
  const [device, setDevice] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  
  useEffect(() => {
    if (id) {
      const deviceData = getDeviceById(id as string);
      setDevice(deviceData);
    }
  }, [id, getDeviceById]);

  if (!device) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Calibrate Device"
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

  // Sample calibration steps - in a real app, these would be fetched from the device metadata
  const calibrationSteps = [
    {
      id: 'prepare',
      title: 'Prepare Your Device',
      description: 'Make sure your device is in a stable environment and powered on.',
      instructions: 'Place the device in its normal operating position and ensure it has stable power.',
      imageUrl: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg',
    },
    {
      id: 'reference',
      title: 'Set Reference Points',
      description: 'Create reference measurements for accurate calibration.',
      instructions: 'For soil moisture sensors, place in completely dry soil first. For temperature sensors, use a known reference temperature.',
      imageUrl: 'https://images.pexels.com/photos/3912982/pexels-photo-3912982.jpeg',
    },
    {
      id: 'calibrate',
      title: 'Run Calibration',
      description: 'Start the calibration process on the device.',
      instructions: 'Press the "Calibrate Now" button and wait for the process to complete. This may take a few minutes.',
      imageUrl: 'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg',
    },
    {
      id: 'verify',
      title: 'Verify Calibration',
      description: 'Confirm the calibration was successful.',
      instructions: 'Check the sensor readings in normal conditions to ensure they are accurate and stable.',
      imageUrl: 'https://images.pexels.com/photos/326461/pexels-photo-326461.jpeg',
    },
  ];

  const handleNextStep = () => {
    if (currentStep < calibrationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - run calibration
      handleRunCalibration();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunCalibration = async () => {
    setCalibrating(true);
    try {
      // Simulate calibration process
      await new Promise(resolve => setTimeout(resolve, 3000));
      await calibrateSensor(id as string);
      setCalibrationComplete(true);
    } catch (error) {
      console.error('Calibration failed:', error);
    } finally {
      setCalibrating(false);
    }
  };

  const handleFinish = () => {
    router.replace(`/devices/${id}`);
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Calibrate Device"
        subtitle={device.name}
        leftComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!calibrationComplete ? (
          <>
            {/* Calibration progress steps */}
            <View style={styles.stepsContainer}>
              {calibrationSteps.map((step, index) => (
                <View key={step.id} style={styles.stepItem}>
                  <View 
                    style={[
                      styles.stepCircle,
                      index === currentStep && styles.stepCircleActive,
                      index < currentStep && styles.stepCircleCompleted
                    ]}
                  >
                    <Text 
                      style={[
                        styles.stepNumber,
                        (index === currentStep || index < currentStep) && styles.stepNumberActive
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  {index < calibrationSteps.length - 1 && (
                    <View 
                      style={[
                        styles.stepLine,
                        index < currentStep && styles.stepLineCompleted
                      ]} 
                    />
                  )}
                </View>
              ))}
            </View>
            
            {/* Current step card */}
            <CalibrationStepCard
              step={calibrationSteps[currentStep]}
              isLastStep={currentStep === calibrationSteps.length - 1}
              isCalibrating={calibrating}
            />

            {/* Information note */}
            <View style={styles.noteContainer}>
              <AlertTriangle size={20} color={colors.warning} style={styles.noteIcon} />
              <Text style={styles.noteText}>
                Calibration improves accuracy but may take a few minutes to complete. 
                Keep the device in a stable environment during this process.
              </Text>
            </View>
              
            {/* Navigation buttons */}
            <View style={styles.buttonsContainer}>
              {currentStep > 0 && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={handlePrevStep}
                  disabled={calibrating}
                >
                  <Text style={styles.backButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
                
              <TouchableOpacity 
                style={[
                  styles.nextButton, 
                  currentStep === calibrationSteps.length - 1 ? styles.calibrateButton : null,
                  calibrating && styles.buttonDisabled
                ]} 
                onPress={handleNextStep}
                disabled={calibrating}
              >
                <Text style={styles.nextButtonText}>
                  {calibrating 
                    ? 'Calibrating...' 
                    : currentStep === calibrationSteps.length - 1 
                      ? 'Start Calibration' 
                      : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Calibration success screen
          <View style={styles.completeContainer}>
            <CheckCircle2 size={64} color={colors.success} style={styles.completeIcon} />
            <Text style={styles.completeTitle}>Calibration Complete!</Text>
            <Text style={styles.completeText}>
              The device has been successfully calibrated and is ready to use.
              Your sensor readings will now be more accurate.
            </Text>
            
            <TouchableOpacity 
              style={styles.finishButton} 
              onPress={handleFinish}
            >
              <Text style={styles.finishButtonText}>Return to Device</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 16,
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
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  stepCircleCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  stepNumber: {
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
    fontSize: 14,
  },
  stepNumberActive: {
    color: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: -5,
  },
  stepLineCompleted: {
    backgroundColor: colors.success,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 12,
    marginVertical: 24,
  },
  noteIcon: {
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  calibrateButton: {
    backgroundColor: colors.success,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completeContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  completeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  finishButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  finishButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});