import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})
test('014 reference dashboard contains every teaching component and truthful results', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/divide-and-conquer/maximum-subarray')
  const root = page.locator('.maximum-page')
  for (const title of [
    'Problem Overview',
    'Array Visualization',
    'Current Example',
    'Key Takeaways',
    'Compare the Three Cases at Each Step',
    'Recursion Tree (Divide and Conquer)',
    'Worked Example',
    'Complexity & Correctness',
    'Midpoint Crossing Computation',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.mom-tabs button')).toHaveCount(5)
  await expect(root.locator('.mx-candidate footer>b')).toHaveText(['Best sum: 4', 'Best sum: 6', 'Best sum: 6'])
  await expect(root.locator('.mx-answer')).toContainText('Maximum subarray sum: 6')
  await expect(root.locator('.mx-answer')).toContainText('Range: [4, 6]')
  await expect(root.locator('.mx-scan-column.suffix footer')).toContainText('Best left suffix sum = 0')
  await expect(root.locator('.mx-scan-column.prefix footer')).toContainText('Best right prefix sum = 6')
  if (info.project.name === 'desktop') {
    // These reference anchors establish geometry, not pixel-identical fidelity.
    for (const [selector, expected] of [
      ['.mom-hero', { x: 279, y: 65, width: 1378, height: 127 }],
      ['.mx-overview', { x: 279, y: 257, width: 1097, height: 242 }],
      ['.mx-takeaways', { x: 1386, y: 215, width: 271, height: 285 }],
      ['.mx-comparison', { x: 279, y: 508, width: 807, height: 243 }],
      ['.mx-recursion', { x: 1096, y: 508, width: 561, height: 243 }],
      ['.mx-worked', { x: 279, y: 760, width: 506 }],
      ['.mx-complexity', { x: 795, y: 760, width: 413 }],
      ['.mx-crossing', { x: 1218, y: 760, width: 439 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      expect(box).not.toBeNull()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  }
  await page.screenshot({ path: `artifacts/visual-qa/maximum-subarray-014/${info.project.name}-learn.png`, fullPage: false })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
test('014 cases, recursion nodes, bars and midpoint scans can be inspected', async ({ page }) => {
  await page.goto('/divide-and-conquer/maximum-subarray')
  const root = page.locator('.maximum-page')
  await root.getByRole('button', { name: 'Inspect Best Left Subarray', exact: true }).click()
  await expect(root.locator('.mx-answer')).toContainText('Selected candidate sum: 4')
  await expect(root.locator('.mx-answer')).toContainText('[0, 2]')
  await root.getByRole('button', { name: 'Inspect Best Crossing Subarray', exact: true }).click()
  await expect(root.locator('.mx-answer')).toContainText('[0, 6]')
  await root.getByRole('button', { name: 'Inspect recursion range 0 to 3', exact: true }).click()
  await expect(root.locator('.mx-answer')).toContainText('Maximum subarray sum: 4')
  await root.getByRole('button', { name: 'Inspect recursion range 0 to 7', exact: true }).click()
  await root.getByRole('button', { name: 'Inspect suffix scan 4', exact: true }).click()
  await expect(root.locator('.mx-notice')).toContainText('Suffix scan sum 0; best so far 0')
  await root.getByRole('button', { name: 'Inspect prefix scan 7', exact: true }).click()
  await expect(root.locator('.mx-notice')).toContainText('Prefix scan sum 6; best so far 6')
  await root.locator('.mx-overview').getByRole('button', { name: 'Inspect array index 4, value 5', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.mx-notice')).toContainText('Index 4: value 5')
})
test('014 editable arrays, validation, all-negative answers and singleton playback work', async ({ page }) => {
  await page.goto('/divide-and-conquer/maximum-subarray')
  const root = page.locator('.maximum-page')
  await root.getByLabel('Current example array', { exact: true }).fill('[-8, -2, -7]')
  await root.getByRole('button', { name: 'Run Step by Step', exact: true }).click()
  await expect(root.locator('.mx-answer')).toContainText('Maximum subarray sum: -2')
  await expect(root.locator('.mx-answer')).toContainText('[1, 1]')
  await root.getByLabel('Maximum subarray dataset', { exact: true }).fill('[1, null]')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('finite numbers')
  await expect(root.locator('.mx-answer')).toContainText('-2')
  await root.getByLabel('Maximum subarray dataset', { exact: true }).fill('[-5]')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.locator('.mx-frame-message')).toContainText('Step 1/1')
  await expect(root.locator('.mx-answer')).toContainText('Maximum subarray sum: -5')
  await expect(root.locator('.mx-base-case')).toContainText('one element')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('.mx-answer')).toContainText('Maximum subarray sum: 6')
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.mx-frame-message')).toContainText('Step 1/')
})
test('014 automatic playback follows the entire recursive trace and restarts', async ({ page }) => {
  await page.goto('/divide-and-conquer/maximum-subarray')
  const root = page.locator('.maximum-page')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Maximum subarray playback speed').selectOption('100')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.locator('.mx-frame-message')).toContainText('Choose the greatest of left, right and crossing sums: 6', { timeout: 18000 })
  await expect(root.getByRole('button', { name: 'Step forward', exact: true })).toBeDisabled()
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await root.getByRole('button', { name: 'Pause', exact: true }).click()
  await root.getByRole('button', { name: 'Reset steps', exact: true }).click()
  await expect(root.locator('.mx-frame-message')).toContainText('Step 0/')
})
test('014 prediction challenges, presets, saved experiments, export and actual source work', async ({ page }) => {
  await page.goto('/divide-and-conquer/maximum-subarray')
  const root = page.locator('.maximum-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted crossing sum').fill('4')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Predicted crossing sum').fill('6')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Save experiment', exact: true }).click()
  await root.getByRole('button', { name: 'Tied optima', exact: true }).click()
  await expect(root.locator('.mx-answer')).toContainText('Range: [0, 0]')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Load experiment', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('loaded')
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export JSON', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('maximum-subarray-trace.json')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('function maximumSubarrayTrace')
})
test('014 dark, narrow and longer-array layouts stay within the viewport', async ({ page }, info) => {
  await page.goto('/divide-and-conquer/maximum-subarray')
  const root = page.locator('.maximum-page')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(root.locator('.mx-overview')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/maximum-subarray-014/${info.project.name}-dark.png`, fullPage: false })
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Maximum subarray dataset', { exact: true }).fill(JSON.stringify(Array.from({ length: 32 }, (_, i) => (i % 2 ? -2 : 3))))
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    const panel = await root.locator('.mx-comparison').boundingBox(),
      footer = await root.locator('.mx-candidate.crossing footer').boundingBox()
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
})
