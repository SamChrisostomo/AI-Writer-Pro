import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, textType, instructions, generatedText, modelName } = await req.json();

    if (!generatedText) {
      return NextResponse.json({ error: 'Nenhum texto fornecido para salvar.' }, { status: 400 });
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
          ai_model: modelName || 'gemini-3-flash-preview',
          generated_text: generatedText,
        });
      }
    } catch (err) {
      console.error('Error saving to generations/users table:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}
