import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/routing';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match only internationalized pathnames, skipping internal assets, static files, and media
  matcher: ['/((?!api|_next|_vercel|media|scene-host.html|.*\\..*).*)'],
};
