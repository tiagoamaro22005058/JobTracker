import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/supabase/config';
import { ApplicationProvider } from '@/hooks/use-applications';
import { AppShell } from '@/components/app-shell';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured) redirect('/login');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <ApplicationProvider
      name={user.user_metadata.full_name || user.email?.split('@')[0] || 'there'}
      email={user.email || ''}
    >
      <AppShell>{children}</AppShell>
    </ApplicationProvider>
  );
}
