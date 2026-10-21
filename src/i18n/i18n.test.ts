import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from './config'
import { sourceKey } from './keys'
import { languages, validLocale, storedLocale, localeStorageKey } from './languages'
import { tx, translateText } from './render'
import { applyDocumentLanguage, changeLocale, loadResources, templates } from './loader'

afterEach(async () => {
  await i18n.changeLanguage('en-IN')
  vi.unstubAllGlobals()
})
describe('localization contracts', () => {
  it('registers exactly the requested locales and never detects browser language', () => {
    expect(languages).toHaveLength(41)
    expect(languages[0].code).toBe('en-IN')
    expect(
      languages
        .filter((l) => l.direction === 'rtl')
        .map((l) => l.code)
        .sort(),
    ).toEqual(['ar', 'ur'])
    expect(validLocale('ru')).toBe('ru')
    expect(validLocale('ru-RU')).toBe('en-IN')
    expect(validLocale('zz')).toBe('en-IN')
  })
  it('retains exact source English, whitespace, values and object identity', () => {
    const source = '  Run sort → 79 / O(n log n)  '
    expect(tx(source)).toBe(source)
    const input = [79, 18, -3]
    expect(tx(input)).toBe(input)
    expect(tx(0)).toBe(0)
    expect(tx(false)).toBe(false)
  })
  it('uses source English for missing keys without exposing hashes', async () => {
    await i18n.changeLanguage('hi')
    expect(tx('A deliberately unreviewed technical explanation.')).toBe('A deliberately unreviewed technical explanation.')
    expect(tx('O(n log n)')).toBe('O(n log n)')
    expect(tx('return')).toBe('return')
  })
  it('looks up metadata text across namespaces without mutating the metadata', async () => {
    i18n.addResourceBundle('te', 'navigation', { [sourceKey('Sorting')]: 'క్రమబద్ధీకరణ' }, true, true)
    await i18n.changeLanguage('te')
    const module = { category: 'Sorting', data: [79] }
    expect(translateText(module.category, 'studios')).toBe('క్రమబద్ధీకరణ')
    expect(module.category).toBe('Sorting')
  })
  it('resets invalid persisted choices without examining navigator', () => {
    const store = new Map([[localeStorageKey, 'invalid-old-language']])
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key), setItem: (key: string, value: string) => store.set(key, value) })
    expect(storedLocale()).toBe('en-IN')
    expect(store.get(localeStorageKey)).toBe('en-IN')
  })
  it('uses local JSON assets, caches namespaces, and preserves interpolated values', async () => {
    const source = 'Step {{value0}} of {{value1}}'
    const fetcher = vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.endsWith('templates.json')
          ? [{ text: source, namespace: 'common', key: sourceKey(source), parts: ['Step ', ' of ', ''] }]
          : url.endsWith('/common.json')
            ? { [sourceKey(source)]: 'Étape {{value0}} sur {{value1}}' }
            : {},
    }))
    vi.stubGlobal('fetch', fetcher)
    await loadResources('fr', ['common', 'controls'])
    const calls = fetcher.mock.calls.length
    await loadResources('fr', ['common', 'controls'])
    expect(fetcher.mock.calls.length).toBe(calls)
    await i18n.changeLanguage('fr')
    expect(tx('Step 79 of 120')).toBe('Étape 79 sur 120')
    expect(fetcher.mock.calls.every(([url]) => url.startsWith('/locales/'))).toBe(true)
  })
  it('selects Russian plural forms while preserving the interpolated count', async () => {
    const source = '{{value0}} items',
      key = sourceKey(source)
    templates.push({ text: source, namespace: 'common', key, parts: ['', ' items'] })
    i18n.addResourceBundle(
      'ru',
      'common',
      {
        [key]: '{{value0}} элементов',
        [key + '_one']: '{{value0}} элемент',
        [key + '_few']: '{{value0}} элемента',
        [key + '_many']: '{{value0}} элементов',
        [key + '_other']: '{{value0}} элемента',
      },
      true,
      true,
    )
    await i18n.changeLanguage('ru')
    expect(tx('1 items')).toBe('1 элемент')
    expect(tx('2 items')).toBe('2 элемента')
    expect(tx('5 items')).toBe('5 элементов')
  })
  it('sets RTL document direction while invalid languages return to English', async () => {
    const element = { lang: '', dir: '', dataset: { locale: '' } }
    vi.stubGlobal('document', { documentElement: element })
    applyDocumentLanguage('ar')
    expect(element.dir).toBe('rtl')
    expect(element.lang).toBe('ar')
    await changeLocale('invalid', '/', false)
    expect(element.dir).toBe('ltr')
    expect(element.lang).toBe('en-IN')
  })
})
