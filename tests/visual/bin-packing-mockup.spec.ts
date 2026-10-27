import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.bin-packing-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close packing inspector').click()
async function apply(p: Page, cap: string, items: string) {
  await root(p).getByLabel('Bin capacity', { exact: true }).fill(cap)
  await root(p).getByLabel('Packing item sizes', { exact: true }).fill(items)
  await button(p, 'Auto Pack').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/bin-packing')
  await expect(root(page)).toBeVisible()
})
test('044 all mockup panels use a feasible default packing with six bins and twelve distinct items', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    'Input & Controls',
    'Items (sorted decreasing)',
    'Bins (First Fit Decreasing in action)',
    'Result Summary',
    'Step-by-Step Placement Timeline',
    'Correctness',
    'Heuristic Insight',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.bp-item-row')).toHaveCount(12)
  await expect(root(page).locator('.bp-bin-used')).toHaveCount(6)
  await expect(root(page).locator('.bp-packed-item')).toHaveCount(12)
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('6')
  await expect(root(page).locator('.bp-stat-items small')).toHaveText('All items packed!')
  await expect(root(page).locator('.bp-bin-title > span')).toHaveText(['(10 / 10)', '(10 / 10)', '(10 / 10)', '(10 / 10)', '(9 / 10)', '(5 / 10)'])
  await expect(root(page).locator('.bp-utilization small')).toHaveText(['100%', '100%', '100%', '100%', '90%', '50%'])
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(6)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.bp-toolbar', { x: 282, y: 11, width: 1376, height: 37 }],
      ['.bp-hero', { x: 269, y: 56, width: 1403, height: 76 }],
      ['.mom-tabs', { x: 280, y: 132, width: 1378, height: 52 }],
      ['.bp-input', { x: 280, y: 197, width: 270, height: 385 }],
      ['.bp-items', { x: 562, y: 197, width: 249, height: 385 }],
      ['.bp-bins', { x: 823, y: 197, width: 543, height: 385 }],
      ['.bp-summary', { x: 1378, y: 197, width: 280, height: 385 }],
      ['.bp-timeline', { x: 280, y: 595, width: 1378, height: 220 }],
      ['.bp-correctness', { x: 280, y: 828, width: 448, height: 100 }],
      ['.bp-insight', { x: 739, y: 828, width: 435, height: 100 }],
      ['.bp-complexity', { x: 1185, y: 828, width: 473, height: 100 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    await expect(
      page.getByRole('navigation', { name: 'Algorithm navigation', exact: true }).getByRole('link', { name: 'Home dashboard', exact: true }),
    ).toBeInViewport()
    await expect(page.locator('.sidebar-algorithm.active')).toBeInViewport()
    const firstBin = await root(page).locator('.bp-bin').first().boundingBox()
    expect(Math.abs(firstBin!.y - 283)).toBeLessThanOrEqual(2)
    mkdirSync('artifacts/visual-qa/bin-packing-044', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/bin-packing-044/default.png' })
  }
})
test('044 editable inputs validate atomically and duplicate items retain original identities', async ({ page }) => {
  await apply(page, '10', '4,4,2')
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('1')
  await button(page, 'Inspect sorted item 2').click()
  await expect(root(page).getByRole('dialog')).toContainText('Original item identity: 2')
  await close(page)
  for (const [cap, items, message] of [
    ['0', '4', 'integer from 1 to 100'],
    ['10', '11', 'bin capacity'],
    ['10', '1.5', 'integer'],
    ['10', Array(25).fill(1).join(','), '24'],
  ]) {
    await apply(page, cap, items)
    await expect(root(page).getByRole('alert')).toContainText(message)
    await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('1')
  }
  await button(page, 'Reset').click()
  await expect(root(page).getByLabel('Packing item sizes', { exact: true })).toHaveValue('4, 4, 2')
  await expect(root(page).getByLabel('Bin capacity', { exact: true })).toHaveValue('10')
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('0')
})
test('044 timeline placements synchronize bins and summary through all twelve items', async ({ page }) => {
  await button(page, 'Show placement 3').click()
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('3')
  await expect(root(page).locator('.bp-packed-item')).toHaveCount(3)
  await button(page, 'Show placement 6').click()
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('5')
  await expect(root(page).locator('.bp-bin-used').nth(3).locator('.bp-packed-item')).toHaveText(['6', '4'])
  await root(page).locator('.bp-more-card').click()
  await expect(button(page, 'Show placement 7')).toBeVisible()
  await button(page, 'Show placement 12').click()
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('6')
  await expect(root(page).locator('.bp-packed-item')).toHaveCount(12)
  await button(page, 'Earlier items').click()
  await expect(button(page, 'Show placement 1')).toBeVisible()
  await button(page, 'Show placement 1').click()
  await expect(root(page).locator('.bp-stat-items small')).toHaveText('1 of 12 packed')
})
test('044 bin and item inspectors distinguish placeholders, placed items and future previews', async ({ page }) => {
  await button(page, 'Reset').click()
  await button(page, 'Inspect bin 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('available placeholder')
  await close(page)
  await button(page, 'Inspect sorted item 12').click()
  await expect(root(page).getByRole('dialog')).toContainText('previews a later placement')
  await button(page, 'Show this placement').click()
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('6')
  await button(page, 'Inspect bin 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('Items: [9, 1]')
  await expect(root(page).getByRole('dialog')).toContainText('Capacity check: 10 ≤ 10')
  await page.keyboard.press('Escape')
  await expect(root(page).getByRole('dialog')).not.toBeVisible()
})
test('044 animation pauses and resumes while drafts stop stale playback', async ({ page }) => {
  await root(page).getByLabel('Animation speed', { exact: true }).fill('100')
  await button(page, 'Animate Step').click()
  await expect(root(page).locator('.bp-stat-items small')).not.toHaveText('0 of 12 packed')
  await button(page, 'Pause').click()
  const paused = await root(page).locator('.bp-stat-items small').innerText()
  await page.waitForTimeout(350)
  await expect(root(page).locator('.bp-stat-items small')).toHaveText(paused)
  await button(page, 'Resume').click()
  await root(page).getByLabel('Packing item sizes', { exact: true }).fill('10,10')
  await expect(button(page, 'Pause')).toHaveCount(0)
  await root(page).locator('.bp-run-controls button').first().click()
  await expect(root(page).locator('.bp-stat-items strong')).toHaveText('2')
  await expect(root(page).locator('.bp-stat-items small')).toHaveText('All items packed!')
  await expect(root(page).locator('.bp-bin-used')).toHaveCount(2)
})
test('044 capacity certificates distinguish an optimal default result from a greedy counterexample', async ({ page }) => {
  await root(page).locator('.bp-stat-bins').click()
  await expect(root(page).getByRole('dialog')).toContainText('Volume lower bound: 6')
  await expect(root(page).getByRole('dialog')).toContainText('Exact optimum: 6')
  await expect(root(page).getByRole('dialog')).toContainText('90%')
  await close(page)
  await tab(page, 'Learn')
  await button(page, 'Try the counterexample').click()
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('3')
  await root(page).locator('.bp-stat-bins').click()
  await expect(root(page).getByRole('dialog')).toContainText('Exact optimum: 2')
  await expect(root(page).getByRole('dialog')).toContainText('uses more bins than the verified optimum')
  await close(page)
  await tab(page, 'Experiments')
  await root(page).locator('.bp-placement-table tbody button').nth(2).click()
  await expect(root(page).getByRole('dialog')).toContainText('Placement certificate 3')
  await expect(root(page).getByRole('dialog')).toContainText('Stop at the first feasible bin')
  await close(page)
})
test('044 empty input and maximum-size presets keep valid counts and explicit quality limits', async ({ page }) => {
  await apply(page, '10', '')
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('0')
  await expect(root(page).locator('.bp-stat-items strong')).toHaveText('0')
  await expect(root(page).locator('.bp-bin-empty')).toHaveCount(4)
  await root(page).locator('.bp-stat-bins').click()
  await expect(root(page).getByRole('dialog')).toContainText('Exact optimum: 0')
  await close(page)
  await tab(page, 'Experiments')
  await button(page, 'Maximum: 24 full bins').click()
  await expect(root(page).locator('.bp-stat-bins strong')).toHaveText('24')
  await expect(root(page).locator('.bp-bin-used')).toHaveCount(24)
  await root(page).locator('.bp-stat-bins').click()
  await expect(root(page).getByRole('dialog')).toContainText('meets the volume lower bound')
  await close(page)
})
test('044 theory, code, prediction, notes and section progress persist', async ({ page }) => {
  await expect(root(page).locator('.bp-progress > span')).toHaveText('0 of 6 sections')
  await button(page, 'Start Learning').click()
  await expect(root(page)).toContainText('ceil(54/10) = 6 bins')
  await button(page, 'Explore the worked example').click()
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('bins.findIndex')
  await tab(page, 'Practice')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Choose a prediction')
  await button(page, 'Bin 1').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await button(page, 'Bin 4').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await button(page, 'Visualize this placement').click()
  await expect(root(page).locator('.bp-stat-items small')).toHaveText('6 of 12 packed')
  await tab(page, 'Notes')
  await root(page).getByLabel('Your bin-packing notes', { exact: true }).fill('First fit chooses the earliest feasible bin.')
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Your bin-packing notes', { exact: true })).toHaveValue('First fit chooses the earliest feasible bin.')
  await expect(root(page).locator('.bp-progress > span')).toHaveText('5 of 6 sections')
})
test('044 keyboard search navigates to an exact lesson-name match', async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(root(page).getByLabel('Search algorithm topics', { exact: true })).toBeFocused()
  await root(page).getByLabel('Search algorithm topics', { exact: true }).fill('suffix array')
  await page.keyboard.press('Enter')
  await expect(page.locator('.suffix-array-page')).toBeVisible()
})
test('044 local scrolling contains twenty-four items and bins in dark mode', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Maximum: 24 full bins').click()
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const scroll = root(page).locator('.bp-bins-scroll')
  expect(await scroll.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  await scroll.evaluate((e) => (e.scrollLeft = e.scrollWidth))
  await button(page, 'Inspect bin 24').click()
  await expect(root(page).getByRole('dialog')).toContainText('Used: 100 / 100')
  await close(page)
  const list = root(page).locator('.bp-item-list')
  expect(
    await root(page)
      .locator('.bp-item-chip')
      .evaluateAll((chips) => chips.every((chip) => chip.scrollWidth <= chip.clientWidth)),
  ).toBe(true)
  expect(await list.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true)
  await list.evaluate((e) => (e.scrollTop = e.scrollHeight))
  await button(page, 'Inspect sorted item 24').click()
  await expect(root(page).getByRole('dialog')).toContainText('Original item identity: 24')
  await close(page)
  mkdirSync('artifacts/visual-qa/bin-packing-044', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/bin-packing-044/${info.project.name}-dark.png`, fullPage: true })
})
