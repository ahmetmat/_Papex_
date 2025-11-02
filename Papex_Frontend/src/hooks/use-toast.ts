import { useState, useCallback } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastOptions & { id: string }>>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = { ...options, id };
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
    
    // Also log to console for debugging
    console.log('Toast:', options);
  }, []);

  return { toast };
};

