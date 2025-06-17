import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Mail, Lock, User, DollarSign } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'email-verification';

export default function AuthScreen() {
  const { login, register, resetPassword, state } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleLogin = async () => {
    console.log('🟦 LOGIN STEP 1: handleLogin called with:', { 
      email: formData.email, 
      password: formData.password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]' 
    });
    
    if (!formData.email || !formData.password) {
      console.log('🟦 LOGIN ERROR: Missing email or password');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('🟦 LOGIN STEP 2: Calling login function...');
    const success = await login(formData.email, formData.password);
    console.log('🟦 LOGIN STEP 3: Login result:', success);
    
    if (!success) {
      console.log('🟦 LOGIN ERROR: Login failed');
      // Check if it's an email verification issue
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await response.json();
        
        if (data.emailVerificationRequired) {
          Alert.alert(
            'Email Verification Required', 
            'Please verify your email address before logging in. Check your inbox for the verification email.',
            [
              { text: 'OK' },
              { 
                text: 'Resend Email', 
                onPress: () => handleResendVerification() 
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', 'Invalid email or password');
        }
      } catch (error) {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } else {
      console.log('🟦 LOGIN SUCCESS: Login completed successfully');
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const success = await register(formData.name, formData.email, formData.password);
    if (!success) {
      Alert.alert('Registration Failed', 'User with this email already exists');
    } else {
      // Store the email and switch to verification screen
      setRegisteredEmail(formData.email);
      setMode('email-verification');
    }
  };

  const handleResendVerification = async () => {
    const emailToUse = registeredEmail || formData.email;
    if (!emailToUse) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Verification Email Sent', 'Please check your email for the verification link.');
      } else {
        Alert.alert('Error', 'Failed to send verification email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification email');
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const success = await resetPassword(formData.email);
    if (success) {
      Alert.alert(
        'Password Reset',
        'If an account with this email exists, you will receive password reset instructions.'
      );
      setMode('login');
    } else {
      Alert.alert('Error', 'Failed to send reset email');
    }
  };

  const handleSubmit = () => {
    switch (mode) {
      case 'login':
        handleLogin();
        break;
      case 'register':
        handleRegister();
        break;
      case 'forgot-password':
        handleForgotPassword();
        break;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <DollarSign size={32} color="#007AFF" />
            </View>
            <Text style={styles.title}>FinanceFlow</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' && 'Welcome back! Sign in to continue.'}
              {mode === 'register' && 'Create your account to get started.'}
              {mode === 'forgot-password' && 'Enter your email to reset password.'}
              {mode === 'email-verification' && 'Check your email to verify your account.'}
            </Text>
          </View>



          {/* Form */}
          <View style={styles.form}>
            
            {/* Email Verification Screen */}
            {mode === 'email-verification' && (
              <View style={styles.verificationContainer}>
                <View style={styles.emailSentContainer}>
                  <Mail size={48} color="#007AFF" />
                  <Text style={styles.emailSentTitle}>Email Sent!</Text>
                  <Text style={styles.emailSentMessage}>
                    We've sent a verification email to:
                  </Text>
                  <Text style={styles.emailAddress}>{registeredEmail}</Text>
                  <Text style={styles.emailSentInstructions}>
                    Click the verification link in your email to activate your account, then return here to sign in.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendVerification}
                  disabled={state.isLoading}
                >
                  {state.isLoading ? (
                    <ActivityIndicator color="#007AFF" size="small" />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend Verification Email</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => setMode('login')}
                >
                  <Text style={styles.continueButtonText}>Continue to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Regular form fields - hidden during email verification */}
            {mode !== 'email-verification' && (
              <>
                {mode === 'register' && (
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <User size={20} color="#8E8E93" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Full Name"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {mode !== 'forgot-password' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#8E8E93" />
                    ) : (
                      <Eye size={20} color="#8E8E93" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#8E8E93" />
                    ) : (
                      <Eye size={20} color="#8E8E93" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, state.isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot-password' && 'Reset Password'}
                </Text>
              )}
            </TouchableOpacity>

                {/* Demo Credentials */}
                {mode === 'login' && (
                  <View style={styles.demoContainer}>
                    <Text style={styles.demoTitle}>Demo Credentials:</Text>
                    <Text style={styles.demoText}>Email: sarah.johnson@email.com</Text>
                    <Text style={styles.demoText}>Password: password123</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            {mode === 'login' && (
              <>
                <TouchableOpacity onPress={() => switchMode('forgot-password')}>
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>
                
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => switchMode('register')}>
                    <Text style={styles.linkText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {mode === 'register' && (
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => switchMode('login')}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'forgot-password' && (
              <TouchableOpacity onPress={() => switchMode('login')}>
                <Text style={styles.linkText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  demoContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 12,
    color: '#856404',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Email verification styles
  verificationContainer: {
    alignItems: 'center',
  },
  emailSentContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  emailSentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emailSentMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailSentInstructions: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  resendButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Success banner styles
  successBanner: {
    backgroundColor: '#D4F7D4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  successBannerText: {
    fontSize: 14,
    color: '#1B5E20',
    textAlign: 'center',
    fontWeight: '600',
  },
});