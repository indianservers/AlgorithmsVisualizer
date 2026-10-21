import { useTranslation } from 'react-i18next'
import { i18n } from './config'
import { defaultLocale } from './languages'
import { namespaces, sourceKey, type Namespace } from './keys'
import { templates } from './loader'
import exclusions from './exclusions.json'
const protectedTerms = new Set(exclusions.glossary)
const cache = new Map<string, string>()
i18n.on('languageChanged', () => cache.clear())
i18n.on('loaded', () => cache.clear())
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export function translateText(source: string, namespace: Namespace = 'common'): string {
  if (i18n.language === defaultLocale || !source.trim() || protectedTerms.has(source) || /^[-+\d\s.,:%×÷→∞]+$/.test(source) || /^[OΘΩ]\(/.test(source))
    return source
  const memoKey = i18n.language + '|' + namespace + '|' + source
  const cached = cache.get(memoKey)
  if (cached !== undefined) return cached
  let result = source
  const order = [namespace, ...namespaces.filter((ns) => ns !== namespace)]
  for (const ns of order) {
    const key = sourceKey(source)
    if (i18n.exists(key, { ns, lng: i18n.language, fallbackLng: false })) {
      result = String(i18n.t(key, { ns, lng: i18n.language, defaultValue: source }))
      break
    }
  }
  if (result === source) {
    for (const template of templates) {
      if (template.parts[0] && !source.startsWith(template.parts[0])) continue
      if (template.parts.length < 2) continue
      const ns = template.namespace
      if (!i18n.exists(template.key, { ns, lng: i18n.language, fallbackLng: false })) continue
      const expression = '^' + template.parts.map(escapeRegex).join('([\\s\\S]*?)') + '$'
      const match = new RegExp(expression).exec(source)
      if (match) {
        const values = Object.fromEntries(match.slice(1).map((value, index) => ['value' + index, value]))
        result = String(
          i18n.t(template.key, {
            ns,
            lng: i18n.language,
            defaultValue: source,
            ...values,
            ...(Number.isFinite(Number(match[1])) && /results?|items?|steps?|vertices|edges/.test(template.text) ? { count: Number(match[1]) } : {}),
          }),
        )
        break
      }
    }
  }
  if (cache.size > 3000) cache.clear()
  cache.set(memoKey, result)
  return result
}
/** Translate presentation values only. Objects, numbers, booleans and React nodes retain identity. */
export function tx<T>(value: T, namespace: Namespace = 'common'): T {
  return (typeof value === 'string' ? translateText(value, namespace) : value) as T
}
/** All migrated function components subscribe without remounting or suspending a running simulation. */
export function useLocaleRender() {
  const { i18n: instance } = useTranslation('common', { i18n, useSuspense: false })
  return instance.language
}
