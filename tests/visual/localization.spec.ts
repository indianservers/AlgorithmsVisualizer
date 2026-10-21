import { test, expect, type Page } from '@playwright/test'
import { categories, categoryPages } from '../../src/data/catalog'
import { allModules } from '../../src/algorithms'
test.setTimeout(120000)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
  })
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.route('https://tools.aimersociety.com/api/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"user":null}' }),
  )
})
async function choose(page: Page, language: string) {
  await page.locator('.language-trigger').first().click({ timeout: 15000 })
  await page.locator('.language-search input').fill(language)
  await page.getByRole('option').filter({ hasText: language }).first().click()
  await expect(page.locator('.language-popover')).toHaveCount(0, { timeout: 20000 })
}
test('English India is the source default and language changes preserve route, input, timeline and code', async ({ page }) => {
  await page.goto('/sorting/bubble-sort')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-IN')
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('79, 2, 31')
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Step forward', exact: true }).click()
  const read = async () => ({
    url: page.url(),
    input: await page.locator('.studio-input textarea').first().inputValue(),
    values: await page.locator('.studio-column').evaluateAll((items) => items.map((el) => el.getAttribute('data-value'))),
    timeline: await page.locator('input[type=range]').first().inputValue(),
    code: await page.locator('.studio-source').textContent(),
  })
  const before = await read()
  await choose(page, 'Telugu')
  await expect(page.locator('html')).toHaveAttribute('lang', 'te')
  await expect(page.locator('.lesson-tabs')).toContainText('దృశ్యీకరణ')
  await expect(page.locator('.workbench-play')).not.toHaveText('Run sort')
  expect(await read()).toEqual(before)
  await choose(page, 'Russian')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  await expect(page.locator('.lesson-tabs')).toContainText('Визуализация')
  expect(await read()).toEqual(before)
  await choose(page, 'Hindi')
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
  await expect(page.locator('.lesson-tabs')).toContainText('दृश्यांकन')
  expect(await read()).toEqual(before)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
  await choose(page, 'English (India)')
  await expect(page.locator('.lesson-tabs')).toContainText('Visualization')
  await expect(page.getByRole('button', { name: 'Run sort', exact: true })).toBeVisible()
})
test('all registered locales use static assets; English has no translation fetch and invalid saved codes are reset', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/locales/')) requests.push(request.url())
  })
  await page.goto('/sorting/selection-sort')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-IN')
  expect(requests).toEqual([])
  await choose(page, 'Russian')
  expect(requests.length).toBeGreaterThan(0)
  expect(requests.every((url) => url.startsWith(new URL(page.url()).origin + '/locales/'))).toBe(true)
  const englishHeading = await page.locator('h1').first().textContent()
  expect(englishHeading).toContain('Selection Sort') // Controlled technical terminology.
  await page.evaluate(() => localStorage.setItem('algodrishti-language', 'unsupported-old-code'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-IN')
  await choose(page, 'Telugu')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-IN')
})
test('selector is searchable, keyboard accessible and applies RTL without reversing plots', async ({ page }) => {
  await page.goto('/sorting/selection-sort')
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('42, 18, 67, 9')
  const x = async () =>
    page
      .locator('.studio-column')
      .evaluateAll((items) => items.map((el) => Math.round(el.getBoundingClientRect().x - el.closest('.studio-chart')!.getBoundingClientRect().x)))
  const positions = await x()
  await page.locator('.language-trigger').click()
  await page.locator('.language-search input').fill('Arabic')
  await page.locator('.language-search input').press('Enter')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('.studio-chart')).toHaveCSS('direction', 'ltr')
  await expect(page.locator('input[type=range]').first()).toHaveCSS('direction', 'ltr')
  expect(await x()).toEqual(positions)
  for (const locale of ['Urdu', 'German', 'Russian']) {
    await choose(page, locale)
    await page.setViewportSize({ width: 390, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), locale).toBe(true)
  }
  await page.locator('.language-trigger').click()
  await page.locator('.language-search input').press('Escape')
  await expect(page.locator('.language-popover')).toHaveCount(0)
  await expect(page.locator('.language-trigger')).toBeFocused()
  await page.screenshot({ path: `artifacts/localization-russian-${test.info().project.name}.png`, fullPage: true })
})
test('representative routes from every category have exactly one working selector and preserve the same page', async ({ page }) => {
  test.setTimeout(240000)
  for (const category of categories) {
    const module = allModules.find((m) => m.category === category)!
    const path = '/' + categoryPages[category].slug + '/' + module.id
    await page.goto(path)
    await expect(page.locator('.language-trigger').first(), category).toBeVisible()
    expect(await page.locator('.language-trigger').count(), category).toBe(1)
    await choose(page, 'English (India)')
    await choose(page, 'Telugu')
    expect(new URL(page.url()).pathname, category).toBe(path)
    await expect(page.locator('html')).toHaveAttribute('lang', 'te')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), category).toBe(true)
  }
})
test('native account dialogs and legacy code stay usable after switching language', async ({ page }) => {
  await page.goto('/sorting/selection-sort')
  await choose(page, 'Russian')
  await page.locator('#account-trigger').click()
  await expect(page.locator('#account-dialog')).toBeVisible()
  await expect(page.locator('#account-title')).toContainText('Добро пожаловать')
  await page.locator('#account-close').click()
  await expect(page.locator('#account-dialog')).not.toBeVisible()
  await choose(page, 'English (India)')
  await page.locator('#account-trigger').click()
  await expect(page.locator('#account-title')).toHaveText('Welcome to AIMER Society')
})

test('standalone Strings header and inputs fit a fresh phone visit in multiple languages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/strings/string-pattern-matching-suite')
  const input = page.locator('.ss-fields textarea').first()
  await input.fill('ABABACABABABC')
  for (const language of ['Telugu', 'Russian', 'Arabic', 'English (India)']) {
    await choose(page, language)
    expect(await input.inputValue()).toBe('ABABACABABABC')
    const result = await page.locator('.ss-result').boundingBox(),
      legend = await page.locator('.ss-legend').boundingBox()
    expect(legend!.y).toBeGreaterThanOrEqual(result!.y + result!.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), language).toBe(true)
  }
})
