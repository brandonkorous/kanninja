import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { AppShell } from '@/components/layout/app-shell';

// The authoritative auth gate for the whole authenticated app. `middleware.ts`
// only checks that a session cookie exists; this verifies it against the API.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  return <AppShell>{children}</AppShell>;
}
