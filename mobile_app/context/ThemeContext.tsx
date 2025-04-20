import { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Define context type
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
};

// Create the context
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

// Storage helper for web platform
const webStorage = {
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    return Promise.resolve(value);
  },
};

// Use SecureStore on native platforms, localStorage on web
const storage = Platform.OS === 'web' ? webStorage : SecureStore;

// Create the provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');
  
  // Check for saved theme preferences on load
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.getItem('theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // If no saved preference, use device theme
          setIsDarkMode(deviceTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadTheme();
  }, [deviceTheme]);
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    storage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };
  
  // Set specific theme
  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    storage.setItem('theme', value ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}