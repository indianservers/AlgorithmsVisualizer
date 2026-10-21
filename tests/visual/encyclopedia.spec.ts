import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { learnPath } from '../../src/utils/routing'

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.route('https://tools.aimersociety.com/api/session', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) }),
  )
})

test('all encyclopedia articles have readable theory and fit mobile and desktop', async ({ page }) => {
  test.setTimeout(240000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
  const widths = test.info().project.name === 'mobile' ? [390] : [1440]
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 })
    for (const module of allModules) {
      await page.goto(learnPath(module), { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('button', { name: 'Bookmark article', exact: true })).toBeVisible()
      const article = page.getByRole('article', { name: `${module.name} encyclopedia` })
      await expect(article, module.id).toBeVisible()
      await expect(article.getByRole('heading', { level: 1 })).toHaveText(module.name)
      await expect(article.locator('#purpose')).toContainText(/./)
      await expect(article.locator('#worked-example')).toContainText(/./)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), module.id).toBe(true)
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://algorithms.aimersociety.com' + learnPath(module))
    }
  }
  expect(errors).toEqual([])
})

test('legacy links, Learn navigation, section bookmarks, saved articles and visualization remain connected', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
  await page.goto('/#/sorting/selection-sort')
  await expect(page).toHaveURL(/\/sorting\/selection-sort$/)
  await expect(page.getByRole('button', { name: 'Visualization', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await expect(page).toHaveURL(/\/sorting\/selection-sort\/learn$/)
  await expect(page.getByRole('article')).toContainText('n(n − 1)/2')
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Time and space complexity', exact: true }).click()
  await expect(page).toHaveURL(/\/learn#complexity$/)
  await page.reload()
  await expect(page.locator('#complexity')).toBeInViewport()
  await page.getByRole('button', { name: 'Bookmark article', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Bookmarked', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveTitle(/Selection Sort.*Explanation/)
  const schemas = await page.locator('#page-schema').textContent()
  expect(JSON.parse(schemas!)['@graph'][0]['@type']).toBe('TechArticle')
  await page.getByRole('button', { name: 'Edit input', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Dataset', exact: true })).toBeFocused()
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('3, 1, 2')
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  expect(await page.locator('.studio-column').evaluateAll((items) => items.map((x) => x.getAttribute('data-value')))).toEqual(['1', '2', '3'])
})

test('theory directory supports finding and opening a topic', async ({ page }) => {
  await page.goto('/encyclopedia')
  await page.getByRole('searchbox').fill('selection sort')
  await page.getByRole('link', { name: /Selection Sort Selects/ }).click()
  await expect(page).toHaveURL(/\/sorting\/selection-sort\/learn$/)
  await page.screenshot({ path: `artifacts/encyclopedia-selection-${test.info().project.name}.png`, fullPage: true })
})

test('initial HTML contains the full article and SEO signals without running JavaScript', async ({ request }) => {
  // Vite preview serves generated .html paths; Vercel cleanUrls exposes the extensionless version.
  const response = await request.get('/sorting/selection-sort/learn.html')
  expect(response.ok()).toBe(true)
  const html = await response.text()
  expect(html).toContain('Selection sort is an in-place comparison sorting algorithm')
  expect(html).toContain('id="complexity"')
  expect(html).toContain('rel="canonical" href="https://algorithms.aimersociety.com/sorting/selection-sort/learn"')
  expect(html).toContain('application/ld+json')
  const sitemap = await request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain('/sorting/selection-sort/learn</loc>')
  const robots = await request.get('/robots.txt')
  expect(await robots.text()).toContain('Sitemap: https://algorithms.aimersociety.com/sitemap.xml')
})
