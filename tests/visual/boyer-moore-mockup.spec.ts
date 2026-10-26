import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.boyer-moore-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close Boyer–Moore dialog').click()
async function apply(p: Page, text: string, pattern: string) {
  await root(p).getByLabel('Search text', { exact: true }).fill(text)
  await root(p).getByLabel('Search pattern', { exact: true }).fill(pattern)
  await button(p, 'Step').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/boyer-moore')
  await expect(root(page)).toBeVisible()
})
test('040 reference panels show a real mismatch with synchronized text, pattern and shift', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of [
    'Interactive Visualization',
    'How it works',
    'Bad-character rule (key idea)',
    'Bad-character table (rightmost occurrence)',
    'Current alignment state',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.bm-text-cell')).toHaveCount(24)
  await expect(root(page).locator('.bm-pattern-cell')).toHaveCount(7)
  await expect(root(page).locator('.bm-state dd')).toHaveText(['11', 'I', '2', 'A', 'rightmost(I) = -1', '3', '12'])
  await expect(root(page).locator('.bm-text-cell.bm-bad .bm-letter')).toHaveText('I')
  await expect(root(page).locator('.bm-pattern-cell.bm-bad .bm-letter')).toHaveText('A')
  await expect(root(page).locator('.bm-pattern-cell.bm-matched')).toHaveCount(4)
  await expect(root(page).locator('.bm-inputs small')).toHaveText(['24/50', '7/50'])
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.bm-visualization', { x: 281, y: 138, width: 889, height: 514 }],
      ['.bm-inputs', { x: 295, y: 215, width: 861, height: 100 }],
      ['.bm-how', { x: 1183, y: 138, width: 389, height: 326 }],
      ['.bm-insight', { x: 1183, y: 477, width: 389, height: 174 }],
      ['.bm-table-panel', { x: 281, y: 663, width: 522, height: 265 }],
      ['.bm-state', { x: 815, y: 663, width: 368, height: 265 }],
      ['.bm-complexity', { x: 1195, y: 663, width: 377, height: 265 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    mkdirSync('artifacts/visual-qa/boyer-moore-040', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/boyer-moore-040/default.png' })
  }
})
test('040 manual stepping distinguishes compare, shift and the next actual alignment', async ({ page }) => {
  await button(page, 'Reset').click()
  await expect(root(page).locator('.bm-callout-title')).toHaveText('Compare from right to left')
  await button(page, 'Step').click()
  await expect(root(page).locator('.bm-state dd')).toHaveText(['6', 'S', '6', 'E', 'rightmost(S) = -1', '7', '7'])
  await button(page, 'Step').click()
  await expect(root(page).locator('.bm-state dd').first()).toHaveText('6')
  await button(page, 'Step').click()
  await expect(root(page).locator('.bm-state dd').first()).toHaveText('13')
  await button(page, 'Explain current comparison and shift').click()
  await expect(root(page).getByRole('dialog')).toContainText('Continue comparing')
  await close(page)
})
test('040 editable text applies atomically, validates limits and preserves spaces', async ({ page }) => {
  await root(page).getByLabel('Search text', { exact: true }).fill('A'.repeat(51))
  await button(page, 'Step').click()
  await expect(root(page).getByRole('alert')).toContainText('50 characters')
  await expect(root(page).locator('.bm-text-cell')).toHaveCount(24)
  await apply(page, ' A ', ' ')
  await expect(root(page).locator('.bm-text-cell')).toHaveCount(3)
  await tab(page, 'Experiments')
  await expect(root(page).locator('.bm-match-summary')).toContainText('0, 2')
  await button(page, 'Return to search diagram').click()
  await button(page, 'Swap text and pattern').click()
  await expect(root(page).getByLabel('Search text', { exact: true })).toHaveValue(' ')
  await expect(root(page).getByLabel('Search pattern', { exact: true })).toHaveValue(' A ')
  await button(page, 'Step').click()
  await expect(root(page).locator('.bm-callout-title')).toHaveText('No matches found')
})
test('040 table and character inspectors explain repeated and missing characters', async ({ page }) => {
  await button(page, 'Inspect rightmost E').click()
  await expect(root(page).getByRole('dialog')).toContainText('Pattern positions: 0, 6. Rightmost index: 6.')
  await close(page)
  await button(page, 'Inspect missing-character lookup').click()
  await expect(root(page).getByRole('dialog')).toContainText('Rightmost index: -1')
  await close(page)
  await root(page).locator('.bm-text-cell').nth(4).focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('Character: Space. Unicode: U+20.')
  await close(page)
  await button(page, 'Explain shift amount').click()
  await expect(root(page).getByRole('dialog')).toContainText('max(1, 2 − (-1)) = 3')
  await close(page)
  await root(page).getByLabel('Boyer–Moore example').selectOption('repeated')
  await button(page, 'Reset').click()
  await button(page, 'Inspect missing-character lookup').click()
  await expect(root(page).getByRole('dialog')).toContainText('Pattern positions: none. Rightmost index: -1.')
  await close(page)
})
test('040 toggles preserve the trace and overlapping and Unicode matches are complete', async ({ page }) => {
  await root(page).getByLabel('Show indices', { exact: true }).uncheck()
  await expect(root(page).locator('.bm-index')).toHaveCount(0)
  await root(page).getByLabel('Highlight mismatch', { exact: true }).uncheck()
  await expect(root(page).locator('.bm-bad')).toHaveCount(0)
  await expect(root(page).locator('.bm-state dd').first()).toHaveText('11')
  await root(page).getByLabel('Boyer–Moore example').selectOption('overlap')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.bm-match-summary')).toContainText('0, 2, 4, 6')
  await button(page, 'Return to search diagram').click()
  await root(page).getByLabel('Boyer–Moore example').selectOption('unicode')
  await expect(root(page).locator('.bm-inputs small')).toHaveText(['5/50', '3/50'])
  await tab(page, 'Experiments')
  await expect(root(page).locator('.bm-match-summary')).toContainText('0, 2')
})
test('040 empty patterns and longer patterns produce explicit finite results', async ({ page }) => {
  await apply(page, 'ABC', '')
  await expect(root(page).locator('.bm-callout-title')).toContainText('Empty pattern')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.bm-match-summary')).toContainText('0, 1, 2, 3')
  await expect(root(page)).toContainText('total comparisons 0')
  await button(page, 'Return to search diagram').click()
  await apply(page, '', 'ABC')
  await expect(root(page).locator('.bm-empty-label')).toHaveText('Empty text')
  await expect(root(page).locator('.bm-callout-title')).toHaveText('No matches found')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.bm-match-summary')).toContainText('none')
})
test('040 playback, history and event slider rewind every visible state', async ({ page }) => {
  await root(page).getByLabel('Playback speed', { exact: true }).selectOption('100')
  await button(page, 'Start').click()
  await expect(root(page).locator('.bm-callout-title')).toHaveText('Search complete', { timeout: 10000 })
  await expect(root(page).locator('.bm-example-result')).toContainText('Matches: 17')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Search trace event', { exact: true }).fill('1')
  await button(page, 'Return to search diagram').click()
  await expect(root(page).locator('.bm-state dd').first()).toHaveText('6')
  await tab(page, 'Experiments')
  await button(page, 'Show worked mismatch').click()
  await expect(root(page)).toContainText('Current event: mismatch; alignment 9')
  await root(page).locator('.bm-history-scroll tbody button').last().click()
  await button(page, 'Return to search diagram').click()
  await expect(root(page).locator('.bm-callout-title')).toHaveText('Match at alignment 17')
})
test('040 theory, code, prediction and saved notes remain usable', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('The full text has 24 characters')
  await expect(root(page)).toContainText('code points')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('Math.max(1, j - (last.get(T[s + j]) ?? -1))')
  await tab(page, 'Practice')
  await root(page).getByLabel('Your prediction').selectOption('4')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Your prediction').selectOption('2')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Boyer–Moore notes', { exact: true }).fill('A mismatch is unequal; equal characters extend the suffix.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Boyer–Moore notes', { exact: true })).toHaveValue('A mismatch is unequal; equal characters extend the suffix.')
})
test('040 fifty-character traces stay local to their scroll area and dark mode is readable', async ({ page }, info) => {
  await apply(page, 'A'.repeat(50), 'A'.repeat(25))
  await expect(root(page).locator('.bm-text-cell')).toHaveCount(50)
  await expect(root(page).locator('.bm-pattern-cell')).toHaveCount(25)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await tab(page, 'Experiments')
  await button(page, 'Jump to search result').click()
  await expect(root(page).locator('.bm-match-summary')).toContainText('24, 25')
  await button(page, 'Switch to dark theme').click()
  await button(page, 'Return to search diagram').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(
    await root(page)
      .locator('.bm-diagram-scroll')
      .evaluate((e) => e.scrollLeft),
  ).toBeGreaterThan(0)
  if (info.project.name === 'desktop') {
    const viewport = await root(page).locator('.bm-diagram-scroll').boundingBox(),
      first = await root(page).locator('.bm-pattern-cell rect').first().boundingBox(),
      last = await root(page).locator('.bm-pattern-cell rect').last().boundingBox()
    expect(first!.x).toBeGreaterThanOrEqual(viewport!.x)
    expect(last!.x + last!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width + 1)
  }
  mkdirSync('artifacts/visual-qa/boyer-moore-040', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/boyer-moore-040/${info.project.name}-dark.png`, fullPage: true })
})
