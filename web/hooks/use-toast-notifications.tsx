'use client';

import * as React from 'react';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types for our toast system
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';

export interface ToastNotification {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
}

interface ToastContextType {
  toasts: ToastNotification[];
  toast: (props: Omit<ToastNotification, 'id'>) => string;
  dismiss: (id: string) => void;
  error: (title: string, description?: string) => string;
  success: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastNotifications() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastNotifications must be used within a ToastNotificationsProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastNotificationsProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const toast = useCallback((props: Omit<ToastNotification, 'id'>) => {
    const id = uuidv4();
    const duration = props.duration ?? 5000;
    const newToast = { id, ...props };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const error = useCallback((title: string, description?: string) => {
    return toast({ 
      title, 
      description, 
      type: 'error', 
      duration: 5000 
    });
  }, [toast]);

  const success = useCallback((title: string, description?: string) => {
    return toast({ 
      title, 
      description, 
      type: 'success', 
      duration: 3000 
    });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    return toast({ 
      title, 
      description, 
      type: 'warning', 
      duration: 4000 
    });
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    return toast({ 
      title, 
      description, 
      type: 'info', 
      duration: 3000 
    });
  }, [toast]);

  useEffect(() => {
    return () => {
      setToasts([]);
    };
  }, []);

  return (
    <ToastContext.Provider 
      value={{ 
        toasts, 
        toast, 
        dismiss, 
        error, 
        success, 
        warning, 
        info 
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export default useToastNotifications; 