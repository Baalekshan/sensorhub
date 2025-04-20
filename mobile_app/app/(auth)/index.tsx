import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthIndex() {
  const { user, isLoading } = useAuth();
  
  // If user is already logged in, redirect to main app
  // Otherwise, redirect to login screen
  if (!isLoading) {
    if (user) {
      return <Redirect href="/(tabs)" />;
    } else {
      return <Redirect href="/login" />;
    }
  }
  
  // Return null while loading to prevent flash of content
  return null;
}