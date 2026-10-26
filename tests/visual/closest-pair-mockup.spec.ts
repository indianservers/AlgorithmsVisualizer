import { test, expect, type Page } from '@playwright/test'
const root = (p: Page) => p.locator('.closest-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  preset = (p: Page, name: string) => root(p).getByLabel('Closest-pair example', { exact: true }).selectOption(name),
  close = (p: Page) => button(p, 'Close closest-pair dialog').click()
async function edit(p: Page, text: string) {
  await tab(p, 'Experiments')
  await button(p, 'Edit point coordinates').click()
  await root(p).getByLabel('Closest-pair point JSON').fill(text)
  await button(p, 'Apply closest-pair points').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/closest-pair')
  await expect(root(page)).toBeVisible()
})
test('034 reference components and anchors use actual twenty-point data', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of ['Interactive Visualization', 'How it works', 'Nearest pair (current)', 'Recursive split (recursion tree)', 'Strip check', 'Complexity'])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.cp-point')).toHaveCount(20)
  await expect(root(page).locator('.cp-nearest-point')).toHaveCount(2)
  await expect(root(page).locator('.cp-nearest')).toContainText('(52, 48)')
  await expect(root(page).locator('.cp-nearest')).toContainText('(57, 51)')
  await expect(root(page).locator('.cp-nearest')).toContainText('5.83')
  await expect(root(page).locator('.cp-divide-label')).toContainText('x = 50')
  await expect(root(page).locator('.cp-strip-label')).toContainText('[44.17, 55.83]')
  await expect(button(page, 'Inspect closest-pair subproblem P')).toContainText('P (20)')
  await expect(button(page, 'Inspect closest-pair subproblem PL')).toContainText('Q (10)')
  await expect(root(page).locator('.cp-strip-scroll tbody tr')).toHaveCount(8)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.cp-topbar', { x: 288, y: 17, width: 1283, height: 47 }],
      ['.mom-tabs', { x: 288, y: 73, width: 1283, height: 54 }],
      ['.cp-visualization', { x: 288, y: 138, width: 884, height: 493 }],
      ['.cp-graph-canvas', { x: 302, y: 211, width: 857, height: 359 }],
      ['.cp-how', { x: 1185, y: 138, width: 386, height: 336 }],
      ['.cp-nearest', { x: 1185, y: 485, width: 386, height: 145 }],
      ['.cp-recursion', { x: 288, y: 642, width: 417, height: 280 }],
      ['.cp-strip-check', { x: 717, y: 642, width: 413, height: 280 }],
      ['.cp-complexity', { x: 1138, y: 642, width: 433, height: 280 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
    expect((await page.locator('.aimer-site-footer').boundingBox())!.y).toBe(933)
  }
})
test('034 strip and highlight controls change the plot and reset restores it', async ({ page }) => {
  await root(page).getByLabel('Show midpoint strip', { exact: true }).uncheck()
  await expect(root(page).locator('.cp-strip-band')).toHaveCount(0)
  await expect(root(page).locator('.cp-strip-label')).toHaveCount(0)
  await root(page).getByLabel('Highlight closest pair', { exact: true }).uncheck()
  await expect(root(page).locator('.cp-nearest-point')).toHaveCount(0)
  await expect(root(page).locator('.cp-pair-line')).toHaveCount(0)
  await button(page, 'Reset').click()
  await expect(root(page).locator('.cp-strip-band')).toHaveCount(1)
  await expect(root(page).locator('.cp-nearest-point')).toHaveCount(2)
})
test('034 recursion nodes and strip records inspect the selected subproblem', async ({ page }) => {
  await button(page, 'Inspect closest-pair subproblem PL').click()
  await expect(root(page).locator('.cp-nearest')).toContainText('7.21')
  await expect(root(page).locator('.cp-divide-label')).toContainText('17.5')
  await button(page, 'Inspect closest-pair subproblem P').click()
  await button(page, 'Inspect strip check 0').click()
  await expect(page.getByRole('dialog')).toContainText('Vertical gap: 12.00')
  await expect(page.getByRole('dialog')).toContainText('can be skipped')
  await close(page)
  await button(page, 'Inspect strip check 4').click()
  await expect(page.getByRole('dialog')).toContainText('Euclidean distance: 6.71')
  await button(page, 'Show this comparison').click()
  await expect(root(page).locator('.cp-compared-point')).toHaveCount(2)
  await expect(root(page).locator('.cp-current-check')).toContainText('6.71')
  await expect(root(page).locator('.cp-nearest')).toContainText('5.83')
})
test('034 point inspection measures, edits and removes actual input points', async ({ page }) => {
  await button(page, 'Inspect point 10: (52, 48)').click()
  await button(page, 'Use as distance anchor').click()
  await button(page, 'Inspect point 14: (57, 51)').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('Distance from point 10: 5.83')
  await root(page).getByLabel('Point x coordinate').fill('1001')
  await button(page, 'Apply point change').click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('between −1000 and 1000')
  await root(page).getByLabel('Point x coordinate').fill('52')
  await root(page).getByLabel('Point y coordinate').fill('48')
  await button(page, 'Apply point change').click()
  await expect(root(page).locator('.cp-nearest')).toContainText('0.00')
  await expect(root(page).locator('.cp-point')).toHaveCount(20)
  await tab(page, 'Experiments')
  await button(page, 'Point 14: (52, 48)').click()
  await button(page, 'Remove point').click()
  await expect(root(page).locator('.cp-run-summary')).toContainText('Point count: 19')
})
test('034 cross-strip improvement, singleton and duplicate examples are computed', async ({ page }) => {
  await preset(page, 'cross')
  await expect(root(page).locator('.cp-nearest')).toContainText('4.00')
  await button(page, 'Step divide').click()
  await expect(root(page).locator('.cp-nearest')).toContainText('1.00')
  await preset(page, 'duplicates')
  await expect(root(page).locator('.cp-nearest')).toContainText('0.00')
  await preset(page, 'line')
  await expect(root(page).locator('.cp-nearest')).toContainText('5.00')
  await preset(page, 'singleton')
  await expect(root(page).locator('.cp-point')).toHaveCount(1)
  await expect(root(page).locator('.cp-nearest')).toContainText('No pair')
  await expect(button(page, 'Step divide')).toBeDisabled()
  await expect(root(page).locator('.cp-tree-node')).toHaveCount(1)
})
test('034 custom JSON rejects malformed points and supports expanded negative axes', async ({ page }) => {
  await preset(page, 'custom')
  const editor = root(page).getByLabel('Closest-pair point JSON')
  await expect(editor).toBeFocused()
  for (const value of ['not JSON', '[]', '[[null,1]]', '[[1,2,3]]', '[[1001,0]]', JSON.stringify(Array(41).fill([0, 0]))]) {
    await editor.fill(value)
    await button(page, 'Apply closest-pair points').click()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
  }
  await editor.fill('[[-100,-100],[200,200],[-100,-99]]')
  await button(page, 'Apply closest-pair points').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(root(page).locator('.cp-nearest')).toContainText('1.00')
  await expect(root(page).locator('.cp-grid')).toContainText('-100')
  await expect(root(page).locator('.cp-grid')).toContainText('200')
  await button(page, 'Generate points').click()
  await expect(root(page).locator('.cp-point')).toHaveCount(3)
  await expect(root(page).getByLabel('Closest-pair example')).toHaveValue('generated')
})
test('034 full playback reaches the final pair and exposes actual stage messages', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Jump to first comparison').click()
  await root(page).getByLabel('Closest-pair playback speed').selectOption('100')
  await button(page, 'Auto divide').click()
  await expect(button(page, 'Pause playback')).toBeVisible()
  await expect(button(page, 'Auto divide')).toBeVisible({ timeout: 15000 })
  await expect(root(page).locator('.cp-run-summary')).toContainText('Subproblem P: 20 points')
  await expect(root(page)).toContainText('Final closest distance: 5.83')
  await button(page, 'Return to coordinate plot').click()
  await button(page, 'Inspect closest-pair result').click()
  await expect(page.getByRole('dialog')).toContainText('Input points: 20')
  await expect(page.getByRole('dialog')).toContainText('Distance: 5.83')
  await button(page, 'Replay closest-pair trace').click()
  await expect(root(page).locator('.cp-divide-line')).toHaveCount(0)
})
test('034 theory, pseudocode, predictions and saved notes are available', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('identical coordinates')
  await expect(root(page)).toContainText('√34 ≈ 5.83')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('i+7')
  await expect(root(page).locator('pre')).toContainText('>= best.distance')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted closest-pair distance').fill('8')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Predicted closest-pair distance').fill('5.83')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Closest-pair notes').fill('The y-gap can prune Euclidean comparisons.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Closest-pair notes')).toHaveValue('The y-gap can prune Euclidean comparisons.')
})
test('034 forty-point dark layouts keep plot and table scrolling local', async ({ page }, info) => {
  await edit(page, JSON.stringify(Array.from({ length: 40 }, (_, i) => [i % 2 ? 49 : 51, i * 2])))
  await button(page, 'Jump to final pair').click()
  await button(page, 'Toggle color theme').click()
  await button(page, 'Return to coordinate plot').click()
  await expect(root(page).locator('.cp-point')).toHaveCount(40)
  for (const width of [1280, 1024, 768, 393, 320]) {
    await page.setViewportSize({ width, height: 950 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  expect(
    await root(page)
      .locator('.cp-plot-scroll')
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/closest-pair-034/${info.project.name}-dark.png` })
})
