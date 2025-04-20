import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, ListPlus, BarChart2, Settings } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  const { user, isLoading } = useAuth();

  // Platform-specific tab bar styles
  const tabBarStyle = Platform.OS === 'ios' 
    ? { 
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 88,
        paddingBottom: 28,
        paddingTop: 8,
      }
    : {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 64,
        paddingTop: 8,
        paddingBottom: 8,
      };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          tabBarIcon: ({ color, size }) => (
            <ListPlus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}