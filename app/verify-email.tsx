import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Mail, DollarSign } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ApiService from '../services/ApiService';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      console.log('🔍 VERIFICATION: Starting email verification with token');
      
      const response = await ApiService.verifyEmail(verificationToken);

      if (response.success) {
        console.log('🔍 VERIFICATION: Email verified successfully');
        console.log('🔍 VERIFICATION: Response data:', response);
        
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now sign in to your account.');
        
        // Store the verified email for auto-population
        if (response.data?.user?.email) {
          setVerifiedEmail(response.data.user.email);
          console.log('🔍 VERIFICATION: Stored verified email:', response.data.user.email);
        }
        
        // Check if user was automatically logged in (token provided)
        if (response.data?.token) {
          console.log('🔍 VERIFICATION: User automatically logged in with token');
          // The ApiService.verifyEmail should have already saved the token
          // We could redirect directly to the app, but let's keep the success page
        }
      } else {
        console.log('🔍 VERIFICATION: Email verification failed:', response.message);
        setStatus('error');
        setMessage(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('🔍 VERIFICATION: Verification error:', error);
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      // For success case, try to close the window/tab
      if (typeof window !== 'undefined') {
        window.close();
      }
      // If window.close() doesn't work (some browsers block it), 
      // just show a message or navigate to a thank you page
    } else {
      // For error cases, go back to registration
      router.replace('/');
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <ActivityIndicator size={48} color="#007AFF" />;
      case 'success':
        return <CheckCircle size={48} color="#34C759" />;
      case 'error':
      case 'expired':
        return <XCircle size={48} color="#FF3B30" />;
      default:
        return <Mail size={48} color="#8E8E93" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Email...';
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Link Expired';
      default:
        return 'Email Verification';
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'success':
        return 'Close Window';
      case 'error':
      case 'expired':
        return 'Back to Registration';
      default:
        return 'Continue';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <DollarSign size={32} color="#007AFF" />
          </View>
          <Text style={styles.appTitle}>FinanceFlow</Text>
        </View>

        {/* Verification Status */}
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            {renderIcon()}
          </View>
          
          <Text style={styles.title}>{getTitle()}</Text>
          
          <Text style={styles.message}>{message}</Text>

          {status === 'success' && (
            <View style={styles.successDetails}>
              <Text style={styles.successText}>
                ✅ Your account is now active and verified
              </Text>
              <Text style={styles.successText}>
                ✅ You can now close this window
              </Text>
              <Text style={styles.successText}>
                ✅ Return to the app and sign in normally
              </Text>
            </View>
          )}

          {(status === 'error' || status === 'expired') && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                • The verification link may have expired
              </Text>
              <Text style={styles.errorText}>
                • Please try registering again or request a new verification email
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {status !== 'loading' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              status === 'success' ? styles.successButton : styles.errorButton
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.actionButtonText}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  statusContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  successDetails: {
    alignItems: 'flex-start',
    width: '100%',
  },
  successText: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 8,
    textAlign: 'left',
  },
  errorDetails: {
    alignItems: 'flex-start',
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'left',
  },
  actionButton: {
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minWidth: 200,
  },
  successButton: {
    backgroundColor: '#007AFF',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 