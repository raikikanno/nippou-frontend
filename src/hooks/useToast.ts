import { useState, useCallback } from 'react';
import { ToastType } from '@/components/ui/Toast';

interface ToastState {
  open: boolean;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({
      open: true,
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}; 