import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
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

    const { data: keys } = await supabase
      .from('user_api_keys')
      .select('provider, model_name, api_key')
      .eq('user_id', publicUser.id);

    const googleKey = keys?.find(k => k.provider === 'google' && (k.model_name === 'all' || k.model_name === 'gemini-3-flash-preview'))?.api_key;
    const apiKey = googleKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Chave de API do Gemini não configurada.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const { text, command } = await req.json();

    if (!text || !command) {
      return NextResponse.json({ error: 'Text and command are required' }, { status: 400 });
    }

    let prompt = '';
    switch (command) {
      case 'improve':
        prompt = `Melhore a escrita do seguinte texto, corrigindo erros gramaticais e tornando-o mais claro e fluido, mantendo o idioma original:\n\n${text}`;
        break;
      case 'summarize':
        prompt = `Resuma o seguinte texto de forma concisa, mantendo os pontos principais e o idioma original:\n\n${text}`;
        break;
      case 'expand':
        prompt = `Expanda o seguinte texto, adicionando mais detalhes e contexto relevante, mantendo o idioma original:\n\n${text}`;
        break;
      case 'formal':
        prompt = `Reescreva o seguinte texto mudando o tom para um estilo mais formal e profissional, mantendo o idioma original:\n\n${text}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um assistente de edição de texto. Retorne APENAS o texto modificado, sem explicações, aspas ou formatação markdown adicional, a menos que o texto original já possua formatação.',
      }
    });

    return NextResponse.json({ text: response.text?.trim() || '' });
  } catch (error: any) {
    console.error('Error editing text:', error);
    return NextResponse.json({ error: error.message || 'Failed to edit text' }, { status: 500 });
  }
}
