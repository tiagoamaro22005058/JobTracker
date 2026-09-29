import { Emails } from '@/components/emails';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ connection?: string }>;
}) {
  const { connection } = await searchParams;
  return <Emails connection={connection} />;
}
