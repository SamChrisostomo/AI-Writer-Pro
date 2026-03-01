import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export async function POST(req: Request) {
  let publicUserId: number | null = null;
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { data: publicUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (!publicUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    publicUserId = publicUser.id;

    const { topic, textType, instructions, agent, modelName, customAgents } = await req.json();

    let systemInstruction = 'You are a helpful AI writing assistant.';
    let temperature = 0.7;
    let topK = 40;

    if (agent === 'creative') {
      systemInstruction = 'You are a creative writer. Use vivid imagery and metaphors.';
      temperature = 0.9;
      topK = 40;
    } else if (agent === 'professional') {
      systemInstruction = 'You are a professional editor. Use formal and concise language.';
      temperature = 0.3;
      topK = 20;
    } else if (agent !== 'default' && customAgents) {
      const selectedAgent = customAgents.find((a: any) => a.id.toString() === agent);
      if (selectedAgent) {
        systemInstruction = selectedAgent.prompt;
        temperature = selectedAgent.temperature ?? 0.7;
        topK = selectedAgent.top_k ?? 40;
      }
    }

    const prompt = `Write a ${textType} about "${topic}".
    
    Instructions: ${instructions || 'None'}
    `;

    // Fetch user API keys
    const { data: keys } = await supabase
      .from('user_api_keys')
      .select('provider, model_name, api_key')
      .eq('user_id', publicUserId);

    const isGoogleModel = modelName.includes('gemini');
    const isGoogleProModel = modelName.includes('pro');
    const isOpenAIModel = modelName.includes('gpt');

    const encoder = new TextEncoder();

    if (isGoogleModel) {
      // Find a specific key for this model, or a general key for all google models
      const googleKey = keys?.find(k => k.provider === 'google' && (k.model_name === 'all' || k.model_name === modelName))?.api_key;
      
      if (isGoogleProModel && !googleKey) {
        throw new Error('Modelos Pro do Gemini exigem uma chave de API própria (BYOK). Configure-a nas Configurações.');
      }

      const apiKey = googleKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Chave de API do Gemini não configurada.');
      }

      const ai = new GoogleGenAI({ apiKey });

      const streamResponse = await ai.models.generateContentStream({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature,
          topK,
          tools: [{ googleSearch: {} }], // Enable Search Grounding
        },
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const text = chunk.text || '';
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (err: any) {
            console.error('Streaming error (Google):', err);
            controller.error(err);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

    } else if (isOpenAIModel) {
      const openaiKey = keys?.find(k => k.provider === 'openai' && (k.model_name === 'all' || k.model_name === modelName))?.api_key;
      
      if (!openaiKey) {
        throw new Error('Chave de API da OpenAI não configurada para este modelo. Adicione-a nas Configurações.');
      }

      const openai = new OpenAI({ apiKey: openaiKey });

      const streamResponse = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature,
        stream: true,
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (err: any) {
            console.error('Streaming error (OpenAI):', err);
            controller.error(err);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } else {
      throw new Error(`Modelo não suportado: ${modelName}`);
    }

  } catch (error: any) {
    console.error('Error in generate API:', error);
    
    // Log error to Supabase
    if (publicUserId) {
      try {
        await supabase.from('error_logs').insert({
          user_id: publicUserId,
          error_message: error.message || 'Unknown error',
          stack_trace: error.stack || null,
          context: 'API /api/generate',
        });
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
    }

    // Return a structured error response
    return NextResponse.json(
      { error: error.message || 'Erro interno ao gerar texto' },
      { status: error.status || 500 }
    );
  }
}
