import { ChatInterface } from '@/components/organisms/chat-interface';
import { MainLayout } from '@/components/templates/main-layout';

export default function WriterPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escritor AI</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Crie conteúdos incríveis com a ajuda da nossa inteligência artificial.
          </p>
        </div>
        <ChatInterface />
      </div>
    </MainLayout>
  );
}
