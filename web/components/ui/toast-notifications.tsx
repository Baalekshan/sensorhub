'use client';

import { useToastNotifications, ToastNotification } from '@/hooks/use-toast-notifications';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function ToastNotifications() {
  const { toasts } = useToastNotifications();

  return (
    <ToastProvider>
      {toasts && toasts.map((toast: ToastNotification) => {
        const { id, title, description, type, action, ...props } = toast;
        return (
          <Toast 
            key={id} 
            {...props} 
            variant={type === 'destructive' || type === 'error' ? 'destructive' : 'default'}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
} 