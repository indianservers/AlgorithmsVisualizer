import { test, expect, type Page } from '@playwright/test'
const root = (p: Page) => p.locator('.random-quick-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close quicksort dialog').click()
async function edit(p: Page, values: string, seed = '42') {
  await tab(p, 'Experiments')
  await button(p, 'Edit custom quicksort array').click()
  await root(p).getByLabel('Randomized quicksort array input').fill(values)
  await root(p).getByLabel('Custom quicksort seed').fill(seed)
  await button(p, 'Apply quicksort input').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/randomized-quicksort')
  await expect(root(page)).toBeVisible()
})
test('036 reference panels and anchors show the seeded first-pivot example', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of ['Interactive Visualization', 'How it works', 'Pivot info', 'Recursion tree (subarray ranges)', 'Partition summary', 'Complexity'])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.rq-cell strong')).toHaveText(['7', '2', '9', '4', '3', '8', '1', '6', '5'])
  await expect(root(page).locator('.rq-pivot-tag')).toHaveText('Pivot (3)')
  await expect(root(page).locator('.rq-group-0 .rq-group-values button')).toHaveText(['2', '1'])
  await expect(root(page).locator('.rq-group-2 .rq-group-values button')).toHaveText(['7', '9', '4', '8', '6', '5'])
  await expect(root(page).locator('.rq-summary-scroll tbody tr').first().locator('td')).toHaveText(['Less than pivot', '2', '[2, 1]'])
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.rq-topbar', { x: 284, y: 17, width: 1287, height: 47 }],
      ['.mom-tabs', { x: 284, y: 73, width: 1287, height: 53 }],
      ['.rq-visualization', { x: 284, y: 138, width: 894, height: 471 }],
      ['.rq-toolbar', { x: 296, y: 213, width: 870, height: 66 }],
      ['.rq-diagram-scroll', { x: 296, y: 279, width: 870, height: 319 }],
      ['.rq-how', { x: 1190, y: 138, width: 381, height: 276 }],
      ['.rq-pivot-info', { x: 1190, y: 427, width: 381, height: 182 }],
      ['.rq-recursion', { x: 284, y: 622, width: 528, height: 287 }],
      ['.rq-summary', { x: 824, y: 622, width: 370, height: 287 }],
      ['.rq-complexity', { x: 1206, y: 622, width: 365, height: 287 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
    expect((await page.locator('.aimer-site-footer').boundingBox())!.y).toBe(924)
  }
})
test('036 stepping reveals actual in-place order and recursively excludes the equal block', async ({ page }) => {
  await button(page, 'Step partition').click()
  await expect(root(page).locator('.rq-cell strong')).toHaveText(['1', '2', '3', '4', '8', '9', '6', '5', '7'])
  await expect(root(page).locator('.rq-group-0 .rq-group-values button')).toHaveText(['1', '2'])
  await expect(root(page).locator('.rq-group-2 .rq-group-values button')).toHaveText(['4', '8', '9', '6', '5', '7'])
  await button(page, 'Step partition').click()
  await expect(root(page).locator('.rq-cell strong')).toHaveText(['1', '2'])
  await expect(root(page).locator('.rq-pivot-tag')).toHaveText('Pivot (2)')
  await button(page, 'Reset').click()
  await expect(root(page).locator('.rq-cell strong').first()).toHaveText('7')
  await button(page, 'Inspect quicksort node PR').click()
  await expect(page.getByRole('dialog')).toContainText('Subarray [3, 8], size 6')
  await button(page, 'Show node pivot selection').click()
  await expect(root(page).locator('.rq-diagram>h3')).toContainText('indices 3 … 8')
})
test('036 seed validation, deterministic replay and alternate seed selection work', async ({ page }) => {
  const seed = root(page).getByLabel('Quicksort random seed')
  await seed.fill('-1')
  await button(page, 'Step partition').click()
  await expect(root(page).getByRole('alert')).toContainText('0 to 4294967295')
  await expect(root(page).locator('.rq-pivot-tag')).toHaveText('Pivot (3)')
  await seed.fill('100')
  await button(page, 'Step partition').click()
  await expect(root(page).locator('.rq-pivot-info')).toContainText('seed = 100')
  const pivot = await root(page).locator('.rq-pivot-tag').textContent()
  await button(page, 'Step partition').click()
  await button(page, 'Reset').click()
  await seed.fill('100')
  await button(page, 'Step partition').click()
  await expect(root(page).locator('.rq-pivot-tag')).toHaveText(pivot!)
  await button(page, 'Reset').click()
  await expect(seed).toHaveValue('42')
})
test('036 cells, groups and recursion nodes expose useful inspectors', async ({ page }) => {
  await button(page, 'Inspect quicksort value 4: 3').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('original ID 4')
  await expect(page.getByRole('dialog')).toContainText('Compared with pivot 3: equal')
  await close(page)
  await button(page, 'Inspect partition group 2').click()
  await expect(page.getByRole('dialog')).toContainText('Count: 6')
  await expect(page.getByRole('dialog')).toContainText('preview classification before swaps')
  await close(page)
  await button(page, 'Inspect quicksort node P').click()
  await button(page, 'Open node PL').click()
  await expect(page.getByRole('dialog')).toContainText('Subarray [0, 1], size 2')
  await close(page)
})
test('036 custom arrays validate before replacing data and group duplicates once', async ({ page }) => {
  await root(page).getByLabel('Quicksort visualization view').selectOption('custom')
  const editor = root(page).getByLabel('Randomized quicksort array input')
  await expect(editor).toBeFocused()
  for (const value of ['', '[]', '[1,null]', '[1,]', 'Infinity', JSON.stringify(Array(21).fill(1))]) {
    await editor.fill(value)
    await button(page, 'Apply quicksort input').click()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
  }
  await editor.fill('[7,7,7,7,7]')
  await button(page, 'Apply quicksort input').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(root(page).locator('.rq-group-1 .rq-group-values button')).toHaveCount(5)
  await expect(root(page).locator('.rq-tree-node')).toHaveCount(1)
  await button(page, 'Step partition').click()
  await tab(page, 'Experiments')
  await expect(root(page)).toContainText('Finalized positions: 5 / 5')
  await edit(page, '[42]', '4294967295')
  await button(page, 'Return to array visualization').click()
  await expect(button(page, 'Step partition')).toBeDisabled()
  await expect(button(page, 'Auto play')).toBeDisabled()
  await expect(root(page).locator('.rq-pivot-info')).toContainText('Not needed')
})
test('036 autoplay sorts the complete input and final result can replay', async ({ page }) => {
  await root(page).getByLabel('Quicksort playback speed').fill('100')
  await button(page, 'Auto play').click()
  await expect(button(page, 'Pause')).toBeVisible()
  await expect(button(page, 'Auto play')).toBeVisible({ timeout: 10000 })
  await expect(root(page).locator('.rq-cell strong')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
  await button(page, 'Inspect randomized quicksort result').click()
  await expect(page.getByRole('dialog')).toContainText('Sorted output: [1, 2, 3, 4, 5, 6, 7, 8, 9]')
  await button(page, 'Replay seeded quicksort').click()
  await expect(root(page).locator('.rq-pivot-tag')).toHaveText('Pivot (3)')
})
test('036 shuffle preserves values, bar mode represents values and presets change the model', async ({ page }) => {
  await button(page, 'Shuffle').click()
  const values = await root(page).locator('.rq-cell strong').allTextContents()
  expect(values.map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  expect(values).not.toEqual(['7', '2', '9', '4', '3', '8', '1', '6', '5'])
  await root(page).getByLabel('Quicksort visualization view').selectOption('bars')
  await expect(root(page).locator('.rq-bars')).toBeVisible()
  expect(await root(page).locator('.rq-cell').first().getAttribute('style')).toContain('linear-gradient')
  await tab(page, 'Experiments')
  await button(page, 'Duplicates').click()
  await expect(root(page)).toContainText('Final sorted output: [1, 2, 2, 5, 5, 5, 5]')
  await button(page, 'Jump to sorted result').click()
  await expect(root(page).locator('.rq-run-summary')).toContainText('Subproblem sorted')
  const completedSummary = await root(page).locator('.rq-run-summary').innerText()
  await button(page, 'Previous partition event').click()
  await expect(root(page).locator('.rq-run-summary')).not.toHaveText(completedSummary)
})
test('036 theory, pseudocode, predictions and persistent notes explain random pivots', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('not stable')
  await expect(root(page)).toContainText('O(n) in the worst case')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('gt--')
  await expect(root(page)).toContainText('do not increment i')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted quicksort less count').fill('3')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Predicted quicksort less count').fill('2')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Randomized quicksort notes').fill('The equal block needs no recursive call.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Randomized quicksort notes')).toHaveValue('The equal block needs no recursive call.')
})
test('036 maximum arrays and deep trees stay inside narrow dark layouts', async ({ page }, info) => {
  await edit(page, JSON.stringify(Array.from({ length: 20 }, (_, i) => (i % 2 ? -1000000 : 1000000))))
  await button(page, 'Toggle color theme').click()
  await button(page, 'Return to array visualization').click()
  await expect(root(page).locator('.rq-cell')).toHaveCount(20)
  for (const width of [1280, 1024, 768, 393, 320]) {
    await page.setViewportSize({ width, height: 950 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  expect(
    await root(page)
      .locator('.rq-diagram-scroll')
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/random-quick-036/${info.project.name}-dark.png` })
})
