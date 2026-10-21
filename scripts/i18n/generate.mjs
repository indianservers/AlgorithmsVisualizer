import { readFile, writeFile, mkdir, cp } from 'node:fs/promises'
import { audit, key } from './audit.mjs'
const locales = JSON.parse(await readFile('src/i18n/languages.json', 'utf8'))
const seeds = JSON.parse(await readFile('src/i18n/seed-translations.json', 'utf8'))
const { dictionaries } = await audit()
const normalize = (value) => value.trim().toLowerCase().replace(/[:.]$/, '')
for (const [locale] of locales) {
  await mkdir(`src/i18n/locales/${locale}`, { recursive: true })
  if (locale !== 'en-IN')
    for (const [ns, source] of Object.entries(dictionaries)) {
      const lookup = new Map(Object.entries(seeds[locale] ?? {}).map(([english, value]) => [normalize(english), value]))
      // Existing reviewed/manual entries take precedence over newly generated seed coverage.
      let previous = {}
      try {
        previous = JSON.parse(await readFile(`src/i18n/locales/${locale}/${ns}.json`, 'utf8'))
      } catch {}
      const translated = {}
      for (const [id, english] of Object.entries(source)) {
        const candidate = previous[id] ?? lookup.get(normalize(english))
        if (candidate && candidate !== english) {
          const leading = english.match(/^\s*/)[0],
            trailing = english.match(/\s*$/)[0]
          translated[id] = leading + candidate.trim() + trailing
        }
      }
      for (const [id, english] of Object.entries(source))
        if (english === '{{value0}} items' && translated[id]) {
          const forms = {
            hi: { one: '{{value0}} तत्व', other: '{{value0}} तत्व' },
            te: { one: '{{value0}} అంశం', other: '{{value0}} అంశాలు' },
            ru: { one: '{{value0}} элемент', few: '{{value0}} элемента', many: '{{value0}} элементов', other: '{{value0}} элемента' },
            de: { one: '{{value0}} Element', other: '{{value0}} Elemente' },
          }[locale]
          for (const [form, value] of Object.entries(forms ?? {})) translated[id + '_' + form] = value
        }
      await writeFile(`src/i18n/locales/${locale}/${ns}.json`, JSON.stringify(translated, null, 2) + '\n')
    }
}
await cp('src/i18n/locales', 'public/locales', { recursive: true })
console.log('Generated static dictionaries for', locales.length, 'locales. Fallback-only entries remain absent from target resources.')
