import { NextResponse } from 'next/server';
import { authenticatedClient } from '@/lib/api';
import { applicationSchema } from '@/lib/applications';
export async function GET() {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  // Paginate the database reads so lists larger than Supabase's row limit stay complete.
  const applications = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await auth.supabase
      .from('applications')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + 999);
    if (error)
      return NextResponse.json(
        { error: 'Could not load applications. Check your connection and database setup.' },
        { status: 500 },
      );
    applications.push(...data);
    if (data.length < 1000) break;
  }
  return NextResponse.json(applications, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if (auth.error) return auth.error;
  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { data, error } = await auth.supabase
    .from('applications')
    .insert({ ...parsed.data, user_id: auth.user.id })
    .select()
    .single();
  if (error)
    return NextResponse.json(
      { error: 'Could not save this application. Please try again.' },
      { status: 500 },
    );
  return NextResponse.json(data, { status: 201 });
}
