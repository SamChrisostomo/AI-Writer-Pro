'use client';

import * as React from 'react';
import { DashboardCard } from '@/components/molecules/dashboard-card';
import { supabase } from '@/lib/supabase';
import { Loader2, FileQuestion } from 'lucide-react';

export function DashboardGrid() {
  const [texts, setTexts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTexts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('texts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTexts(data || []);
      } catch (error) {
        console.error('Error fetching texts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTexts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (texts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
        <FileQuestion className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">Nenhum texto encontrado</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-xs mt-1">
          Você ainda não criou nenhum conteúdo. Comece agora mesmo usando o Escritor AI!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {texts.map((text) => (
        <DashboardCard 
          key={text.id} 
          title={text.title}
          description={text.content?.substring(0, 150) + '...'}
          date={new Date(text.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          readingTime={`${Math.ceil((text.content?.split(' ').length || 0) / 200)} min`}
          category={text.category || 'Geral'}
        />
      ))}
    </div>
  );
}
