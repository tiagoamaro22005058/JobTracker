import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedClient } from '@/lib/api';
import { applicationSchema } from '@/lib/applications';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: 'Invalid application ID.' }, { status: 400 });
  const parsed = applicationSchema
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'No changes supplied.')
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { data, error } = await auth.supabase
    .from('applications')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: 'Could not update this application.' }, { status: 500 });
  return data
    ? NextResponse.json(data)
    : NextResponse.json({ error: 'Application not found.' }, { status: 404 });
}
export async function DELETE(_request: Request, context: Context) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: 'Invalid application ID.' }, { status: 400 });
  const { data, error } = await auth.supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('id')
    .maybeSingle();
  if (error)
    return NextResponse.json({ error: 'Could not delete this application.' }, { status: 500 });
  return data
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: 'Application not found.' }, { status: 404 });
}
