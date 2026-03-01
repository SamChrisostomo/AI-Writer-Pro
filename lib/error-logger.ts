import { supabase } from '@/lib/supabase';

export async function logError(
  userId: number | null,
  errorMessage: string,
  stackTrace: string | null = null,
  context: string | null = null
) {
  try {
    await supabase.from('error_logs').insert({
      user_id: userId,
      error_message: errorMessage,
      stack_trace: stackTrace,
      context: context,
    });
  } catch (err) {
    console.error('Failed to log error to Supabase:', err);
  }
}
