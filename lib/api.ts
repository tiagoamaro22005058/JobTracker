import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/supabase/config';
export async function authenticatedClient() {
  if (!isConfigured)
    return {
      error: NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 }),
    } as const;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return {
      error: NextResponse.json(
        { error: 'Your session has expired. Please sign in again.' },
        { status: 401 },
      ),
    } as const;
  return { supabase, user } as const;
}
