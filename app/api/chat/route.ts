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

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    });

    const generatedText = response.text;

    // Save to Supabase
    const { error: dbError } = await supabase.from('texts').insert({
      user_id: user.id,
      title: topic,
      content: generatedText,
      category: textType,
    });

    if (dbError) {
      console.error('Error saving to database:', dbError);
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
