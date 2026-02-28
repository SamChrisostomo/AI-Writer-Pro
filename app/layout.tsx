import type {Metadata} from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { Toaster } from '@/components/atoms/toaster';
import { ThemeProvider } from '@/components/atoms/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'AI Writer Pro',
  description: 'Professional AI-powered writing platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
