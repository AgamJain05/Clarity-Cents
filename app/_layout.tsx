import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthScreen from '../components/AuthScreen';
import { AppProvider } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';

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

  // Handle routing based on authentication state
  useEffect(() => {
    if (!state.isLoading) {
      const inAuthGroup = segments[0] === '(tabs)';
      const onVerificationPage = segments[0] === 'verify-email';
      
      if (state.isAuthenticated && !inAuthGroup) {
        // User is authenticated but not in protected routes, redirect to main app
        console.log('🟠 LAYOUT: Redirecting authenticated user to main app');
        router.replace('/(tabs)');
      } else if (!state.isAuthenticated && (inAuthGroup || onVerificationPage)) {
        // User is not authenticated but on protected routes or verification page, redirect to login
        console.log('🟠 LAYOUT: Redirecting unauthenticated user to login');
        router.replace('/');
      }
    }
  }, [state.isAuthenticated, state.isLoading, segments, router]);

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