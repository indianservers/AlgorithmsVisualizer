import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})
test('013 reference dashboard contains all panels and computed extrema', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  for (const title of [
    'Array Split & Recursive Min/Max Visualizer',
    'Combine Step',
    'Recursion Tree & Call Stack',
    'Worked Example',
    'Key Ideas',
    'Comparisons & Complexity',
    'Correctness',
    'Assumptions and Constraints',
    'Pro Tip',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.mm-flow-root .mm-flow-value')).toHaveText(['8', '3', '12', '4', '6', '2', '10', '5'])
  await expect(root.locator('.mm-flow-group')).toHaveCount(6)
  await expect(root.locator('.mm-global-result')).toContainText('min(3, 2) = 2')
  await expect(root.locator('.mm-global-result')).toContainText('max(12, 10) = 12')
  await expect(root.locator('.mm-comparison-count')).toHaveText('10')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.mom-hero', { x: 274, y: 65, width: 1383, height: 120 }],
      ['.mm-visualizer', { x: 274, y: 244, width: 976, height: 405 }],
      ['.mm-key-ideas', { x: 1262, y: 244, width: 395, height: 216 }],
      ['.mm-comparisons', { x: 1262, y: 470, width: 395, height: 180 }],
      ['.mm-tree-panel', { x: 274, y: 660, width: 432, height: 275 }],
      ['.mm-worked', { x: 716, y: 660, width: 534, height: 275 }],
      ['.mm-correctness', { x: 1262, y: 660, width: 395, height: 83 }],
      ['.mm-constraints', { x: 1262, y: 752, width: 395, height: 103 }],
      ['.mm-pro-tip', { x: 1262, y: 863, width: 395, height: 72 }],
    ] as const) {
      // Reference coordinates establish geometry, not pixel-identical fidelity.
      const box = await root.locator(selector).boundingBox()
      expect(box).not.toBeNull()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  await page.screenshot({ path: `artifacts/visual-qa/min-max-013/${info.project.name}-learn.png`, fullPage: false })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
test('013 split groups and recursive nodes inspect truthful subtree results', async ({ page }) => {
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  await root.getByRole('button', { name: 'Inspect split range 0 to 3', exact: true }).click()
  await expect(root.locator('.mm-global-result')).toContainText('min(3, 4) = 3')
  await expect(root.locator('.mm-global-result')).toContainText('max(8, 12) = 12')
  await root.getByRole('button', { name: 'Inspect tree range 0 to 1', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.getByRole('heading', { name: 'Pair Base Case', exact: true })).toBeVisible()
  await expect(root.locator('.mm-base-explanation')).toContainText('1 value comparison')
  await expect(root.locator('.mm-global-result')).toContainText('min = 3')
  await root.getByRole('button', { name: 'Inspect full input array', exact: true }).click()
  await expect(root.locator('.mm-global-result')).toContainText('min(3, 2) = 2')
})
test('013 worked steps, previous navigation and result selection work', async ({ page }) => {
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  await expect(root.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled()
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.mm-worked-stage')).toContainText('Step 2:')
  await expect(root.locator('.mm-worked .mm-array-cells strong')).toHaveText(['8', '3', '12', '4'])
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.mm-worked .mm-array-cells strong')).toHaveText(['6', '2', '10', '5'])
  await root.getByRole('button', { name: 'Previous', exact: true }).click()
  await expect(root.locator('.mm-worked-stage')).toContainText('Step 2:')
  await root.getByRole('button', { name: '5 Result', exact: true }).click()
  await expect(root.locator('.mm-worked-result')).toContainText('10 comparisons')
  await expect(root.getByRole('button', { name: 'Next Step', exact: true })).toBeDisabled()
})
test('013 editable inputs, validation, odd lengths, pairs and singletons are accurate', async ({ page }) => {
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Min/max dataset').fill('1,2,3,4,5,6')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await expect(root.locator('.mm-global-result')).toContainText('max(3, 6) = 6')
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  await expect(root.locator('.mm-comparison-count')).toHaveText('8')
  await expect(root.locator('.mm-count-grid')).toContainText('≤ 2n − 2')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Min/max dataset').fill('[1,null]')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('finite numbers')
  await expect(root.locator('.mm-global-result')).toContainText('max(3, 6) = 6')
  await root.getByLabel('Min/max dataset').fill('[-5,-2]')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await expect(root.locator('.mm-global-result')).toContainText('min = -5')
  await expect(root.locator('.mm-base-explanation')).toContainText('1 value comparison')
  await expect(root.locator('.mm-worked-stage')).toContainText('one comparison orders the pair')
  await root.getByLabel('Min/max dataset').fill('[42]')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.locator('.mm-frame-message')).toContainText('Step 1/1')
  await expect(root.locator('.mm-comparison-count')).toHaveText('0')
  await expect(root.locator('.mm-global-result')).toContainText('max = 42')
  await expect(root.getByRole('button', { name: 'Next Step', exact: true })).toBeDisabled()
})
test('013 automatic playback counts actual comparisons and exposes the call stack', async ({ page }) => {
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.mm-frame-message')).toContainText('Step 1/')
  await expect(root.locator('.mm-comparison-count')).toHaveText('0')
  await root.getByRole('button', { name: 'Call Stack (Trace)', exact: true }).click()
  await expect(root.locator('.mm-stack')).toContainText('Depth 0')
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.mm-stack li')).toHaveCount(2)
  await root.getByLabel('Min/max playback speed').selectOption('100')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.locator('.mm-frame-message')).toContainText('Return min = 2, max = 12', { timeout: 10000 })
  await expect(root.locator('.mm-comparison-count')).toHaveText('10')
  await expect(root.getByRole('button', { name: 'Step forward', exact: true })).toBeDisabled()
  await root.getByRole('button', { name: 'Reset trace', exact: true }).click()
  await expect(root.locator('.mm-comparison-count')).toHaveText('0')
})
test('013 presets, prediction challenge, saved experiments and actual source work', async ({ page }) => {
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted min/max comparisons').fill('11')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Predicted min/max comparisons').fill('10')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Save experiment', exact: true }).click()
  await root.getByRole('button', { name: 'All negative', exact: true }).click()
  await expect(root.locator('.mm-global-result')).toContainText('min(-7, -9) = -9')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Load experiment', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('loaded')
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export JSON', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('divide-min-max-trace.json')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('function minMaxTrace')
})
test('013 dark, narrow and maximum-size inputs remain readable and scroll internally', async ({ page }, info) => {
  await page.goto('/divide-and-conquer/divide-min-max')
  const root = page.locator('.minmax-page')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/min-max-013/${info.project.name}-dark.png`, fullPage: false })
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Min/max dataset').fill(JSON.stringify(Array.from({ length: 20 }, (_, i) => i - 10)))
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await root.getByText('Full recursive tree', { exact: true }).click()
  await expect(root.locator('.mm-lab .mm-tree-node')).toHaveCount(23)
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})
