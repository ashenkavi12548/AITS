'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
