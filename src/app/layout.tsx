import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AlmaEd',
  description: 'Connecting teachers and learners.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen bg-slate-50 font-[family-name:var(--font-sans)] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
