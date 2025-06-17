import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthScreen from '../components/AuthScreen';
import { AppProvider } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
  const { state } = useAuth();

  console.log('🟠 LAYOUT: Auth state changed:', { 
    isAuthenticated: state.isAuthenticated, 
    isLoading: state.isLoading,
    user: state.user?.email,
    timestamp: new Date().toISOString()
  });

  if (state.isLoading) {
    console.log('🟠 LAYOUT: Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!state.isAuthenticated) {
    console.log('🟠 LAYOUT: User not authenticated, showing AuthScreen');
    return <AuthScreen />;
  }

  console.log('🟠 LAYOUT: User authenticated, showing main app');
  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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