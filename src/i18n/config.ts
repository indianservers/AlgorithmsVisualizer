import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultLocale, languages } from './languages'
import { namespaces } from './keys'
export const i18n = i18next.createInstance()
void i18n.use(initReactI18next).init({
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: languages.map((l) => l.code),
  load: 'currentOnly',
  ns: [...namespaces],
  defaultNS: 'common',
  fallbackNS: [...namespaces],
  resources: { [defaultLocale]: Object.fromEntries(namespaces.map((ns) => [ns, {}])) },
  initAsync: false,
  returnNull: false,
  returnEmptyString: false,
  keySeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false, bindI18n: 'languageChanged loaded' },
})
