import { test, expect, type Page } from '@playwright/test'
const root = (p: Page) => p.locator('.inversions-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close inversion dialog').click()
async function custom(p: Page, text: string) {
  await tab(p, 'Experiments')
  await button(p, 'Edit custom array').click()
  await root(p).getByLabel('Inversion array input').fill(text)
  await button(p, 'Apply inversion array').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/counting-inversions')
  await expect(root(page)).toBeVisible()
})
test('033 all reference components and desktop anchors render with truthful counts', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of ['Interactive Visualization', 'How it works', 'Key insight', 'Current state', 'Current inversions', 'Merge state', 'Complexity'])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.iv-left-cells text')).toHaveText(['1', '3', '5', '8'])
  await expect(root(page).locator('.iv-right-cells text')).toHaveText(['2', '4', '6', '7'])
  await expect(root(page).locator('.iv-count')).toHaveText('3')
  await expect(root(page).locator('.iv-added')).toHaveText('3')
  await expect(root(page).locator('.iv-merge-step')).toHaveText('2 / 8')
  await expect(root(page).locator('.iv-ledger tbody tr')).toHaveCount(3)
  await expect(root(page).locator('.iv-ledger tbody tr').first().locator('td')).toHaveText(['1', '(1, 4)', '(3, 2)', 'Step 2'])
  await expect(root(page).locator('.iv-example-result')).toContainText('total number of inversions is 7')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.iv-topbar', { x: 284, y: 18, width: 1287, height: 47 }],
      ['.mom-tabs', { x: 284, y: 77, width: 1287, height: 51 }],
      ['.iv-visualization', { x: 284, y: 138, width: 887, height: 493 }],
      ['.iv-graph-canvas', { x: 297, y: 213, width: 861, height: 341 }],
      ['.iv-how', { x: 1185, y: 138, width: 386, height: 344 }],
      ['.iv-insight', { x: 1185, y: 493, width: 386, height: 140 }],
      ['.iv-state', { x: 284, y: 642, width: 337, height: 193 }],
      ['.iv-inversions', { x: 631, y: 642, width: 525, height: 193 }],
      ['.iv-merge-state', { x: 1166, y: 642, width: 405, height: 193 }],
      ['.iv-complexity', { x: 284, y: 846, width: 1287, height: 89 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
    expect((await page.locator('.aimer-site-footer').boundingBox())!.y).toBe(943)
  }
})
test('033 merge steps update pointers, output and the inversion ledger together', async ({ page }) => {
  await button(page, 'Step merge').click()
  await expect(root(page).locator('.iv-comparison')).toHaveText('3 ≤ 4')
  await expect(root(page).locator('.iv-output-cells text')).toHaveText(['1', '2', '3', '', '', '', '', ''])
  await expect(root(page).locator('.iv-count')).toHaveText('3')
  await button(page, 'Step merge').click()
  await expect(root(page).locator('.iv-comparison')).toHaveText('5 > 4')
  await expect(root(page).locator('.iv-count')).toHaveText('5')
  await expect(root(page).locator('.iv-added')).toHaveText('2')
  await expect(root(page).locator('.iv-ledger tbody tr')).toHaveCount(5)
  await button(page, 'Reset').click()
  await expect(root(page).locator('.iv-count')).toHaveText('3')
  await expect(root(page).locator('.iv-merge-step')).toHaveText('2 / 8')
})
test('033 diagram values, comparison and pair ledger open useful inspectors', async ({ page }) => {
  await button(page, 'Inspect input index 1: 3').click()
  await expect(page.getByRole('dialog')).toContainText('Original index 1: 3')
  await expect(page.getByRole('dialog')).toContainText('Indices (1, 4): 3 > 2')
  await close(page)
  await button(page, 'Inspect current comparison').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('New inversions: 3. Total counted so far: 3.')
  await button(page, 'Next merge step').click()
  await expect(root(page).locator('.iv-comparison')).toHaveText('3 ≤ 4')
  await button(page, 'Inspect inversion pair 1, 4').click()
  await expect(page.getByRole('dialog')).toContainText('merge step 2 / 8')
  await expect(page.getByRole('dialog')).toContainText('Original indices (3, 4): 8 > 2')
  await close(page)
})
test('033 visibility toggle, shuffling and array-size controls change actual data', async ({ page }) => {
  await root(page).getByLabel('Show inversion pairs', { exact: true }).uncheck()
  await expect(root(page).locator('.iv-addition')).toHaveCount(0)
  await expect(root(page).locator('.iv-ledger')).toContainText('Inversion pairs hidden')
  await expect(root(page).locator('.iv-count')).toHaveText('3')
  await button(page, 'Shuffle array').click()
  const displayed = await root(page).locator('.iv-left-cells text,.iv-right-cells text').allTextContents()
  expect(displayed.map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  await root(page).getByLabel('Inversion array size').selectOption('4')
  await expect(root(page).locator('.iv-example-result')).toContainText('inversions is 6')
  await root(page).getByLabel('Inversion array size').selectOption('1')
  await expect(button(page, 'Step merge')).toBeDisabled()
  await expect(root(page).locator('.iv-count')).toHaveText('0')
  await expect(root(page).locator('.iv-example-result')).toContainText('inversions is 0')
})
test('033 custom inputs validate before replacing the trace and preserve equal-value identity', async ({ page }) => {
  await root(page).getByLabel('Inversion visualization view').selectOption('custom')
  const editor = root(page).getByLabel('Inversion array input')
  await expect(editor).toBeFocused()
  for (const text of ['', '[1,null]', '[1,]', 'Infinity', JSON.stringify(Array(21).fill(1))]) {
    await editor.fill(text)
    await button(page, 'Apply inversion array').click()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
  }
  await editor.fill('[3,1,3,1]')
  await button(page, 'Apply inversion array').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(root(page).locator('.iv-example-result')).toContainText('inversions is 3')
  await tab(page, 'Experiments')
  await expect(root(page)).toContainText('Current input: [3, 1, 3, 1]')
  await expect(root(page)).toContainText('Sorted result: [1, 1, 3, 3]')
  await custom(page, '-1, -5, -3, 0')
  await expect(root(page)).toContainText('Counted 2 of 2 inversions')
  await custom(page, '[42]')
  await expect(button(page, 'Auto merge')).toBeDisabled()
})
test('033 recursive playback visits internal merges and reaches the complete count', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Reverse sorted').click()
  await root(page).getByLabel('Inversion experiment trace view').selectOption('recursive')
  await expect(root(page).locator('.iv-run-summary')).toContainText('Merge range [0…1]')
  await root(page).getByLabel('Inversion playback speed').selectOption('100')
  await button(page, 'Auto merge').click()
  await expect(button(page, 'Pause playback')).toBeVisible()
  await expect(root(page).locator('.iv-run-summary')).toContainText('Counted 28 of 28 inversions', { timeout: 10000 })
  await expect(button(page, 'Auto merge')).toBeVisible({ timeout: 10000 })
  await button(page, 'Inspect merge [4…5]').click()
  await expect(root(page).locator('.iv-run-summary')).toContainText('Merge range [4…5]')
  await button(page, 'Jump to final result').click()
  await button(page, 'Return to merge visualization').click()
  await expect(root(page).locator('.iv-output-cells text')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8'])
  await button(page, 'Inspect inversion example result').click()
  await expect(page.getByRole('dialog')).toContainText('Total inversions: 28.')
  await button(page, 'Replay merge').click()
  await expect(root(page).locator('.iv-merge-step')).toHaveText('1 / 2')
})
test('033 theory, pseudocode, prediction and persistent notes explain strict comparisons', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('Equal values are not inversions')
  await expect(root(page)).toContainText('Total: 3 + 2 + 1 + 1 = 7')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('length(L) - i')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted inversion count').fill('4')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Predicted inversion count').fill('7')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct! There are 7')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Inversion notes').fill('Ties go left; original indices travel with values.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Inversion notes')).toHaveValue('Ties go left; original indices travel with values.')
})
test('033 twenty values and long ledgers scroll locally on dark narrow layouts', async ({ page }, info) => {
  await custom(page, JSON.stringify(Array.from({ length: 20 }, (_, i) => 20 - i)))
  await button(page, 'Jump to final result').click()
  await button(page, 'Toggle color theme').click()
  await button(page, 'Return to merge visualization').click()
  await expect(root(page).locator('.iv-count')).toHaveText('190')
  await expect(root(page).locator('.iv-ledger tbody tr')).toHaveCount(190)
  for (const width of [1280, 1024, 768, 393, 320]) {
    await page.setViewportSize({ width, height: 950 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  expect(
    await root(page)
      .locator('.iv-ledger-scroll')
      .evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/inversions-033/${info.project.name}-dark.png` })
})
