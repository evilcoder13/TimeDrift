'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';

export const LanguageSwitcher: React.FC = () => {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Set cookie for persistence (1 year max-age)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Pathname starts with /[locale]
    const segments = pathname.split('/');
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const targetUrl = segments.join('/') || `/${newLocale}`;
    router.push(targetUrl);
    router.refresh();
  };

  return (
    <div className="inline-flex items-center rounded-full border border-ink/15 bg-paper-light p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`px-2.5 py-1 rounded-full transition-colors ${
          currentLocale === 'en'
            ? 'bg-ink text-paper font-semibold shadow-sm'
            : 'text-ink-soft hover:text-ink'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleSwitch('vi')}
        className={`px-2.5 py-1 rounded-full transition-colors ${
          currentLocale === 'vi'
            ? 'bg-ink text-paper font-semibold shadow-sm'
            : 'text-ink-soft hover:text-ink'
        }`}
        aria-label="Chuyển sang Tiếng Việt"
      >
        VI
      </button>
    </div>
  );
};

export default LanguageSwitcher;
