'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// If you use shadcn/ui Tooltip:
import { TooltipProvider } from '@/components/ui/tooltip';

// If you use shadcn/ui toast:
import { Toaster as ShadcnToaster } from '@/components/ui/sonner';

// If you use Sonner toast:
import { Toaster as SonnerToaster } from 'sonner';

export default function Providers({ children }: { children: ReactNode }) {
  // Keep QueryClient stable across renders
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Your app */}
        {children}
        {/* Global toasters (use either or both) */}
        <ShadcnToaster position="top-right" /> {/* shadcn/ui toast */}
        <SonnerToaster richColors /> {/* sonner toast */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
