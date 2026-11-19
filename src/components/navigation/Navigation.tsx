'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

export const Navigation: React.FC = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tApp = useTranslations('app');

  const navItems = [
    { href: `/${locale}`, label: tNav('sanctuary') },
    { href: `/${locale}/custom`, label: tNav('custom') },
    { href: `/${locale}/playlists`, label: tNav('journeys') },
    { href: `/${locale}/account`, label: tNav('account') },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink/10 bg-paper/90 backdrop-blur-md transition-colors duration-daynight">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Brand */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-serif text-xl sm:text-2xl font-semibold tracking-tight text-ink hover:text-accent transition-colors"
        >
          <span>{tApp('title')}</span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-paper-dark text-ink font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-paper-light'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Theme + Lang */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Navigation;
