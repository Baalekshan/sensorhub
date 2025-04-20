import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { colors } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { 
  Moon, Sun, Bell, Lock, Shield, HelpCircle, 
  LogOut, ChevronRight, User, Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react-native';

interface SettingsState {
  notifications: boolean;
  biometrics: boolean;
  isLoadingBiometrics: boolean;
  error: string | null;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    biometrics: false,
    isLoadingBiometrics: false,
    error: null
  });
  
  // Handle settings changes with feedback
  const handleSettingChange = async (setting: keyof SettingsState, value: boolean) => {
    try {
      switch (setting) {
        case 'notifications':
          await toggleNotifications(value);
          break;
        case 'biometrics':
          await toggleBiometrics(value);
          break;
      }
      
      // Show feedback
      showFeedback(`${setting} ${value ? 'enabled' : 'disabled'}`);
      
      // Save settings
      await saveSettings({ ...settings, [setting]: value });
    } catch (error: any) {
      setSettings(prev => ({ ...prev, error: error.message }));
    }
  };
  
  // Toggle notifications with proper permissions
  const toggleNotifications = async (enabled: boolean) => {
    if (Platform.OS === 'web') {
      // Web notification permissions
      if (enabled && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }
    } else {
      // Native notification permissions
      // Implement platform-specific notification permission request
    }
    
    setSettings(prev => ({ ...prev, notifications: enabled }));
  };
  
  // Toggle biometric authentication
  const toggleBiometrics = async (enabled: boolean) => {
    if (Platform.OS === 'web') {
      throw new Error('Biometric authentication is not available on web');
    }
    
    setSettings(prev => ({ ...prev, isLoadingBiometrics: true }));
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        throw new Error('Biometric hardware not available');
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        throw new Error('No biometrics enrolled on this device');
      }
      
      if (enabled) {
        // Verify biometrics before enabling
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity to enable biometric login'
        });
        
        if (!result.success) {
          throw new Error('Biometric verification failed');
        }
      }
      
      setSettings(prev => ({ ...prev, biometrics: enabled }));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to configure biometric authentication');
    } finally {
      setSettings(prev => ({ ...prev, isLoadingBiometrics: false }));
    }
  };
  
  // Save settings to secure storage
  const saveSettings = async (newSettings: Partial<SettingsState>) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItem('userSettings', JSON.stringify(newSettings));
      } else {
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  // Show feedback toast/alert
  const showFeedback = (message: string) => {
    if (Platform.OS === 'web') {
      // Web toast notification
      alert(message);
    } else {
      // Native toast notification
      Alert.alert('Settings Updated', message, [{ text: 'OK' }]);
    }
  };

  // Handle sign out with confirmation
  const handleSignOut = useCallback(() => {
    const confirmSignOut = () => {
      try {
        signOut();
        router.replace('/login');
      } catch (error) {
        setSettings(prev => ({ 
          ...prev, 
          error: 'Failed to sign out. Please try again.' 
        }));
      }
    };
    
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to sign out?')) {
        confirmSignOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: confirmSignOut
          }
        ]
      );
    }
  }, [signOut, router]);

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Settings"
        subtitle="App preferences and account settings"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error message */}
        {settings.error && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={20} color={colors.error} />
            <Text style={styles.errorText}>{settings.error}</Text>
          </View>
        )}
        
        {/* User profile section */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('/settings/profile')}
          accessible={true}
          accessibilityLabel="Edit profile"
          accessibilityRole="button"
          accessibilityHint="Navigate to profile settings"
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {user?.displayName?.slice(0, 2).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        {/* App settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              {isDarkMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.warning} />}
            </View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
              accessible={true}
              accessibilityLabel="Dark mode toggle"
              accessibilityRole="switch"
              accessibilityState={{ checked: isDarkMode }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color={colors.primary} />
            </View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.notifications ? colors.primary : '#f4f3f4'}
              accessible={true}
              accessibilityLabel="Notifications toggle"
              accessibilityRole="switch"
              accessibilityState={{ checked: settings.notifications }}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Lock size={20} color={colors.primary} />
            </View>
            <Text style={styles.settingLabel}>Biometric Login</Text>
            {settings.isLoadingBiometrics ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={settings.biometrics}
                onValueChange={(value) => handleSettingChange('biometrics', value)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={settings.biometrics ? colors.primary : '#f4f3f4'}
                accessible={true}
                accessibilityLabel="Biometric login toggle"
                accessibilityRole="switch"
                accessibilityState={{ checked: settings.biometrics }}
                disabled={Platform.OS === 'web'}
              />
            )}
          </View>
        </View>
        
        {/* Account settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/profile')}
            accessible={true}
            accessibilityLabel="Edit profile settings"
            accessibilityRole="button"
          >
            <View style={styles.menuIconContainer}>
              <User size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/preferences')}
            accessible={true}
            accessibilityLabel="Edit preferences"
            accessibilityRole="button"
          >
            <View style={styles.menuIconContainer}>
              <SettingsIcon size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Preferences</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/security')}
            accessible={true}
            accessibilityLabel="Security settings"
            accessibilityRole="button"
          >
            <View style={styles.menuIconContainer}>
              <Shield size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Security</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Help section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/help')}
            accessible={true}
            accessibilityLabel="Help and support"
            accessibilityRole="button"
          >
            <View style={styles.menuIconContainer}>
              <HelpCircle size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Sign out button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
          accessible={true}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <LogOut size={20} color={colors.error} style={styles.signOutIcon} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        {/* App version */}
        <Text style={styles.versionText}>SensorSync v1.0.0</Text>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.textPrimary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.error,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});