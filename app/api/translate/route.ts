import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { GoogleGenAI } from '@google/genai';
import { ratelimit } from '@/lib/rate-limit';

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

    // Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const identifier = `user_${publicUserId}_ip_${ip}`;
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', reset },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
    }

    const { data: keys } = await supabase
      .from('user_api_keys')
      .select('provider, model_name, api_key')
      .eq('user_id', publicUserId);

    const googleKey = keys?.find(k => k.provider === 'google' && (k.model_name === 'all' || k.model_name === 'gemini-3-flash-preview'))?.api_key;
    const apiKey = googleKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Chave de API do Gemini não configurada.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Translate the following text to ${targetLanguage}. Maintain the original tone, formatting, and context. Do not add any extra commentary, just return the translated text.

Text to translate:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const translatedText = response.text;

    if (!translatedText) {
      throw new Error('A IA não retornou nenhum texto traduzido.');
    }

    // Save the translation to the database
    const { data: savedTranslation, error: saveError } = await supabase
      .from('generations')
      .insert({
        user_id: publicUserId,
        topic: `Tradução para ${targetLanguage}`,
        text_type: 'translation',
        instructions: `Idioma original detectado automaticamente. Traduzido para: ${targetLanguage}`,
        generated_text: translatedText,
        ai_model: 'gemini-3-flash-preview'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save translation:', saveError);
    }

    return NextResponse.json({ translatedText, savedTranslation });

  } catch (error: any) {
    console.error('Error in translate API:', error);
    
    if (publicUserId) {
      try {
        await supabase.from('error_logs').insert({
          user_id: publicUserId,
          error_message: error.message || 'Unknown error',
          stack_trace: error.stack || null,
          context: 'API /api/translate',
        });
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Erro interno ao traduzir texto' },
      { status: error.status || 500 }
    );
  }
}
