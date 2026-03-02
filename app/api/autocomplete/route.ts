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

    const { textBeforeCursor } = await req.json();

    if (!textBeforeCursor) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const prompt = `Você é um assistente de autocompletar texto (estilo GitHub Copilot). 
O usuário está escrevendo o seguinte texto:
"${textBeforeCursor}"

Continue a frase ou parágrafo de forma natural e fluida.
Retorne APENAS o texto da continuação, sem aspas, sem explicações e sem repetir o que já foi escrito.
Seja conciso (máximo de 1 a 2 frases).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: 'Retorne apenas a continuação exata do texto, sem formatação markdown ou aspas.',
        temperature: 0.3,
        maxOutputTokens: 50,
      }
    });

    return NextResponse.json({ text: response.text?.trim() || '' });
  } catch (error: any) {
    console.error('Error in autocomplete:', error);
    return NextResponse.json({ error: error.message || 'Failed to autocomplete' }, { status: 500 });
  }
}
