import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">EdTech Platform</h1>
      <p className="max-w-md text-gray-600">
        One dashboard for scheduled classes, assignments, and tests — no more juggling links.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded bg-gray-900 px-4 py-2 text-white">
          Log in
        </Link>
        <Link href="/register" className="rounded border border-gray-300 px-4 py-2">
          Register as a student
        </Link>
      </div>
    </main>
  );
}
