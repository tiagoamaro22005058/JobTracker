import { AuthForm } from '@/components/auth-form';
import { isConfigured } from '@/lib/supabase/config';
export default function Register() {
  return <AuthForm register configured={isConfigured} />;
}
