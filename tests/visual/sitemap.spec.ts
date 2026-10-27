import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { readFileSync } from 'node:fs'

const sitemapLocales = (JSON.parse(readFileSync(new URL('../../src/i18n/languages.json', import.meta.url), 'utf8')) as string[][]).map(([code]) => code)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.route('https://tools.aimersociety.com/api/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"user":null}' }),
  )
})
test('home footer is compact, complete, multilingual and usable on a phone', async ({ page }) => {
  await page.goto('/')
  const map = page.locator('.site-map-compact')
  await map.scrollIntoViewIfNeeded()
  await map.screenshot({ path: test.info().outputPath('home-sitemap.png') })
  expect(await map.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(12)
  await expect(map.locator('.site-map-topic')).toHaveCount(allModules.length)
  await map
    .locator('summary')
    .filter({ hasText: /^Sorting/ })
    .click()
  await expect(map.getByRole('link', { name: 'Selection Sort', exact: true })).toHaveAttribute('href', '/sorting/selection-sort')
  await expect(map).toContainText('Selects the minimum remaining value and moves it into place.')
  await page.locator('.language-trigger').click()
  await page.locator('.language-search input').fill('Telugu')
  await page.getByRole('option').filter({ hasText: 'Telugu' }).click()
  await expect(map).toContainText('సైట్‌మ్యాప్ మరియు అంశాల సూచిక')
  await expect(
    map
      .locator('li')
      .filter({ has: page.locator('a[href="/sorting/selection-sort"]') })
      .locator('p'),
  ).toHaveAttribute('lang', 'te')
  await expect(map).not.toContainText('Selects the minimum remaining value and moves it into place.')
  await page.setViewportSize({ width: 320, height: 850 })
  await map.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
test('localized directories are readable and descriptive without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 850 } })
  const page = await context.newPage()
  for (const locale of sitemapLocales) {
    await page.goto(locale === 'en-IN' ? `${baseURL}/sitemap.html` : `${baseURL}/sitemap/${locale}.html`)
    await expect(page.locator('h1')).not.toBeEmpty()
    if (locale !== 'en-IN') await expect(page.locator('h1')).not.toHaveText('Sitemap and topic directory')
    if (locale === 'ar') await page.screenshot({ path: test.info().outputPath('sitemap-arabic.png') })
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.locator('.site-map-topic')).toHaveCount(allModules.length)
    await expect(page.locator('script[type="module"]')).toHaveCount(0)
    await expect(page.locator('link[hreflang]')).toHaveCount(42)
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' || locale === 'ur' ? 'rtl' : 'ltr')
    const schema = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')
    expect(schema.mainEntity.numberOfItems).toBe(allModules.length)
    for (const entry of schema.mainEntity.itemListElement) {
      expect(entry.item.inLanguage).toBe('en-IN')
      if (locale !== 'en-IN') expect(allModules.some((module) => module.summary === entry.item.description)).toBe(false)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await context.close()
})
test('search and agent catalogs contain descriptions, canonical URLs and real language variants', async ({ request, page }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(await page.evaluate((source) => new DOMParser().parseFromString(source, 'application/xml').getElementsByTagName('parsererror').length, xml)).toBe(0)
  expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
  expect(xml).toContain('hreflang="te"')
  expect(xml).toContain('/sorting/selection-sort/learn</loc>')
  const english = await (await request.get('/sitemap.json')).json()
  const telugu = await (await request.get('/sitemaps/te.json')).json()
  expect(telugu.language).toBe('te')
  expect(telugu.categories.flatMap((category: { lessons: unknown[] }) => category.lessons)).toHaveLength(allModules.length)
  expect(telugu.description.language).toBe('te')
  const selection = english.categories
    .flatMap((category: { lessons: { id: string }[] }) => category.lessons)
    .find((lesson: { id: string }) => lesson.id === 'selection-sort')
  expect(selection.description.text).toContain('minimum')
  expect(selection.theoryUrl).toBe('https://algorithms.aimersociety.com/sorting/selection-sort/learn')
  const guide = await (await request.get('/llms.txt')).text()
  expect(guide).toContain('/sitemap/te')
  expect(guide).toContain('/sorting/selection-sort/learn')
  const home = await (await request.get('/')).text()
  expect(home).toContain('id="topic-map"')
  expect(home).toContain('href="/sorting/selection-sort/learn"')
})
