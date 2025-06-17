import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  open: boolean;
  message: string;
  type: ToastType;
  onClose: () => void;
  autoHideDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  type,
  onClose,
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={type as AlertColor} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}; 