'use client';
import { useEffect } from 'react';

export function DangKyPwa() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(error => console.error('PWA registration failed', error));
    }
  }, []);
  return null;
}
