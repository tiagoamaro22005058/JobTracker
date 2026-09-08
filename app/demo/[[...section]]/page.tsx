import { notFound } from 'next/navigation';
import { ApplicationProvider } from '@/hooks/use-applications';
import { AppShell } from '@/components/app-shell';
import { Workspace } from '@/components/workspace';
import { Statistics } from '@/components/statistics';
import { Profile } from '@/components/profile';
export default async function Demo({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  const page = section?.[0] || 'dashboard';
  if (
    (section?.length || 0) > 1 ||
    !['dashboard', 'applications', 'statistics', 'profile'].includes(page)
  )
    notFound();
  return (
    <ApplicationProvider demo name="Alex Morgan" email="alex@example.com">
      <AppShell>
        {page === 'statistics' ? (
          <Statistics />
        ) : page === 'profile' ? (
          <Profile />
        ) : (
          <Workspace allApplications={page === 'applications'} />
        )}
      </AppShell>
    </ApplicationProvider>
  );
}
