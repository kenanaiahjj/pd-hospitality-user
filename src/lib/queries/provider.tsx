'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createQueryClient } from './client';

/**
 * One QueryClient per browser session, created lazily inside `useState` so it
 * is never a module-level singleton — that would share cache across requests
 * during SSR.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
