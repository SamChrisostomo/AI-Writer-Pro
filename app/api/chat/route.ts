import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { topic, textType, instructions, agent } = await req.json();

    let systemInstruction = 'You are a helpful AI writing assistant.';
    
    // Check if it's a built-in agent or a custom agent ID (UUID)
    if (agent === 'creative') {
      systemInstruction = 'You are a creative writer. Use vivid imagery and metaphors.';
    } else if (agent === 'professional') {
      systemInstruction = 'You are a professional editor. Use formal and concise language.';
    } else if (agent && agent !== 'default') {
      // Try to fetch custom agent from DB
      try {
        const customAgent = await db.query.agents.findFirst({
          where: eq(agents.id, agent),
        });
        if (customAgent) {
          systemInstruction = customAgent.prompt;
        }
      } catch (e) {
        console.error('Error fetching custom agent:', e);
      }
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

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
