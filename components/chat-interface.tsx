'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send, History, Settings, MessageSquare, Sparkles, FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/atoms/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  topic: z.string().min(2, {
    message: 'O tópico deve ter pelo menos 2 caracteres.',
  }),
  textType: z.string().min(1, {
    message: 'Selecione um tipo de texto.',
  }),
  instructions: z.string().optional(),
  agent: z.string().min(1, {
    message: 'Selecione um agente AI.',
  }),
});

export function ChatInterface() {
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customAgents, setCustomAgents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [publicUserId, setPublicUserId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      instructions: '',
      agent: 'default',
    },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get integer ID from public.users
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
        
        // Fetch agents and history
        const [agentsRes, historyRes] = await Promise.all([
          supabase.from('ai_agents').select('*').eq('user_id', publicUser.id),
          supabase.from('generations').select('*').eq('user_id', publicUser.id).order('created_at', { ascending: false })
        ]);

        if (agentsRes.data) setCustomAgents(agentsRes.data);
        if (historyRes.data) setHistory(historyRes.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do Supabase');
    } finally {
      setIsFetching(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar texto');
      }

      const data = await response.json();
      setGeneratedText(data.text);
      toast.success('Texto gerado com sucesso!');

      // Refresh history
      if (publicUserId) {
        const { data: newHistory } = await supabase
          .from('generations')
          .select('*')
          .eq('user_id', publicUserId)
          .order('created_at', { ascending: false });
        
        if (newHistory) setHistory(newHistory);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar texto. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Criar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-slate-600" />
                  Escritor AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tópico</FormLabel>
                          <FormControl>
                            <Input placeholder="Sobre o que vamos escrever?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="textType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Texto</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o formato" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="essay">Redação</SelectItem>
                              <SelectItem value="article">Artigo</SelectItem>
                              <SelectItem value="story">História</SelectItem>
                              <SelectItem value="blog-post">Blog Post</SelectItem>
                              <SelectItem value="social-media">Redes Sociais</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instruções (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Algum detalhe específico ou tom de voz?"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="agent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agente AI</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um agente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="default">Assistente Padrão</SelectItem>
                              <SelectItem value="creative">Escritor Criativo</SelectItem>
                              <SelectItem value="professional">Editor Profissional</SelectItem>
                              {customAgents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id.toString()}>
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Gerar Texto
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Conteúdo Gerado</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="min-h-[400px] h-full rounded-md border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 whitespace-pre-wrap font-sans overflow-auto max-h-[600px]">
                  {generatedText || (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <FileQuestion className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">Seu texto aparecerá aqui...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Gerações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isFetching ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    Nenhum histórico encontrado.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50">{item.topic}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{item.text_type}</Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                          setGeneratedText(item.generated_text);
                          toast.info('Texto carregado no visualizador');
                        }}>
                          Carregar
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                        &quot;{item.generated_text?.substring(0, 200)}...&quot;
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
