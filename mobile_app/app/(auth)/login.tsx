import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import * as SecureStore from 'expo-secure-store';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const { signIn } = useAuth();
  const router = useRouter();

  // Validate email format
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validate password requirements
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return false;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // Handle login attempt
  const handleLogin = async () => {
    // Reset errors
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Attempt to sign in
      await signIn(email, password);
      
      // Store email (but not password) for convenience
      if (Platform.OS !== 'web') {
        await SecureStore.setItem('lastEmail', email);
      }
      
      router.replace('/(tabs)');
    } catch (err: any) {
      // Handle specific error types
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection');
      } else {
        setError('An error occurred. Please try again');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      accessible={true}
      accessibilityLabel="Login Screen"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
            accessible={true}
            accessibilityLabel="SensorSync Logo"
          />
          <Text style={styles.appName} accessibilityRole="header">SensorSync</Text>
          <Text style={styles.tagline}>Smart sensing made simple</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title} accessibilityRole="header">Welcome Back</Text>
          
          {error && (
            <View style={styles.errorContainer} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textSecondary}
              accessible={true}
              accessibilityLabel="Email input"
              accessibilityHint="Enter your email address"
            />
          </View>
          {emailError && (
            <Text style={styles.fieldError} accessibilityRole="alert">{emailError}</Text>
          )}
          
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
              }}
              secureTextEntry={!showPassword}
              placeholderTextColor={colors.textSecondary}
              accessible={true}
              accessibilityLabel="Password input"
              accessibilityHint="Enter your password"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              accessible={true}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              accessibilityRole="button"
            >
              {showPassword ? 
                <EyeOff size={20} color={colors.textSecondary} /> : 
                <Eye size={20} color={colors.textSecondary} />
              }
            </TouchableOpacity>
          </View>
          {passwordError && (
            <Text style={styles.fieldError} accessibilityRole="alert">{passwordError}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            accessible={true}
            accessibilityLabel="Forgot Password"
            accessibilityRole="button"
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Login button"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              accessible={true}
              accessibilityLabel="Sign Up"
              accessibilityRole="button"
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.primary,
    marginTop: 16,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    color: colors.error,
    fontSize: 14,
  },
  fieldError: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.error,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
});