import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.suffix-array-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close suffix array dialog').click()
async function apply(p: Page, text: string) {
  await root(p).getByLabel('Suffix array input string', { exact: true }).fill(text)
  await root(p).getByLabel('Suffix array input string', { exact: true }).press('Enter')
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/suffix-array')
  await expect(root(page)).toBeVisible()
})
test('041 banana panels reproduce suffix order, LCP and one-based inverse rank', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    'Input String',
    'All Suffixes',
    'Sorted Suffixes (Suffix Array)',
    'Step-by-Step Lexicographic Comparison',
    'LCP Array and Rank Insight',
    'Visualization: Sorted Order',
    'Correctness',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.sa-all tbody tr')).toHaveCount(6)
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['5', '3', '1', '0', '4', '2'])
  await expect(root(page).locator('.sa-lcp-scroll tr:last-child td button')).toHaveText(['0', '1', '3', '0', '0', '2'])
  await expect(root(page).locator('.sa-rank tbody td:nth-child(2)')).toHaveText(['4', '3', '6', '2', '5', '1'])
  await expect(root(page).locator('.sa-step-detail h3')).toHaveText('Step 1: Smallest suffix')
  await expect(root(page).locator('.sa-winner .sa-pill')).toHaveText('5')
  await expect(page.locator('.aimer-site-footer')).not.toBeVisible()
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.sa-input-panel', { x: 279, y: 129, width: 1375, height: 145 }],
      ['.sa-all', { x: 279, y: 286, width: 399, height: 362 }],
      ['.sa-sorted', { x: 688, y: 286, width: 453, height: 362 }],
      ['.sa-comparison', { x: 1152, y: 286, width: 502, height: 366 }],
      ['.sa-winner', { x: 1176, y: 482, width: 459, height: 46 }],
      ['.sa-lcp-panel', { x: 279, y: 663, width: 728, height: 260 }],
      ['.sa-order', { x: 1016, y: 663, width: 368, height: 260 }],
      ['.sa-order-row:first-child .sa-order-city', { x: 1140, y: 724.5, width: 28, height: 28 }],
      ['.sa-correctness', { x: 1395, y: 663, width: 259, height: 100 }],
      ['.sa-complexity', { x: 1395, y: 772, width: 259, height: 151 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    mkdirSync('artifacts/visual-qa/suffix-array-041', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/suffix-array-041/default.png' })
  }
})
test('041 suffix and LCP inspectors expose exact values and character-level comparisons', async ({ page }) => {
  await button(page, 'Inspect unsorted suffix 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('Sorted rank: 3 (one-based)')
  await close(page)
  await button(page, 'Explain LCP at order 3').click()
  await expect(root(page).getByRole('dialog')).toContainText('Shared prefix "ana" has length 3')
  await button(page, 'Inspect this character comparison').click()
  await expect(root(page).getByRole('dialog')).toContainText('Offset 0: a = a')
  await button(page, 'Compare next character').click()
  await button(page, 'Compare next character').click()
  await button(page, 'Compare next character').click()
  await expect(root(page).getByRole('dialog')).toContainText('The shorter suffix is smaller')
  await close(page)
  await button(page, 'Compare').click()
  await root(page).getByLabel('Left suffix', { exact: true }).selectOption('2')
  await root(page).getByLabel('Right suffix', { exact: true }).selectOption('2')
  await expect(root(page).getByRole('dialog')).toContainText('Final order: suffix 2 = suffix 2')
  await close(page)
})
test('041 progress dots, sorted table and diagram select the same rank', async ({ page }) => {
  await button(page, 'Compare suffix order 2').click()
  await expect(root(page).locator('.sa-step-detail h3')).toHaveText('Step 2: Next suffix')
  await expect(root(page).locator('.sa-winner .sa-pill')).toHaveText('3')
  await button(page, 'Show suffix order 4').click()
  await expect(root(page).locator('.sa-winner .sa-pill')).toHaveText('0')
  await button(page, 'View sorted order 6').click()
  await expect(root(page).locator('.sa-step-detail h3')).toHaveText('Step 6: Last suffix')
  await expect(root(page).locator('.sa-last-note')).toContainText('No larger suffix remains')
  await button(page, 'Reset').click()
  await expect(root(page).locator('.sa-winner .sa-pill')).toHaveText('5')
})
test('041 editable inputs apply atomically, preserve spaces and reject oversized strings', async ({ page }) => {
  await apply(page, 'a'.repeat(51))
  await expect(root(page).getByRole('alert')).toContainText('50 Unicode code points')
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['5', '3', '1', '0', '4', '2'])
  await apply(page, ' a ')
  await expect(root(page).locator('.sa-all tbody tr')).toHaveCount(3)
  await expect(root(page).getByLabel('Suffix array input string', { exact: true })).toHaveValue(' a ')
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['2', '0', '1'])
  await button(page, 'Use example: banana').click()
  await expect(root(page).getByLabel('Suffix array input string', { exact: true })).toHaveValue('banana')
})
test('041 construction events reveal generation and real merge work before final LCP', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Restart construction').click()
  await expect(root(page).locator('.sa-build-status')).toContainText('generated suffixes: 0/6')
  await button(page, 'Next build event').click()
  await button(page, 'Return to suffix workspace').click()
  await expect(root(page).locator('.sa-all tbody tr')).toHaveCount(1)
  await expect(root(page).locator('.sa-sorted tbody tr')).toHaveCount(0)
  await expect(root(page).locator('.sa-lcp-left')).toContainText('after sorting is complete')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Suffix build event', { exact: true }).fill('7')
  await expect(root(page).locator('.sa-build-status')).toContainText('Phase: sort')
  await button(page, 'Show completed suffix array').click()
  await root(page).getByLabel('Build speed', { exact: true }).selectOption('1400')
  await button(page, 'Return to suffix workspace').click()
  await button(page, 'Animate Build').click()
  await expect(button(page, 'Pause Build')).toBeVisible()
  await button(page, 'Pause Build').click()
  await expect(button(page, 'Resume Build')).toBeVisible()
  await tab(page, 'Experiments')
  await root(page).getByLabel('Build speed', { exact: true }).selectOption('100')
  await button(page, 'Return to suffix workspace').click()
  await button(page, 'Resume Build').click()
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['5', '3', '1', '0', '4', '2'], { timeout: 10000 })
})
test('041 prefix binary search finds the contiguous range and all overlapping starts', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Suffix prefix query', { exact: true }).fill('ana')
  await button(page, 'Search suffixes').click()
  await expect(root(page).locator('.sa-query-result')).toContainText('text indices 1, 3. Contiguous SA ranks 2–3')
  await button(page, 'Return to suffix workspace').click()
  await expect(root(page).locator('.sa-sorted .sa-query-match')).toHaveCount(2)
  await tab(page, 'Experiments')
  await root(page).getByLabel('Suffix prefix query', { exact: true }).fill('xyz')
  await button(page, 'Search suffixes').click()
  await expect(root(page).locator('.sa-query-result')).toHaveText('No suffix begins with this query.')
})
test('041 empty, singleton, repeated and Unicode inputs retain defined ranks', async ({ page }) => {
  await apply(page, '')
  await expect(root(page).locator('.sa-all tbody tr')).toHaveCount(0)
  await expect(button(page, 'Compare')).toBeDisabled()
  await expect(root(page).locator('.sa-array-banner')).toContainText('Suffix Array (SA):')
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveCount(0)
  await apply(page, 'a')
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['0'])
  await expect(root(page).locator('.sa-last-note')).toContainText('only one')
  await apply(page, '🙂\uE000a')
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['2', '1', '0'])
  await expect(root(page).locator('.sa-length-note')).toContainText('Length: 3 characters')
  await apply(page, 'aaaa')
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveText(['3', '2', '1', '0'])
  await expect(root(page).locator('.sa-lcp-scroll tr:last-child td button')).toHaveText(['0', '1', '2', '3'])
})
test('041 theory, code, prediction and persistent notes remain usable', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('ranks starting at 1')
  await expect(root(page)).toContainText('Unicode code-point order')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('mergeSort')
  await tab(page, 'Practice')
  await root(page).getByLabel('Your prediction').selectOption('1')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Your prediction').selectOption('3')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Suffix array notes', { exact: true }).fill('Shorter common-prefix suffixes come first.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Suffix array notes', { exact: true })).toHaveValue('Shorter common-prefix suffixes come first.')
})
test('041 fifty suffixes use local scrolling and remain readable in dark mode', async ({ page }, info) => {
  await apply(page, 'a'.repeat(50))
  await expect(root(page).locator('.sa-all tbody tr')).toHaveCount(50)
  await expect(root(page).locator('.sa-array-banner .sa-pill')).toHaveCount(50)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await button(page, 'Compare suffix order 50').click()
  await expect(root(page).locator('.sa-step-detail h3')).toHaveText('Step 50: Last suffix')
  await tab(page, 'Experiments')
  await button(page, 'Switch to dark theme').click()
  await button(page, 'Return to suffix workspace').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  mkdirSync('artifacts/visual-qa/suffix-array-041', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/suffix-array-041/${info.project.name}-dark.png`, fullPage: true })
})
