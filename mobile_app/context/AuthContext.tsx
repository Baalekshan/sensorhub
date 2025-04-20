import { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Define user type
type User = {
  id: string;
  email: string;
  displayName: string;
};

// Define context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  updateProfile: async () => {},
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
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
};

// Use SecureStore on native platforms, localStorage on web
const storage = Platform.OS === 'web' ? webStorage : SecureStore;

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for existing session on load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await storage.getItem('user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Sign in function
  const signIn = async (email: string, password: string) => {
    // In a real app, we would validate credentials with a backend
    // For demo, we'll simulate authentication
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation (in real app, this would be server-side)
    if (email === 'demo@example.com' && password === 'password') {
      const userData: User = {
        id: '1',
        email: 'demo@example.com',
        displayName: 'Demo User',
      };
      
      // Store user data
      await storage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return;
    }
    
    // For demo purposes, allow any login
    const userData: User = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      displayName: email.split('@')[0],
    };
    
    // Store user data
    await storage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };
  
  // Sign up function
  const signUp = async (name: string, email: string, password: string) => {
    // In a real app, we would register with a backend
    // For demo, we'll simulate registration
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const userData: User = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      displayName: name,
    };
    
    // Store user data
    await storage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };
  
  // Sign out function
  const signOut = async () => {
    await storage.removeItem('user');
    setUser(null);
  };
  
  // Update profile function
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    await storage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };
  
  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}