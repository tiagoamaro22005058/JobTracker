'use client';
import { ThemeProvider } from 'next-themes';
import { useAesthetic } from '@/hooks/use-aesthetic';
export function Providers({ children }: { children: React.ReactNode }) {
  useAesthetic();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
