import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})
test('016 reference dashboard shows every panel and captures same-viewport evidence', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/divide-and-conquer/quickselect')
  const root = page.locator('.quickselect-page')
  await expect(root).toBeVisible()
  await page.screenshot({ path: `artifacts/visual-qa/quickselect-016/${info.project.name}-learn.png` })
  await expect(root.getByRole('button', { name: 'Learn', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const title of [
    'Quickselect Visualizer',
    'Recursion Trace',
    'Key Takeaways',
    'Common Pitfalls',
    'Complexity Analysis',
    'Correctness, Assumptions and Interpretation',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.qs-trace-node')).toHaveCount(4)
  await expect(root.locator('.qs-partition h3')).toContainText('pivot = 15')
  await expect(root.locator('.qs-band.lower strong')).toHaveText(['7', '10', '4', '3'])
  await expect(root.locator('.qs-worked-answer')).toContainText('3rd smallest element is 7')
  for (const selector of ['.qs-takeaways', '.qs-pitfalls', '.qs-pro-tip']) {
    const card = await root.locator(selector).boundingBox(),
      text = await root.locator(`${selector} p`).last().boundingBox()
    expect(text!.y + text!.height, `${selector} text fits its card`).toBeLessThanOrEqual(card!.y + card!.height + 1)
  }
  // Structural anchors from the supplied 1672×941 reference. These are not a pixel-fidelity pass.
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 275, y: 64, width: 1383, height: 123 }],
      ['.qs-visualizer', { x: 275, y: 249, width: 695, height: 495 }],
      ['.qs-recursion', { x: 980, y: 249, width: 315, height: 495 }],
      ['.qs-sidecards', { x: 1309, y: 249, width: 349, height: 501 }],
      ['.qs-bottom-layout', { x: 275, y: 754, width: 1383 }],
      ['.qs-worked', { x: 275, y: 754, width: 537 }],
      ['.qs-complexity', { x: 822, y: 754, width: 388 }],
      ['.qs-correctness', { x: 1220, y: 754, width: 438 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      expect(box).not.toBeNull()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(4)
    }
  }
  await page.screenshot({ path: `artifacts/visual-qa/quickselect-016/${info.project.name}-learn.png`, fullPage: false })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const growthPoint = root.getByRole('button', { name: 'Inspect growth at n = 1000', exact: true })
  await growthPoint.focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.qs-growth-inspection')).toContainText('Expected: 3000')
  await expect(root.locator('.qs-growth-inspection')).toContainText('Worst-case: 8000')
  expect(errors).toEqual([])
})
test('016 step, recursion selection, edited cells and invalid ranks keep truthful state', async ({ page }) => {
  await page.goto('/divide-and-conquer/quickselect')
  const root = page.locator('.quickselect-page')
  await root.getByRole('button', { name: 'Run Step', exact: true }).click()
  await expect(root.locator('.qs-partition h3')).toContainText('pivot = 3')
  await root.getByRole('button', { name: 'View recursion step 3', exact: true }).click()
  await expect(root.locator('.qs-partition h3')).toContainText('pivot = 4')
  await root.getByRole('button', { name: 'Run Step', exact: true }).click()
  await expect(root.locator('.qs-result')).toContainText('Answer: 7')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await root.getByLabel('Array value 1', { exact: true }).fill('-9')
  await root.getByLabel('Quickselect rank k').fill('1')
  await root.getByRole('button', { name: 'Run Step', exact: true }).click()
  await expect(root.locator('.qs-worked-answer')).toContainText('1st smallest element is -9')
  await root.getByLabel('Quickselect rank k').fill('99')
  await root.getByRole('button', { name: 'Run Step', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('Rank k')
  await expect(root.locator('.qs-worked-answer')).toContainText('-9')
})
test('016 bulk input, duplicates, random pivot, automatic playback and prediction work', async ({ page }) => {
  await page.goto('/divide-and-conquer/quickselect')
  const root = page.locator('.quickselect-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Quickselect predicted branch').selectOption('right')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Quickselect predicted branch').selectOption('left')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Quickselect bulk dataset').fill('4, 4, 4, 4')
  await root.getByLabel('Quickselect rank k').fill('2')
  await root.getByRole('button', { name: 'Apply dataset', exact: true }).click()
  await expect(root.locator('.qs-result')).toContainText('Answer: 4')
  await expect(root.locator('.qs-band.equal strong')).toHaveCount(4)
  await expect(root.getByRole('button', { name: 'Auto Run', exact: true })).toBeDisabled()
  await root.getByLabel('Quickselect pivot selection').selectOption('random')
  await root.getByLabel('Quickselect random seed').fill('25')
  await root.getByRole('button', { name: 'Run Step', exact: true }).click()
  await expect(root.locator('.qs-worked-answer')).toContainText('2nd smallest element is 4')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await root.getByLabel('Quickselect playback speed').selectOption('250')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.locator('.qs-result')).toContainText('Answer: 7')
  await expect(root.getByRole('button', { name: 'Auto Run', exact: true })).toBeVisible()
})
test('016 saved experiments, notes, code, proof tabs and study status persist', async ({ page }) => {
  await page.goto('/divide-and-conquer/quickselect')
  const root = page.locator('.quickselect-page')
  await root.getByRole('button', { name: 'Interpretation', exact: true }).click()
  await expect(root.locator('.qs-proof-content')).toContainText('O(n) auxiliary')
  await root.getByRole('button', { name: 'Assumptions', exact: true }).click()
  await expect(root.locator('.qs-proof-content')).toContainText('one-based')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await root.getByLabel('Quickselect notes').fill('Only the rank-containing side recurses.')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Save current run', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('saved')
  await root.getByRole('button', { name: 'Mark studied', exact: true }).click()
  await expect(root.locator('.mom-progress')).toContainText('100%')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Quickselect notes')).toHaveValue('Only the rank-containing side recurses.')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Load experiment 1', exact: true }).click()
  await expect(root.getByLabel('Quickselect rank k')).toHaveValue('3')
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export trace', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('quickselect-trace.json')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('export function quickTrace')
})
test('016 is usable in dark theme at 320, 393 and 768 pixels', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-theme', 'dark'))
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 941 })
    await page.goto('/divide-and-conquer/quickselect')
    const root = page.locator('.quickselect-page')
    await expect(root).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await root.getByRole('button', { name: 'Run Step', exact: true }).click()
    await expect(root.locator('.qs-partition h3')).toContainText('pivot = 3')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px`).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/quickselect-016/${info.project.name}-dark.png`, fullPage: false })
})
