'use client';

import * as React from 'react';
import { MainLayout } from '@/components/templates/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Bot, User, Upload, Info, Key, AlertTriangle, Check, ChevronsUpDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  
  const [authUser, setAuthUser] = React.useState<any>(null);
  const [publicUser, setPublicUser] = React.useState<any>(null);

  const [newAgent, setNewAgent] = React.useState({ name: '', prompt: '', temperature: 0.7, top_k: 40, model: 'gemini-3-flash-preview' });
  const [editingAgent, setEditingAgent] = React.useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const [profileName, setProfileName] = React.useState('');

  // API Keys state
  const [apiKeys, setApiKeys] = React.useState<any[]>([]);
  const [newKey, setNewKey] = React.useState({ provider: 'openai', model_name: 'all', key: '' });
  const [isKeySaving, setIsKeySaving] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [openModelCombobox, setOpenModelCombobox] = React.useState(false);

  const allModels = [
    { value: "all", label: "Todos os modelos", provider: "all" },
    { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "google" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "google" },
  ];

  const availableModels = allModels.filter(m => m.provider === "all" || m.provider === newKey.provider);

  const hasKeyForModel = (provider: string, model: string) => {
    return apiKeys.some(k => k.provider === provider && (k.model_name === 'all' || k.model_name === model));
  };

  const agentAvailableModels = [
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Padrão)", available: true },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Avançado)", available: hasKeyForModel('google', 'gemini-3.1-pro-preview') },
    { value: "gpt-4o-mini", label: "OpenAI GPT-4o Mini", available: hasKeyForModel('openai', 'gpt-4o-mini') },
    { value: "gpt-4o", label: "OpenAI GPT-4o", available: hasKeyForModel('openai', 'gpt-4o') },
  ].filter(m => m.available);

  React.useEffect(() => {
    fetchData();
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        if (data.keys) setApiKeys(data.keys);
      }
    } catch (e) {
      console.error('Failed to fetch API keys', e);
    }
  }

  async function handleSaveApiKey() {
    if (!newKey.key) return;
    setIsKeySaving(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newKey.provider, model_name: newKey.model_name, apiKey: newKey.key }),
      });
      if (!res.ok) throw new Error('Falha ao salvar chave');
      toast.success('Chave de API salva com sucesso!');
      setNewKey({ ...newKey, key: '' });
      fetchApiKeys();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsKeySaving(false);
    }
  }

  async function handleDeleteApiKey(provider: string, model_name: string) {
    try {
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model_name }),
      });
      if (!res.ok) throw new Error('Falha ao remover chave');
      toast.success('Chave removida!');
      fetchApiKeys();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthUser(user);

      let { data: pUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (!pUser && user.email) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
          })
          .select('*')
          .maybeSingle();
        
        if (!insertError && newUser) {
          pUser = newUser;
        }
      }

      if (pUser) {
        setPublicUser(pUser);
        setProfileName(pUser.name || '');
        const { data } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('user_id', pUser.id)
          .order('created_at', { ascending: false });
        setAgents(data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgent() {
    if (!newAgent.name || !newAgent.prompt || !publicUser) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('ai_agents').insert({
        name: newAgent.name,
        prompt: newAgent.prompt,
        temperature: newAgent.temperature,
        top_k: newAgent.top_k,
        model: newAgent.model,
        user_id: publicUser.id
      });

      if (error) throw error;

      toast.success('Agente criado com sucesso!');
      setNewAgent({ name: '', prompt: '', temperature: 0.7, top_k: 40, model: 'gemini-3-flash-preview' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateAgent() {
    if (!editingAgent || !editingAgent.name || !editingAgent.prompt) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('ai_agents').update({
        name: editingAgent.name,
        prompt: editingAgent.prompt,
        temperature: editingAgent.temperature,
        top_k: editingAgent.top_k,
        model: editingAgent.model,
      }).eq('id', editingAgent.id);

      if (error) throw error;

      toast.success('Agente atualizado com sucesso!');
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteAgent(id: number, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent opening dialog
    try {
      const { error } = await supabase.from('ai_agents').delete().eq('id', id);
      if (error) throw error;
      toast.success('Agente removido');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteAccount() {
    if (!publicUser) return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.from('users').delete().eq('id', publicUser.id);
      if (error) throw error;
      
      await supabase.auth.signOut();
      toast.success('Conta excluída com sucesso.');
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta.');
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function handleUpdateProfile() {
    if (!publicUser || !profileName) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('users').update({
        name: profileName
      }).eq('id', publicUser.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !authUser || !publicUser) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${authUser.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('users').update({
        avatar_url: publicUrl
      }).eq('id', publicUser.id);

      if (updateError) throw updateError;

      toast.success('Avatar atualizado com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gerencie seus agentes personalizados e preferências de perfil.
          </p>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3 mb-8">
            <TabsTrigger value="agents">Agentes AI</TabsTrigger>
            <TabsTrigger value="providers">Provedores de IA</TabsTrigger>
            <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="agents">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Create Agent */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Criar Novo Agente
                  </CardTitle>
                  <CardDescription>Configure um novo assistente com personalidade única.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Nome do Agente</Label>
                      <Input 
                        placeholder="Ex: Especialista em SEO" 
                        value={newAgent.name}
                        onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Instruções (Prompt)</Label>
                      <Textarea 
                        placeholder="Como este agente deve se comportar?" 
                        value={newAgent.prompt}
                        onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Modelo de IA</Label>
                      <Select value={newAgent.model} onValueChange={(v) => setNewAgent({ ...newAgent, model: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {agentAvailableModels.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">Modelos Pro requerem chave de API configurada na aba Provedores.</p>
                    </div>

                    <div className="grid gap-4 pt-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            Temperatura: {newAgent.temperature}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-64 text-sm">Controla a criatividade. Valores mais altos (ex: 0.9) geram textos mais criativos, valores mais baixos (ex: 0.2) geram textos mais focados e determinísticos.</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                        <Slider 
                          value={[newAgent.temperature]} 
                          max={1} 
                          step={0.1} 
                          onValueChange={(val) => setNewAgent({ ...newAgent, temperature: val[0] })} 
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            Top-K: {newAgent.top_k}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-slate-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="w-64 text-sm">Limita o vocabulário. Valores menores tornam o texto mais previsível, valores maiores permitem mais diversidade de palavras.</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                        <Slider 
                          value={[newAgent.top_k]} 
                          max={40} 
                          min={1}
                          step={1} 
                          onValueChange={(val) => setNewAgent({ ...newAgent, top_k: val[0] })} 
                        />
                      </div>
                    </div>

                    <Button onClick={handleCreateAgent} disabled={creating || !newAgent.name || !newAgent.prompt} className="mt-4">
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Criar Agente</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Right: List Agents */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Seus Agentes</CardTitle>
                  <CardDescription>Clique em um agente para editar suas configurações.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    ) : agents.length === 0 ? (
                      <div className="text-center py-12 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Bot className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Nenhum agente criado ainda.</p>
                      </div>
                    ) : (
                      agents.map((agent) => (
                        <Dialog key={agent.id} open={isDialogOpen && editingAgent?.id === agent.id} onOpenChange={(open) => {
                          if (open) {
                            setEditingAgent(agent);
                            setIsDialogOpen(true);
                          } else {
                            setIsDialogOpen(false);
                            setTimeout(() => setEditingAgent(null), 200);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors group">
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">{agent.name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-1">{agent.prompt}</p>
                                <div className="flex gap-3 mt-2">
                                  <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">Temp: {agent.temperature}</span>
                                  <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">Top-K: {agent.top_k}</span>
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Agente</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => handleDeleteAgent(agent.id, e)} className="bg-red-600 hover:bg-red-700">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Agente</DialogTitle>
                              <DialogDescription>Atualize as configurações do seu assistente AI.</DialogDescription>
                            </DialogHeader>
                            {editingAgent && (
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Nome</Label>
                                  <Input 
                                    value={editingAgent.name}
                                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Instruções</Label>
                                  <Textarea 
                                    value={editingAgent.prompt}
                                    onChange={(e) => setEditingAgent({ ...editingAgent, prompt: e.target.value })}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Modelo de IA</Label>
                                  <Select value={editingAgent.model || 'gemini-3-flash-preview'} onValueChange={(v) => setEditingAgent({ ...editingAgent, model: v })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o modelo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {agentAvailableModels.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-4 pt-2">
                                  <div className="space-y-3">
                                    <Label>Temperatura: {editingAgent.temperature}</Label>
                                    <Slider 
                                      value={[editingAgent.temperature]} 
                                      max={1} 
                                      step={0.1} 
                                      onValueChange={(val) => setEditingAgent({ ...editingAgent, temperature: val[0] })} 
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <Label>Top-K: {editingAgent.top_k}</Label>
                                    <Slider 
                                      value={[editingAgent.top_k]} 
                                      max={40} 
                                      min={1}
                                      step={1} 
                                      onValueChange={(val) => setEditingAgent({ ...editingAgent, top_k: val[0] })} 
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                              <Button onClick={handleUpdateAgent} disabled={updating}>
                                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Salvar Alterações
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            <TabsContent value="providers">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle>Provedores de IA (BYOK)</CardTitle>
              <CardDescription>
                Configure suas próprias chaves de API para usar modelos avançados (como Gemini Pro ou OpenAI GPT-4).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção sobre Custos</AlertTitle>
                <AlertDescription>
                  Ao utilizar sua própria chave de API (BYOK - Bring Your Own Key), os custos de geração de texto serão cobrados diretamente na sua conta do provedor (Google Cloud ou OpenAI). A plataforma não se responsabiliza por esses custos.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Adicionar Nova Chave</h3>
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="grid gap-2 w-full sm:w-1/4">
                    <Label>Provedor</Label>
                    <Select value={newKey.provider} onValueChange={(v) => setNewKey({ ...newKey, provider: v, model_name: 'all' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="google">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 w-full sm:w-1/3">
                    <Label>Modelo</Label>
                    <Popover open={openModelCombobox} onOpenChange={setOpenModelCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openModelCombobox}
                          className="w-full justify-between font-normal"
                        >
                          {newKey.model_name
                            ? availableModels.find((model) => model.value === newKey.model_name)?.label
                            : "Selecione o modelo..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar modelo..." />
                          <CommandList>
                            <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                            <CommandGroup>
                              {availableModels.map((model) => (
                                <CommandItem
                                  key={model.value}
                                  value={model.value}
                                  onSelect={(currentValue) => {
                                    setNewKey({ ...newKey, model_name: currentValue === newKey.model_name ? "" : currentValue })
                                    setOpenModelCombobox(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newKey.model_name === model.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {model.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2 flex-1 min-w-[200px]">
                    <Label>Chave de API</Label>
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      value={newKey.key}
                      onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSaveApiKey} disabled={isKeySaving || !newKey.key || !newKey.model_name}>
                    {isKeySaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-medium">Chaves Configuradas</h3>
                <div className="grid gap-3">
                  {apiKeys.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-4">Nenhuma chave configurada.</div>
                  ) : (
                    apiKeys.map((k: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="font-medium capitalize">{k.provider}</span>
                          <span className="text-sm text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {k.model_name === 'all' ? 'Todos os modelos' : k.model_name}
                          </span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" /> Remover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Chave de API</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover esta chave?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteApiKey(k.provider, k.model_name)} className="bg-red-600 hover:bg-red-700">
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Seu Perfil
                </CardTitle>
                <CardDescription>Gerencie suas informações pessoais e foto de perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-2 border-slate-100 dark:border-slate-800">
                    <AvatarImage src={publicUser?.avatar_url || ''} alt={publicUser?.name || 'Avatar'} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {publicUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-medium">Foto de Perfil</h3>
                    <p className="text-sm text-slate-500">Recomendado: Imagem quadrada, máx 2MB.</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="avatar-upload"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                          {uploading ? 'Enviando...' : 'Alterar Foto'}
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="grid gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={publicUser?.email || ''} disabled className="bg-slate-50 dark:bg-slate-900/50" />
                    <p className="text-xs text-slate-500">O email não pode ser alterado.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Nome de Exibição</Label>
                    <Input 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={handleUpdateProfile} disabled={updating || !profileName || profileName === publicUser?.name}>
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Perfil
                </Button>
              </CardFooter>
            </Card>

            <Card className="max-w-2xl mt-8 border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Ações destrutivas para a sua conta. Tenha cuidado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-50">Excluir Conta</h4>
                    <p className="text-sm text-slate-500 mt-1 max-w-md">
                      A exclusão da conta é permanente e resultará na perda de todos os seus dados, textos gerados, agentes e chaves de API.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Excluir Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="bg-red-600 hover:bg-red-700">
                          {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Sim, excluir minha conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
