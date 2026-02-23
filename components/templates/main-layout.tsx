'use client';

import { Sidebar } from '@/components/organisms/sidebar';
import { motion } from 'motion/react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-8 lg:p-12"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
