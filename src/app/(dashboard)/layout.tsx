import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/sign-out-button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="font-semibold">EdTech Platform</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            {session?.user?.name} · {session?.user?.role}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
