'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send, History, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  topic: z.string().min(2, {
    message: 'Topic must be at least 2 characters.',
  }),
  textType: z.string().min(1, {
    message: 'Please select a text type.',
  }),
  instructions: z.string().optional(),
  agent: z.string().min(1, {
    message: 'Please select an AI agent.',
  }),
});

export function ChatInterface() {
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customAgents, setCustomAgents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      instructions: '',
      agent: 'default',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [agentsRes, historyRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/history'),
      ]);
      
      if (agentsRes.ok) {
        setCustomAgents(await agentsRes.json());
      }
      
      if (historyRes.ok) {
        setHistory(await historyRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        throw new Error('Failed to generate text');
      }

      const data = await response.json();
      setGeneratedText(data.text);

      // Save to history
      await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: values.topic,
          textType: values.textType,
          content: data.text,
          agentId: values.agent !== 'default' && values.agent !== 'creative' && values.agent !== 'professional' ? values.agent : null,
        }),
      });

      // Refresh history
      const historyRes = await fetch('/api/history');
      if (historyRes.ok) {
        setHistory(await historyRes.json());
      }
    } catch (error) {
      console.error(error);
      setGeneratedText('An error occurred while generating text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="flex justify-end mb-4 gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Writer</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the topic..." {...field} />
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
                          <FormLabel>Text Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a text type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="essay">Essay</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="story">Story</SelectItem>
                              <SelectItem value="blog-post">Blog Post</SelectItem>
                              <SelectItem value="social-media">Social Media Post</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
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
                          <FormLabel>Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any specific instructions for the AI..."
                              className="resize-none"
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
                          <FormLabel>AI Agent</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an AI agent" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="default">Default Assistant</SelectItem>
                              <SelectItem value="creative">Creative Writer</SelectItem>
                              <SelectItem value="professional">Professional Editor</SelectItem>
                              {customAgents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
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
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Generate Text
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px] rounded-md border p-4 bg-muted/50 whitespace-pre-wrap font-sans overflow-auto max-h-[600px]">
                  {generatedText || 'Your generated text will appear here...'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isFetching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No history yet.</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{item.topic}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.textType} • {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setGeneratedText(item.content)}>
                          Load
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {item.content}
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
