import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let { data: publicUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (!publicUser) return NextResponse.json({ keys: {} });

    const { data: keys } = await supabase
      .from('user_api_keys')
      .select('provider, model_name')
      .eq('user_id', publicUser.id);

    return NextResponse.json({ keys: keys || [] });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider, model_name, apiKey } = await req.json();

    if (!provider || !model_name || !apiKey) {
      return NextResponse.json({ error: 'Provider, model and API key are required' }, { status: 400 });
    }

    let { data: publicUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (!publicUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Delete existing key for this provider and model
    await supabase
      .from('user_api_keys')
      .delete()
      .match({ user_id: publicUser.id, provider, model_name });

    // Insert new key
    const { error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: publicUser.id,
        provider,
        model_name,
        api_key: apiKey,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving key:', error);
    return NextResponse.json({ error: 'Failed to save key' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { provider, model_name } = await req.json();

    let { data: publicUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (!publicUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .match({ user_id: publicUser.id, provider, model_name });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key:', error);
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
  }
}
