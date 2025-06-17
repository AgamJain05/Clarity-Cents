import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuthScreen from '../components/AuthScreen';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { state } = useAuth();
  const router = useRouter();
  const { email, verified } = useLocalSearchParams<{ email?: string; verified?: string }>();

  useEffect(() => {
    if (state.isAuthenticated) {
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [state.isAuthenticated, router]);

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!state.isAuthenticated) {
    return <AuthScreen />;
  }

  // This should not render as useEffect will redirect
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
} 