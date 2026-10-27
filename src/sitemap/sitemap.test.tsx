import { describe, expect, it } from 'vitest'
import { allModules } from '../algorithms'
import { sitemapCatalog, sitemapGroups } from './catalog'
import { buildSitemapAssets } from './prerender'
import { sitemapLocaleFromPath, sitemapLocales, sitemapPath } from './routes'

const resourceFiles = import.meta.glob<Record<string, string>>('../i18n/locales/*/*.json', { eager: true, import: 'default' })

describe('crawlable multilingual sitemap', () => {
  it('covers the complete live catalog once with original descriptions and both destinations', () => {
    const lessons = sitemapGroups.flatMap((group) => group.lessons)
    expect(lessons).toHaveLength(allModules.length)
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(allModules.length)
    for (const lesson of lessons) {
      expect(lesson.description).toBe(allModules.find((module) => module.id === lesson.id)!.summary)
      expect(lesson.theoryPath).toBe(lesson.path + '/learn')
      expect(lesson.path).not.toContain('#')
    }
    const catalog = sitemapCatalog('te', (source) => source)
    expect(catalog.interfaceLanguages).toHaveLength(41)
    expect(catalog.categories[0].lessons[0].description.language).toBe('en-IN')
  })
  it('creates 41 translated, self-canonical directories with reciprocal language links and no English description fallbacks', async () => {
    const resources = Object.fromEntries(
      sitemapLocales.map((locale) => [
        locale,
        Object.assign(
          {},
          ...Object.entries(resourceFiles)
            .filter(([path]) => path.startsWith(`../i18n/locales/${locale}/`) && /\/(common|navigation|algorithms|messages)\.json$/.test(path))
            .map(([, values]) => values),
        ),
      ]),
    )
    const assets = buildSitemapAssets(resources)
    expect(assets.pages).toHaveLength(41)
    expect(assets.home.match(/class="site-map-topic"/g)).toHaveLength(allModules.length)
    for (const locale of sitemapLocales) {
      const page = assets.pages.find((item) => item.locale === locale)!
      expect(page.head).toContain(`rel="canonical" href="https://algorithms.aimersociety.com${sitemapPath(locale)}"`)
      for (const other of sitemapLocales) expect(page.head).toContain(`hreflang="${other}"`)
      expect(page.head).toContain('hreflang="x-default"')
      const catalog = JSON.parse(assets.files.find((file) => file.path === `/sitemaps/${locale}.json`)!.text)
      expect(catalog.categories.flatMap((group: { lessons: unknown[] }) => group.lessons)).toHaveLength(allModules.length)
      if (locale !== 'en-IN') {
        expect(catalog.description.language).toBe(locale)
        for (const group of catalog.categories) {
          expect(group.description.language).toBe(locale)
          for (const lesson of group.lessons) expect(lesson.description.language).toBe(locale)
        }
      }
    }
    expect(assets.pages.find((page) => page.locale === 'te')!.body).toContain('సైట్‌మ్యాప్')
    expect(assets.pages.find((page) => page.locale === 'ar')!.body).toContain('dir="rtl"')
    expect(assets.files.find((file) => file.path === '/llms.txt')!.text).toContain('/sorting/selection-sort/learn')
  }, 15000)
  it('only advertises real localized directory URLs', () => {
    expect(sitemapLocaleFromPath('/sitemap')).toBe('en-IN')
    expect(sitemapLocaleFromPath('/sitemap/te')).toBe('te')
    expect(sitemapLocaleFromPath('/sitemap/not-a-language')).toBeUndefined()
    expect(sitemapLocaleFromPath('/sorting/selection-sort')).toBeUndefined()
  })
  it('blocks publication when a non-English directory would fall back to English', () => {
    expect(() => buildSitemapAssets({})).toThrow('Missing sitemap translation [hi]')
  })
})
