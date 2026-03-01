import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { GoogleGenAI } from '@google/genai';

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

    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
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
        model: 'gemini-3-flash-preview'
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
