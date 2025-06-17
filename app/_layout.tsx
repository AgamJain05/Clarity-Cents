import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthScreen from '../components/AuthScreen';
import { AppProvider } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { useSegments, useRouter } from 'expo-router';

function RootLayoutNav() {
  const { state } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log('🟠 LAYOUT: Auth state changed:', { 
    isAuthenticated: state.isAuthenticated, 
    isLoading: state.isLoading,
    user: state.user?.email,
    segments: segments,
    timestamp: new Date().toISOString()
  });

  // Check if user is on verification page
  const isOnVerificationPage = segments[0] === 'verify-email';

  if (state.isLoading) {
    console.log('🟠 LAYOUT: Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Always show the Stack for proper routing, but control content based on auth state
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}