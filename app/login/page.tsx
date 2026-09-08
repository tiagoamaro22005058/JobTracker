import { AuthForm } from '@/components/auth-form';
import { isConfigured } from '@/lib/supabase/config';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const { notice } = await searchParams;
  return <AuthForm configured={isConfigured} confirmationReturn={notice === 'confirmation'} />;
}
