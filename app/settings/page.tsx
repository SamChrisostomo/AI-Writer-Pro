'use client';

import * as React from 'react';
import { MainLayout } from '@/components/templates/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Bot, User, Upload, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  
  const [authUser, setAuthUser] = React.useState<any>(null);
  const [publicUser, setPublicUser] = React.useState<any>(null);

  const [newAgent, setNewAgent] = React.useState({ name: '', prompt: '', temperature: 0.7, top_k: 40 });
  const [editingAgent, setEditingAgent] = React.useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const [profileName, setProfileName] = React.useState('');

  React.useEffect(() => {
    fetchData();
  }, []);

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
        user_id: publicUser.id
      });

      if (error) throw error;

      toast.success('Agente criado com sucesso!');
      setNewAgent({ name: '', prompt: '', temperature: 0.7, top_k: 40 });
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
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="agents">Agentes AI</TabsTrigger>
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
                              <Button variant="ghost" size="icon" onClick={(e) => handleDeleteAgent(agent.id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
