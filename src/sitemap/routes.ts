export const sitemapLocales = ['en-IN', 'hi', 'te', 'ru', 'ar', 'de'] as const
export type SitemapLocale = (typeof sitemapLocales)[number]
export function sitemapPath(locale: string) {
  return locale === 'en-IN' ? '/sitemap' : `/sitemap/${locale}`
}
export function sitemapLocaleFromPath(pathname: string): SitemapLocale | undefined {
  if (pathname === '/sitemap') return 'en-IN'
  const code = /^\/sitemap\/([^/]+)$/.exec(pathname)?.[1]
  return sitemapLocales.find((locale) => locale === code)
}
