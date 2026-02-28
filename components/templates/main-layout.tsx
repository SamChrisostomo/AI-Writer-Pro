'use client';

import { Sidebar } from '@/components/organisms/sidebar';
import { motion } from 'motion/react';
import { ModeToggle } from '@/components/molecules/mode-toggle';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 sm:px-6 lg:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60 justify-end">
          <ModeToggle />
        </header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
