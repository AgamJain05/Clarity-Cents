import { useAuth } from '../context/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import AuthScreen from '../components/AuthScreen';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { state } = useAuth();
  const { email, verified } = useLocalSearchParams<{ email?: string; verified?: string }>();

  console.log('📱 INDEX: Rendering with auth state:', {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user?.email
  });

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show authentication screen for non-authenticated users
  // The layout will handle redirecting authenticated users to /(tabs)
  return <AuthScreen />;
} 