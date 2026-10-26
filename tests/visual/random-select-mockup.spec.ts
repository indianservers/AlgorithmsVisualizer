import { test, expect, type Page } from '@playwright/test'
const root = (p: Page) => p.locator('.random-select-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close quickselect dialog').click()
async function apply(p: Page, values: string, k: string, seed = '42') {
  await root(p).getByLabel('Quickselect array', { exact: true }).fill(values)
  await root(p).getByLabel('Quickselect target rank').fill(k)
  await root(p).getByLabel('Quickselect random seed').fill(seed)
  await button(p, 'Step').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/randomized-selection')
  await expect(root(page)).toBeVisible()
})
test('037 reference components and desktop anchors show a coherent partition around seven', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of ['Interactive Visualization', 'How it works', 'Target rank', 'Current pivot', 'Step-by-step state', 'Complexity'])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.rs-cell strong')).toHaveText(['3', '5', '2', '1', '6', '4', '7', '12', '9', '8'])
  await expect(root(page).locator('.rs-diagram h3')).toHaveText('Step 2: Partition around pivot 7')
  await expect(root(page).locator('.rs-pivot-info dd')).toHaveText(['7', '6', '7', '6', '3'])
  await expect(root(page).locator('.rs-left-cell')).toHaveCount(6)
  await expect(root(page).locator('.rs-right-cell')).toHaveCount(3)
  await expect(root(page).locator('.rs-history-scroll tbody tr')).toHaveCount(6)
  await expect(root(page).locator('.rs-example-result')).toContainText('4-th smallest element is 4')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.rs-topbar', { x: 282, y: 17, width: 1289, height: 47 }],
      ['.mom-tabs', { x: 282, y: 76, width: 1289, height: 51 }],
      ['.rs-visualization', { x: 282, y: 139, width: 882, height: 567 }],
      ['.rs-input-panel', { x: 299, y: 233, width: 852, height: 123 }],
      ['.rs-diagram-scroll', { x: 299, y: 367, width: 852, height: 254 }],
      ['.rs-how', { x: 1177, y: 139, width: 394, height: 311 }],
      ['.rs-target', { x: 1177, y: 462, width: 394, height: 111 }],
      ['.rs-pivot-info', { x: 1177, y: 586, width: 394, height: 123 }],
      ['.rs-history', { x: 282, y: 721, width: 809, height: 208 }],
      ['.rs-complexity', { x: 1103, y: 721, width: 468, height: 208 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
    expect((await page.locator('.aimer-site-footer').boundingBox())!.y).toBe(941)
  }
})
test('037 Start, Step and history rows keep the main partition synchronized', async ({ page }) => {
  await button(page, 'Start / Run').click()
  await expect(root(page).locator('.rs-diagram h3')).toHaveText('Step 1: Choose random pivot 7')
  await expect(root(page).locator('.rs-cell strong')).toHaveText(['8', '3', '12', '5', '2', '9', '1', '7', '4', '6'])
  await expect(root(page).locator('.rs-braces')).toHaveCount(0)
  await expect(root(page).locator('.rs-history-scroll tbody')).toContainText('Partition the active subarray to record a search step')
  await button(page, 'Step').click()
  await expect(root(page).locator('.rs-diagram h3')).toContainText('Partition around pivot 7')
  await button(page, 'Step').click()
  await expect(root(page).locator('.rs-diagram h3')).toContainText('Choose random pivot 6')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Preview computed search path').check()
  await button(page, 'Return to selection diagram').click()
  await button(page, 'Show selection partition 2').click()
  await expect(root(page).locator('.rs-diagram h3')).toContainText('Partition around pivot 1')
  await expect(root(page).locator('.rs-current-step')).toContainText('Right [1, 4], k=3')
})
test('037 equality returns the pivot and right branches adjust the local rank', async ({ page }) => {
  await root(page).getByLabel('Quickselect target rank').fill('7')
  await button(page, 'Step').click()
  await expect(root(page).locator('.rs-diagram h3')).toContainText('Found 7')
  await expect(root(page).locator('.rs-history-scroll tbody tr')).toHaveCount(1)
  await expect(root(page).locator('.rs-current-step')).toContainText('Found 7')
  await root(page).getByLabel('Quickselect target rank').fill('9')
  await button(page, 'Step').click()
  await expect(root(page).locator('.rs-diagram>p')).toContainText('adjusted rank k = 2')
  await expect(root(page).locator('.rs-current-step')).toContainText('Right [7, 9], k=2')
  await button(page, 'Step').click()
  await tab(page, 'Experiments')
  await expect(root(page)).toContainText('Global target rank: 9. Current local rank: 2. Answer: 9.')
})
test('037 indices, zones, value inspectors and rank/seed help are functional', async ({ page }) => {
  await root(page).getByLabel('Show indices', { exact: true }).uncheck()
  await expect(root(page).locator('.rs-index')).toHaveCount(0)
  await root(page).getByLabel('Show partition zones', { exact: true }).uncheck()
  await expect(root(page).locator('.rs-braces')).toHaveCount(0)
  await expect(root(page).locator('.rs-left-cell')).toHaveCount(0)
  await button(page, 'Inspect selection value 7: 7').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('Current index: 6')
  await close(page)
  await button(page, 'Explain target rank').click()
  await expect(page.getByRole('dialog')).toContainText('Equality k = r returns the pivot')
  await close(page)
  await button(page, 'Explain quickselect seed').click()
  await expect(page.getByRole('dialog')).toContainText('same array, target rank')
  await close(page)
  await button(page, 'Reset').click()
  await expect(root(page).locator('.rs-index')).toHaveCount(10)
  await expect(root(page).locator('.rs-braces')).toHaveCount(1)
})
test('037 inline editing validates array, one-based rank and unsigned seed', async ({ page }) => {
  for (const invalid of ['', '[]', '[null]', '[1,]', 'Infinity', JSON.stringify(Array(21).fill(1))]) {
    await root(page).getByLabel('Quickselect array', { exact: true }).fill(invalid)
    await button(page, 'Start / Run').click()
    await expect(root(page).getByRole('alert')).toBeVisible()
    await expect(root(page).locator('.rs-pivot-info dd').first()).toHaveText('7')
  }
  await button(page, 'Reset').click()
  for (const invalid of ['0', '11', '1.5']) {
    await root(page).getByLabel('Quickselect target rank').fill(invalid)
    await button(page, 'Step').click()
    await expect(root(page).getByRole('alert')).toContainText('1-indexed rank')
  }
  await root(page).getByLabel('Quickselect target rank').fill('4')
  await root(page).getByLabel('Quickselect random seed').fill('-1')
  await button(page, 'Step').click()
  await expect(root(page).getByRole('alert')).toContainText('0 to 4294967295')
  await apply(page, '[-4.5,0,2,2]', '2', '0')
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await expect(root(page).locator('.rs-example-result')).toContainText('2-th smallest element is 0')
})
test('037 automatic playback stops at the answer and keeps the active history row visible', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Quickselect playback speed').selectOption('100')
  await button(page, 'Return to selection diagram').click()
  await root(page).getByLabel('Quickselect auto play').check()
  await expect(button(page, 'Pause')).toBeVisible()
  await expect(root(page).getByLabel('Quickselect auto play')).not.toBeChecked({ timeout: 10000 })
  await expect(root(page).locator('.rs-answer-cell strong')).toHaveText('4')
  const row = await root(page).locator('.rs-current-step').boundingBox(),
    container = await root(page).locator('.rs-history-scroll').boundingBox()
  expect(row!.y).toBeGreaterThanOrEqual(container!.y)
  expect(row!.y + row!.height).toBeLessThanOrEqual(container!.y + container!.height + 2)
  await button(page, 'Inspect quickselect example result').click()
  await expect(page.getByRole('dialog')).toContainText('4-th smallest value is 4')
  await button(page, 'Replay quickselect').click()
  await expect(root(page).locator('.rs-diagram h3')).toContainText('Choose random pivot 7')
})
test('037 shuffle and random seed retain valid reproducible inputs, including duplicates', async ({ page }) => {
  await button(page, 'Shuffle').click()
  const shuffled = await root(page).getByLabel('Quickselect array', { exact: true }).inputValue()
  expect(
    shuffled
      .split(',')
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 12])
  await button(page, 'Random').click()
  const seed = Number(await root(page).getByLabel('Quickselect random seed').inputValue())
  expect(seed).toBeGreaterThanOrEqual(0)
  expect(seed).toBeLessThanOrEqual(4294967295)
  const partition = await root(page).locator('.rs-cell strong').allTextContents()
  await button(page, 'Start / Run').click()
  await button(page, 'Step').click()
  await expect(root(page).locator('.rs-cell strong')).toHaveText(partition)
  await tab(page, 'Experiments')
  await button(page, 'Duplicate values').click()
  await expect(root(page)).toContainText('Answer: 5')
  await button(page, 'Singleton').click()
  await button(page, 'Return to selection diagram').click()
  await expect(root(page).locator('.rs-answer-cell strong')).toHaveText('42')
  await expect(button(page, 'Step')).toBeDisabled()
  await expect(root(page).getByLabel('Quickselect auto play')).toBeDisabled()
})
test('037 learning, code, prediction and notes explain local rank correctly', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('subtract r from the local target rank')
  await expect(root(page)).toContainText('Equal values still occupy separate sorted positions')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('target == p')
  await expect(root(page).locator('pre')).toContainText('lo = p + 1')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted quickselect direction').selectOption('right')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Predicted quickselect direction').selectOption('left')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Randomized selection notes').fill('Equality stops; a right branch subtracts r.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Randomized selection notes')).toHaveValue('Equality stops; a right branch subtracts r.')
})
test('037 maximum arrays and full history remain readable in narrow dark layouts', async ({ page }, info) => {
  await apply(page, JSON.stringify(Array.from({ length: 20 }, (_, i) => (i % 2 ? -1000000 : 1000000))), '10')
  await tab(page, 'Experiments')
  await button(page, 'Jump to selected value').click()
  await button(page, 'Toggle color theme').click()
  await button(page, 'Return to selection diagram').click()
  await expect(root(page).locator('.rs-cell')).toHaveCount(20)
  for (const width of [1280, 1024, 768, 393, 320]) {
    await page.setViewportSize({ width, height: 950 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  expect(
    await root(page)
      .locator('.rs-diagram-scroll')
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true)
  expect(
    await root(page)
      .locator('.rs-history-scroll')
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/random-select-037/${info.project.name}-dark.png` })
})
