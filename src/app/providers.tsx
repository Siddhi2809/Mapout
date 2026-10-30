'use client';

import React from 'react';
import { ERPProvider } from '@/context/ERPContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ERPProvider>{children}</ERPProvider>;
}
