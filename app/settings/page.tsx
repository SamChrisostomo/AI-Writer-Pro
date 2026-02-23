import { MainLayout } from '@/components/templates/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie suas preferências de conta e configurações do agente AI.
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 italic">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferências da AI</CardTitle>
              <CardDescription>Configure o tom e estilo padrão das respostas.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 italic">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
