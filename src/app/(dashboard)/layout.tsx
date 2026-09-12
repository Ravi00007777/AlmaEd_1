import { auth } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <DashboardShell name={session?.user?.name ?? ''} role={session?.user?.role ?? 'STUDENT'}>
      {children}
    </DashboardShell>
  );
}
