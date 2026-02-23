import { LoginForm } from '@/components/molecules/login-form';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-3 bg-slate-900 dark:bg-slate-50 rounded-xl">
          <Sparkles className="h-8 w-8 text-white dark:text-slate-900" />
        </div>
        <span className="text-3xl font-bold tracking-tight">AI Writer Pro</span>
      </div>
      <LoginForm />
      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        Não tem uma conta? <a href="#" className="text-slate-900 dark:text-slate-50 font-medium hover:underline">Cadastre-se</a>
      </p>
    </main>
  );
}
