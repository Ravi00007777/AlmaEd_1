import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TutorConnect - Find Your Perfect Tutor',
    template: '%s | TutorConnect',
  },
  description: 'Personalized 1-on-1 tutoring for Grades 8-12, JEE, NEET, and Board Exams. AI-matched teachers. Automated scheduling.',
  keywords: ['tutoring', 'online tutoring', 'JEE preparation', 'NEET preparation', 'board exams', 'private tutor'],
  authors: [{ name: 'TutorConnect' }],
  creator: 'TutorConnect',
  publisher: 'TutorConnect',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://tutorconnect.com',
    siteName: 'TutorConnect',
    title: 'TutorConnect - Find Your Perfect Tutor',
    description: 'Personalized 1-on-1 tutoring for Grades 8-12, JEE, NEET, and Board Exams.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TutorConnect',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TutorConnect - Find Your Perfect Tutor',
    description: 'Personalized 1-on-1 tutoring for Grades 8-12, JEE, NEET, and Board Exams.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}