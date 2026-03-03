import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

    const prompt = `You are an advanced plagiarism and originality checker. Analyze the following text and provide an originality report.
Return ONLY a JSON object with the following structure:
{
  "originalityScore": number (0-100, where 100 is completely original),
  "plagiarismRisk": "Low" | "Medium" | "High",
  "analysis": "A brief explanation of the findings, mentioning if it looks AI-generated or matches common patterns."
}

Text to analyze:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text || '{}';
    const result = JSON.parse(resultText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Plagiarism check error:', error);
    return NextResponse.json({ error: 'Failed to check plagiarism' }, { status: 500 });
  }
}
