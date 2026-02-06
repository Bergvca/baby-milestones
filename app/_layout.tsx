import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import {Platform} from "react-native";

// Import CSS for web
if (Platform.OS === 'web') {
  require('../app.css');
}


function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Don't navigate while loading

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'profile' || segments[0] === 'add-family'
        || segments[0] === 'add-child' || segments[0] === 'post-detail';

    if (user && !inAuthGroup) {
      // User is signed in but not in auth group, redirect to tabs
      router.replace('/(tabs)');
    } else if (!user && inAuthGroup) {
      // User is not signed in but in auth group, redirect to login
      router.replace('/login');
    }
  }, [user, loading, segments]);

  // Show loading screen while auth state is being determined
  if (loading) {
    return null; // You can return a loading component here if needed
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
          name="add-family"
          options={{
            title: 'Add Family',
            headerBackTitle: 'Back'
          }}
      />
    <Stack.Screen
        name="add-child"
        options={{
            title: 'Add Child',
            headerBackTitle: 'Back'
        }}
    />
    <Stack.Screen
        name="post-detail"
        options={{ headerShown: false }}
    />

    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}