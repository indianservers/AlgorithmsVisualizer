import configuration from './languages.json'
export const defaultLocale = 'en-IN'
export const localeStorageKey = 'algodrishti-language'
export const languages = configuration.map(([code, nativeName, englishName, region]) => ({
  code,
  nativeName,
  englishName,
  region,
  direction: code === 'ar' || code === 'ur' ? ('rtl' as const) : ('ltr' as const),
}))
export function validLocale(code: unknown): string {
  return typeof code === 'string' && languages.some((language) => language.code === code) ? code : defaultLocale
}
export function storedLocale(): string {
  try {
    const saved = localStorage.getItem(localeStorageKey)
    const locale = validLocale(saved)
    if (saved && saved !== locale) localStorage.setItem(localeStorageKey, locale)
    return locale
  } catch {
    return defaultLocale
  }
}
