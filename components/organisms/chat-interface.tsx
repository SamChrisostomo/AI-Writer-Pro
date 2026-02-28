'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send, History, Settings, MessageSquare, Sparkles, FileQuestion, Copy, Check, Download, Share2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { ContentToolbar } from '@/components/molecules/content-toolbar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

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
  const [preferredModel, setPreferredModel] = useState('gemini-3-flash-preview');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 6;

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
        .select('*')
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
          .select('*')
          .maybeSingle();
        
        if (!insertError && newUser) {
          publicUser = newUser;
        }
      }

      if (publicUser) {
        setPublicUserId(publicUser.id);
        if (publicUser.preferred_model) {
          setPreferredModel(publicUser.preferred_model);
        }
        
        // Fetch agents and history concurrently with exact count for pagination
        const from = 0;
        const to = ITEMS_PER_PAGE - 1;

        const [agentsRes, historyRes] = await Promise.all([
          supabase.from('ai_agents').select('*').eq('user_id', publicUser.id),
          supabase
            .from('generations')
            .select('*', { count: 'exact' })
            .eq('user_id', publicUser.id)
            .order('created_at', { ascending: false })
            .range(from, to)
        ]);

        if (agentsRes.data) setCustomAgents(agentsRes.data);
        if (historyRes.data) setHistory(historyRes.data);
        if (historyRes.count) setTotalPages(Math.ceil(historyRes.count / ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do Supabase');
    } finally {
      setIsFetching(false);
    }
  };

  const fetchHistoryPage = async (userId: number, targetPage: number) => {
    setIsFetching(true);
    try {
      const from = (targetPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, count } = await supabase
        .from('generations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (data) setHistory(data);
      if (count) setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      setPage(targetPage);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsFetching(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedText('');

    try {
      // 1. Generate text on the client side with streaming
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const modelName = preferredModel;
      
      let systemInstruction = 'You are a helpful AI writing assistant.';
      let temperature = 0.7;
      let topK = 40;

      if (values.agent === 'creative') {
        systemInstruction = 'You are a creative writer. Use vivid imagery and metaphors.';
        temperature = 0.9;
        topK = 40;
      } else if (values.agent === 'professional') {
        systemInstruction = 'You are a professional editor. Use formal and concise language.';
        temperature = 0.3;
        topK = 20;
      } else if (values.agent !== 'default') {
        const selectedAgent = customAgents.find(a => a.id.toString() === values.agent);
        if (selectedAgent) {
          systemInstruction = selectedAgent.prompt;
          temperature = selectedAgent.temperature ?? 0.7;
          topK = selectedAgent.top_k ?? 40;
        }
      }

      const prompt = `Write a ${values.textType} about "${values.topic}".
      
      Instructions: ${values.instructions || 'None'}
      `;

      const streamResponse = await ai.models.generateContentStream({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature,
          topK,
        },
      });

      let fullText = '';
      for await (const chunk of streamResponse) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        setGeneratedText(fullText);
      }

      if (!fullText) throw new Error('A IA não retornou nenhum texto.');
      
      // 2. Save to database via API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          generatedText: fullText,
          modelName
        }),
      });

      if (!response.ok) {
        console.error('Falha ao salvar no banco de dados');
      }

      toast.success('Texto gerado com sucesso!');

      // Refresh history
      if (publicUserId) {
        await fetchHistoryPage(publicUserId, 1);
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

            <Card className="flex flex-col overflow-hidden border-primary/10 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">Conteúdo Gerado</CardTitle>
                {generatedText && (
                  <ContentToolbar 
                    content={generatedText} 
                    onClear={() => setGeneratedText('')}
                    title={form.getValues('topic')}
                  />
                )}
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="min-h-[400px] h-full rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-inner whitespace-pre-wrap font-sans overflow-auto max-h-[600px] relative">
                  {isLoading && !generatedText ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[95%]" />
                      <Skeleton className="h-4 w-[70%]" />
                      <Skeleton className="h-4 w-[85%]" />
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-sm font-medium text-primary animate-pulse">A IA está escrevendo...</p>
                        </div>
                      </div>
                    </div>
                  ) : generatedText ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown>{generatedText}</ReactMarkdown>
                      {isLoading && (
                        <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse align-middle" />
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 mb-4">
                        <FileQuestion className="h-10 w-10 opacity-40" />
                      </div>
                      <p className="text-base font-medium">Pronto para começar?</p>
                      <p className="text-sm opacity-70">Preencha o formulário ao lado para gerar seu conteúdo.</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {generatedText && (
                <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t py-3 px-6 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    {generatedText.split(/\s+/).filter(Boolean).length} palavras | {generatedText.length} caracteres
                  </span>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Gerado com {preferredModel}
                  </Badge>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Gerações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isFetching ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed">
                    <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Nenhum histórico encontrado.</p>
                    <p className="text-sm text-slate-400">Suas gerações aparecerão aqui automaticamente.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    {history.map((item) => (
                      <Drawer key={item.id}>
                        <DrawerTrigger asChild>
                          <div className="group p-5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 hover:border-primary/30 hover:shadow-md transition-all bg-white dark:bg-slate-950 cursor-pointer">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">{item.topic}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
                                    {item.text_type}
                                  </Badge>
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
                              >
                                Ver
                              </Button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                              &quot;{item.generated_text}&quot;
                            </p>
                          </div>
                        </DrawerTrigger>
                        <DrawerContent>
                          <div className="mx-auto w-full max-w-4xl p-6 overflow-y-auto max-h-[85vh]">
                            <DrawerHeader className="px-0">
                              <DrawerTitle className="text-2xl">{item.topic}</DrawerTitle>
                              <DrawerDescription className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium">
                                  {item.text_type}
                                </span>
                                <span>
                                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="prose prose-slate dark:prose-invert max-w-none mt-6 pb-12">
                              <ReactMarkdown>{item.generated_text}</ReactMarkdown>
                            </div>
                            <DrawerFooter className="px-0 pt-6 border-t">
                              <DrawerClose asChild>
                                <Button variant="outline">Fechar</Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </div>
                        </DrawerContent>
                      </Drawer>
                    ))}
                  </div>
                )}

                {totalPages > 1 && !isFetching && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => publicUserId && fetchHistoryPage(publicUserId, page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <span className="text-sm font-medium text-slate-500">
                      Página {page} de {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => publicUserId && fetchHistoryPage(publicUserId, page + 1)}
                      disabled={page === totalPages}
                    >
                      Próxima <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
