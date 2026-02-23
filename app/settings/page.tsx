'use client';

import * as React from 'react';
import { MainLayout } from '@/components/templates/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Bot } from 'lucide-react';

export default function SettingsPage() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [publicUserId, setPublicUserId] = React.useState<number | null>(null);

  const [newAgent, setNewAgent] = React.useState({ name: '', prompt: '' });

  React.useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      // If user doesn't exist in public.users, create them
      if (!publicUser && user.email) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
          })
          .select('id')
          .maybeSingle();
        
        if (!insertError && newUser) {
          publicUser = newUser;
        }
      }

      if (publicUser) {
        setPublicUserId(publicUser.id);
        const { data } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('user_id', publicUser.id);
        setAgents(data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgent() {
    if (!newAgent.name || !newAgent.prompt || !publicUserId) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('ai_agents').insert({
        name: newAgent.name,
        prompt: newAgent.prompt,
        user_id: publicUserId
      });

      if (error) throw error;

      toast.success('Agente criado com sucesso!');
      setNewAgent({ name: '', prompt: '' });
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteAgent(id: number) {
    try {
      const { error } = await supabase.from('ai_agents').delete().eq('id', id);
      if (error) throw error;
      toast.success('Agente removido');
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie seus agentes personalizados e preferências.
          </p>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Seus Agentes AI
              </CardTitle>
              <CardDescription>Crie agentes com personalidades e instruções específicas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nome do Agente</label>
                  <Input 
                    placeholder="Ex: Especialista em SEO" 
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Instruções (Prompt)</label>
                  <Textarea 
                    placeholder="Como este agente deve se comportar?" 
                    value={newAgent.prompt}
                    onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateAgent} disabled={creating || !newAgent.name || !newAgent.prompt}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Criar Agente</>}
                </Button>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : agents.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-4">Você ainda não tem agentes personalizados.</p>
                ) : (
                  agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div>
                        <h4 className="font-medium">{agent.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{agent.prompt}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAgent(agent.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
