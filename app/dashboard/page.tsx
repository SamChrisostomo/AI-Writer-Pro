import { DashboardFileManager } from '@/features/dashboard/components/dashboard-file-manager';
import { MainLayout } from '@/features/core/components/main-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-8 h-[calc(100vh-8rem)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arquivos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Gerencie seus textos, organize-os em pastas e crie novos conteúdos com a IA.
            </p>
          </div>
          <Link href="/writer">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Texto
            </Button>
          </Link>
        </div>

        <div className="flex-1">
          <DashboardFileManager />
        </div>
      </div>
    </MainLayout>
  );
}
