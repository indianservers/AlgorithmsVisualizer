import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.expected-analysis-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close analysis inspector').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/expected-analysis')
  await expect(root(page)).toBeVisible()
})
test('045 all mockup panels show one coherent eight-key trace and a seeded fifty-key distribution', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    'Randomized Quicksort — Step by Step',
    'Distribution of Comparisons (Monte Carlo)',
    'Indicator Variables and Expectation',
    'Analysis Comparison',
    'Monte Carlo vs Las Vegas',
    'Run Simulation',
    'Key Takeaways',
    'Correctness',
    'Time Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.ea-array-key text')).toHaveText(['7', '2', '9', '1', '5', '8', '3', '6'])
  await expect(root(page).locator('.ea-pivot-key text')).toHaveText('5')
  await expect(root(page).locator('.ea-less-value')).toHaveText(['2', '1', '3'])
  await expect(root(page).locator('.ea-greater-value')).toHaveText(['7', '9', '8', '6'])
  await expect(root(page).locator('.ea-stats dd').first()).toHaveText('1,000')
  await expect(root(page).locator('.ea-histogram-bin')).not.toHaveCount(0)
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(6)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.ea-toolbar', { x: 275, y: 10, width: 1387, height: 33 }],
      ['.ea-hero', { x: 265, y: 49, width: 1405, height: 71 }],
      ['.mom-tabs', { x: 275, y: 121, width: 1387, height: 49 }],
      ['.ea-quick', { x: 275, y: 179, width: 884, height: 273 }],
      ['.ea-distribution', { x: 1167, y: 179, width: 495, height: 273 }],
      ['.ea-diagram-scroll', { x: 289, y: 253, width: 590, height: 185 }],
      ['.ea-steps', { x: 887, y: 253, width: 262, height: 185 }],
      ['.ea-indicator', { x: 275, y: 460, width: 681, height: 217 }],
      ['.ea-comparison', { x: 964, y: 460, width: 698, height: 217 }],
      ['.ea-guarantees', { x: 275, y: 684, width: 647, height: 164 }],
      ['.ea-simulation', { x: 930, y: 684, width: 732, height: 164 }],
      ['.ea-takeaways', { x: 275, y: 854, width: 577, height: 86 }],
      ['.ea-correctness', { x: 858, y: 854, width: 430, height: 86 }],
      ['.ea-complexity', { x: 1294, y: 854, width: 368, height: 86 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    await expect(
      page.getByRole('navigation', { name: 'Algorithm navigation', exact: true }).getByRole('link', { name: 'Home dashboard', exact: true }),
    ).toBeInViewport()
    await expect(page.locator('.sidebar-algorithm.active')).toBeInViewport()
    for (const card of await root(page).locator('.ea-guarantee-cards button').all()) {
      const cardBox = await card.boundingBox(),
        lastText = await card.locator('small').boundingBox()
      expect(lastText!.y + lastText!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height)
    }
    mkdirSync('artifacts/visual-qa/expected-analysis-045', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/expected-analysis-045/default.png' })
  }
})
test('045 diagram phases and partition inspector expose actual comparisons and sorted child results', async ({ page }) => {
  await button(page, 'Partition into < pivot and > pivot').click()
  await expect(root(page).locator('.ea-steps h3')).toContainText('Step 2')
  await button(page, 'Recursively sort subarrays').click()
  await expect(root(page).locator('.ea-less-value')).toHaveText(['1', '2', '3'])
  await expect(root(page).locator('.ea-greater-value')).toHaveText(['6', '7', '8', '9'])
  await button(page, 'Count comparisons').click()
  await expect(root(page).locator('.ea-array-key text')).toHaveText(['1', '2', '3', '5', '6', '7', '8', '9'])
  await button(page, 'Inspect key 5').focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('This partition comparisons: 7')
  await expect(root(page).getByRole('dialog')).toContainText('Sorted result: 1, 2, 3, 5, 6, 7, 8, 9')
  await close(page)
})
test('045 distinct custom arrays validate atomically and array-shape controls remain usable', async ({ page }) => {
  await root(page).getByLabel('Quicksort array type', { exact: true }).selectOption('custom')
  await root(page).getByLabel('Distinct custom keys', { exact: true }).fill('1,1,2,3,4,5,6,7')
  await button(page, 'Apply array').click()
  await expect(root(page).getByRole('alert')).toContainText('distinct')
  await expect(root(page).locator('.ea-array-key text')).toHaveText(['7', '2', '9', '1', '5', '8', '3', '6'])
  await root(page).getByLabel('Quicksort array size', { exact: true }).selectOption('4')
  await root(page).getByLabel('Distinct custom keys', { exact: true }).fill('-9999,9999,-1000,0')
  await button(page, 'Apply array').click()
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await expect(root(page).locator('.ea-array-key text')).toHaveText(['-9999', '9999', '-1000', '0'])
  expect(
    await root(page)
      .locator('.ea-array-key')
      .evaluateAll((groups) =>
        groups.every(
          (group) => (group.querySelector('text') as SVGGraphicsElement).getBBox().width <= Number(group.querySelector('rect')!.getAttribute('width')),
        ),
      ),
  ).toBe(true)
  await root(page).getByLabel('Quicksort array type', { exact: true }).selectOption('reverse')
  await expect(root(page).locator('.ea-array-key text')).toHaveText(['4', '3', '2', '1'])
})
test('045 simulation controls update deterministic statistics and reject invalid seeds without stale data', async ({ page }) => {
  const before = await root(page).locator('.ea-stats dd').allTextContents()
  await root(page).getByLabel('Simulation seed', { exact: true }).fill('-1')
  await button(page, 'Run Monte Carlo Simulation').click()
  await expect(root(page).getByRole('alert')).toContainText('Seed must')
  await expect(root(page).locator('.ea-stats dd')).toHaveText(before)
  await root(page).getByLabel('Simulation seed', { exact: true }).fill('42')
  await root(page).getByLabel('Simulation array size', { exact: true }).selectOption('2')
  await root(page).getByLabel('Simulation number of trials', { exact: true }).selectOption('100')
  await button(page, 'Run Monte Carlo Simulation').click()
  await expect(root(page).locator('.ea-stats dd')).toHaveText(['100', '1.0', '0.0', '1', '1'])
  await button(page, 'Inspect simulation statistics').click()
  await expect(root(page).getByRole('dialog')).toContainText('Theoretical expectation: 1.000000')
  await close(page)
  await button(page, 'Reset').click()
  await expect(root(page).locator('.ea-stats dd')).toHaveText(before)
  await expect(root(page).getByLabel('Simulation array size', { exact: true })).toHaveValue('50')
  await root(page).getByLabel('Histogram trials', { exact: true }).selectOption('100')
  await expect(root(page).locator('.ea-stats dd').first()).toHaveText('100')
  await root(page).getByLabel('Histogram seed', { exact: true }).selectOption('7')
  await expect(root(page).getByLabel('Simulation seed', { exact: true })).toHaveValue('7')
  await root(page).getByLabel('Simulation seed', { exact: true }).fill('')
  await expect(root(page).getByRole('status')).toContainText('Parameter changes are pending')
  await button(page, 'Run Monte Carlo Simulation').click()
  await expect(root(page).getByLabel('Simulation seed', { exact: true })).toHaveValue(/^\d+$/)
})
test('045 histogram intervals and exact expectation inspectors retain their numeric certificates', async ({ page }) => {
  await button(page, 'Inspect simulation statistics').click()
  await expect(root(page).getByRole('dialog')).toContainText('Theoretical expectation: 258.918945')
  await expect(root(page).getByRole('dialog')).toContainText('not error rates')
  await close(page)
  await root(page).locator('.ea-histogram-bin').first().focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('Empirical probability:')
  await page.keyboard.press('Escape')
  await expect(root(page).getByRole('dialog')).not.toBeVisible()
  await button(page, 'Inspect total expected comparisons').click()
  await expect(root(page).getByRole('dialog')).toContainText('2(n+1)Hₙ − 4n')
  await close(page)
})
test('045 indicator ranks are distinct from values and reject invalid rank intervals', async ({ page }) => {
  await button(page, 'Inspect indicator-variable probability').click()
  await expect(root(page).getByRole('dialog')).toContainText('2 / 8 = 0.250000')
  await root(page).getByLabel('Second sorted rank', { exact: true }).fill('2')
  await expect(root(page).getByRole('dialog')).toContainText('2 / 2 = 1.000000')
  await root(page).getByLabel('First sorted rank', { exact: true }).fill('3')
  await expect(root(page).getByRole('alert')).toContainText('1 ≤ i < j ≤ n')
  await close(page)
  await root(page).getByLabel('Quicksort array size', { exact: true }).selectOption('1')
  await expect(root(page).locator('.ea-base-case')).toContainText('zero comparisons')
  await button(page, 'Inspect indicator-variable probability').click()
  await expect(root(page).getByRole('alert')).toContainText('one-key array')
  await close(page)
})
test('045 trace playback, event navigation and animated simulation share the same algorithm', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Next event').click()
  await expect(root(page)).toContainText('Comparisons performed: 7')
  await button(page, 'Restart trace').click()
  await button(page, 'Play trace').click()
  await expect(root(page)).toContainText('Comparisons performed: 7', { timeout: 5000 })
  await button(page, 'Pause trace').click()
  const paused = await root(page).getByLabel('Trace event', { exact: true }).inputValue()
  await page.waitForTimeout(950)
  await expect(root(page).getByLabel('Trace event', { exact: true })).toHaveValue(paused)
  await button(page, 'Show current partition').click()
  await root(page).getByLabel('Simulation array size', { exact: true }).selectOption('4')
  await root(page).getByLabel('Simulation number of trials', { exact: true }).selectOption('10')
  await root(page).getByLabel('Animate one run', { exact: true }).check()
  await button(page, 'Run Monte Carlo Simulation').click()
  await expect(root(page).getByLabel('Quicksort array size', { exact: true })).toHaveValue('4')
  await expect(root(page).locator('.ea-array-key')).toHaveCount(4)
  await tab(page, 'Experiments')
  await button(page, 'Restart trace').click()
  await button(page, 'Show current partition').click()
  await button(page, 'Count comparisons').click()
  await expect(root(page).locator('.ea-array-key text')).toHaveText(['1', '2', '3', '4'])
})
test('045 theory, guarantees, code, prediction progress and notes remain interactive', async ({ page }) => {
  await button(page, 'Inspect Monte Carlo guarantee').click()
  await expect(root(page).getByRole('dialog')).toContainText('bounded probability')
  await close(page)
  await button(page, 'Inspect Las Vegas guarantee').click()
  await expect(root(page).getByRole('dialog')).toContainText('always returns a correct answer')
  await close(page)
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('fixes one input')
  await button(page, 'Explore the worked example').click()
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('comparisons: A.length - 1')
  await button(page, 'Start Practice').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Choose a prediction')
  await button(page, '1/4').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await button(page, '1/2').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await expect(root(page).locator('.ea-progress > span')).toHaveText('1 of 1 section')
  await tab(page, 'Notes')
  await root(page).getByLabel('Your randomized-analysis notes', { exact: true }).fill('The input stays fixed; pivots vary.')
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Your randomized-analysis notes', { exact: true })).toHaveValue('The input stays fixed; pivots vary.')
  await expect(root(page).locator('.ea-progress > span')).toHaveText('1 of 1 section')
})
test('045 keyboard topic search prefers the exact matching lesson', async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(root(page).getByLabel('Search algorithm topics', { exact: true })).toBeFocused()
  await root(page).getByLabel('Search algorithm topics', { exact: true }).fill('suffix array')
  await page.keyboard.press('Enter')
  await expect(page.locator('.suffix-array-page')).toBeVisible()
})
test('045 maximum simulations and long arrays use local scrolling and readable dark mode', async ({ page }, info) => {
  await root(page).getByLabel('Simulation array size', { exact: true }).selectOption('128')
  await root(page).getByLabel('Simulation number of trials', { exact: true }).selectOption('5000')
  await button(page, 'Run Monte Carlo Simulation').click()
  await expect(root(page).locator('.ea-stats dd').first()).toHaveText('5,000')
  await root(page).getByLabel('Quicksort array size', { exact: true }).selectOption('128')
  await expect(root(page).locator('.ea-array-key')).toHaveCount(128)
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const scroll = root(page).locator('.ea-diagram-scroll')
  expect(await scroll.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  await scroll.evaluate((e) => (e.scrollLeft = e.scrollWidth))
  await root(page).locator('.ea-array-key').last().focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('This partition comparisons: 127')
  await close(page)
  mkdirSync('artifacts/visual-qa/expected-analysis-045', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/expected-analysis-045/${info.project.name}-dark.png`, fullPage: true })
})
