import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, textType, instructions, agent } = await req.json();

    let systemInstruction = 'You are a helpful AI writing assistant.';
    if (agent === 'creative') {
      systemInstruction = 'You are a creative writer. Use vivid imagery and metaphors.';
    } else if (agent === 'professional') {
      systemInstruction = 'You are a professional editor. Use formal and concise language.';
    }

    const prompt = `Write a ${textType} about "${topic}".
    
    Instructions: ${instructions || 'None'}
    `;

    const modelName = 'gemini-3-flash-preview';
    let generatedText = '';
    
    try {
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
        },
      });
      generatedText = response.text || '';
    } catch (genError: any) {
      console.error('Gemini Generation Error:', genError);
      return NextResponse.json(
        { error: `Erro na geração: ${genError.message || 'Desconhecido'}` },
        { status: 500 }
      );
    }

    if (!generatedText) {
      return NextResponse.json({ error: 'A IA não retornou nenhum texto.' }, { status: 500 });
    }

    // 1. Save to 'texts' table (UUID based) - Don't block if this fails
    try {
      await supabase.from('texts').insert({
        user_id: user.id,
        title: topic,
        content: generatedText,
        category: textType,
      });
    } catch (err) {
      console.error('Error saving to texts table:', err);
    }

    // 2. Save to 'generations' table (Integer based user_id)
    try {
      let { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      // If missing, create on the fly
      if (!publicUser && user.email) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
          })
          .select('id')
          .maybeSingle();
        publicUser = newUser;
      }

      if (publicUser) {
        await supabase.from('generations').insert({
          user_id: publicUser.id,
          topic: topic,
          text_type: textType,
          instructions: instructions,
          ai_model: modelName,
          generated_text: generatedText,
        });
      }
    } catch (err) {
      console.error('Error saving to generations/users table:', err);
    }

    return NextResponse.json({ text: generatedText });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
