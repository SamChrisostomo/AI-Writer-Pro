import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/atoms/toaster';

export const metadata: Metadata = {
  title: 'AI Writer Pro',
  description: 'Professional AI-powered writing platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
