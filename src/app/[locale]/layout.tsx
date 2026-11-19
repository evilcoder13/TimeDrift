import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';
import Navigation from '@/components/navigation/Navigation';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TimeDrift — Drift into stillness',
  description: 'Animated line-art scenes + looping AI music, played on a timer.',
  manifest: '/manifest.json',
  themeColor: '#2B2A28',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`} data-theme="day">
      <body className="bg-paper text-ink min-h-screen flex flex-col font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <Navigation />
          <main className="flex-1 w-full">{children}</main>
          <InstallPrompt />
        </NextIntlClientProvider>
        {/* Register Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
