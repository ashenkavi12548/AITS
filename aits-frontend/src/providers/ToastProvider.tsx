'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#ececec',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          fontSize: '13px',
          fontWeight: '500',
          padding: '12px 16px',
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: '#10a37f',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#f43f5e',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
