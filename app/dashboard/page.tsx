import { DashboardGrid } from '@/components/organisms/dashboard-grid';
import { MainLayout } from '@/components/templates/main-layout';
import { Button } from '@/components/atoms/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Bem-vindo de volta! Aqui estão seus textos mais recentes.
            </p>
          </div>
          <Link href="/writer">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Texto
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Textos Recentes</h2>
          <DashboardGrid />
        </div>
      </div>
    </MainLayout>
  );
}
