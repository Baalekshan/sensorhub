'use client';

import { useState, useCallback } from "react";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState {
  open: boolean;
  props: ToastProps;
}

interface ToastContextValue {
  toast: (props: ToastProps) => void;
  dismiss: () => void;
}

export function useToast(): ToastContextValue {
  const [state, setState] = useState<ToastState>({
    open: false,
    props: {},
  });

  const toast = useCallback((props: ToastProps) => {
    setState({ open: true, props });
    
    // Auto-dismiss after duration
    if (props.duration !== 0) {
      setTimeout(() => {
        setState((s) => ({ ...s, open: false }));
      }, props.duration || 5000);
    }
    
    // For debugging in development
    console.log('Toast:', props);
  }, []);

  const dismiss = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return { toast, dismiss };
} 