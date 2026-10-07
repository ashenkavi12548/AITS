'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { setTheme, resolvedTheme } = useTheme();

  if (!mounted) {
    return <div className="w-7.5 h-7.5" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`p-1.5 rounded-lg text-[#5d5d5d] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-white hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] transition-all cursor-pointer ${className}`}
      aria-label="Toggle Theme"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {isDark ? (
        <Sun className="w-4.5 h-4.5 text-amber-400 rotate-0 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-[#5d5d5d] rotate-0 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
