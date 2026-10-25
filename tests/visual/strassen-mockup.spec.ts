import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})
test('015 reference dashboard contains all visual and mathematical components', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/divide-and-conquer/strassen')
  const root = page.locator('.strassen-page')
  for (const title of [
    'Matrix Block Decomposition',
    'Seven Recursive Products',
    'Combine to Get Result',
    'Worked Example (2 × 2 Matrices)',
    'Performance Comparison',
    'Correctness',
    'Complexity Analysis',
    'Assumptions and Constraints',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.sm-products .sm-product')).toHaveCount(7)
  await expect(root.locator('.sm-worked-products .sm-product')).toHaveCount(7)
  await expect(root.locator('.sm-final .sm-matrix-values>span')).toHaveText(['18', '14', '62', '66'])
  // Reference coordinates verify structure, not pixel-identical fidelity.
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 279, y: 65, width: 1378, height: 127 }],
      ['.sm-decomposition', { x: 279, y: 257, width: 572, height: 342 }],
      ['.sm-products', { x: 863, y: 257, width: 369, height: 342 }],
      ['.sm-combine', { x: 1244, y: 257, width: 413, height: 342 }],
      ['.sm-worked', { x: 279, y: 607, width: 815, height: 236 }],
      ['.sm-performance', { x: 1104, y: 607, width: 553, height: 236 }],
      ['.sm-bottom-grid', { x: 279, y: 850, width: 1378 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      expect(box).not.toBeNull()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
    const worked = await root.locator('.sm-worked').boundingBox(),
      final = await root.locator('.sm-final').boundingBox()
    expect(final!.y + final!.height).toBeLessThanOrEqual(worked!.y + worked!.height)
  }
  await page.screenshot({ path: `artifacts/visual-qa/strassen-015/${info.project.name}-learn.png`, fullPage: false })
  await root.getByRole('button', { name: 'Classical growth at n = 32', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.sm-chart-inspection')).toContainText('32768')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
test('015 product, block and live editable worked-example interactions stay consistent', async ({ page }) => {
  await page.goto('/divide-and-conquer/strassen')
  const root = page.locator('.strassen-page')
  await root.getByRole('button', { name: 'Inspect product M4', exact: true }).click()
  await expect(root.locator('.sm-inspection')).toContainText('-10')
  await root.getByRole('button', { name: 'Inspect C₂₂', exact: true }).click()
  await expect(root.locator('.sm-inspection')).toContainText('66')
  await root.getByRole('button', { name: 'Close', exact: true }).click()
  await root.getByLabel('Matrix A row 1 column 1', { exact: true }).fill('2')
  await root.getByLabel('Matrix A row 1 column 1', { exact: true }).blur()
  await expect(root.locator('.sm-final .sm-matrix-values>span')).toHaveText(['24', '22', '62', '66'])
  await root.getByRole('button', { name: 'Inspect product M1', exact: true }).click()
  await expect(root.locator('.sm-inspection')).toContainText('56')
})
test('015 recursive laboratory handles matrices, invalid input and playback', async ({ page }) => {
  await page.goto('/divide-and-conquer/strassen')
  const root = page.locator('.strassen-page')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: '4 × 4 identity example', exact: true }).click()
  await expect(root.locator('.sm-recursive-path')).toContainText('root · 4 × 4')
  await root.getByRole('button', { name: 'Inspect recursive product M2', exact: true }).click()
  await expect(root.locator('.sm-recursive-path')).toContainText('root.2 · 2 × 2')
  await root.getByRole('button', { name: 'Inspect recursive product M3', exact: true }).click()
  await expect(root.locator('.sm-recursive-path')).toContainText('root.2.3 · 1 × 1')
  await expect(root.getByRole('button', { name: 'Step forward', exact: true })).toBeEnabled()
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.getByRole('button', { name: 'Step forward', exact: true })).toBeDisabled()
  await root.getByRole('button', { name: 'Parent call', exact: true }).click()
  await expect(root.locator('.sm-recursive-path')).toContainText('root.2 · 2 × 2')
  await root.getByLabel('Matrix A JSON', { exact: true }).fill('[[1,2],[3]]')
  await root.getByRole('button', { name: 'Apply matrices', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('square matrices')
  await expect(root.locator('.sm-recursive-path')).toContainText('root.2 · 2 × 2')
  await root.getByLabel('Matrix A JSON', { exact: true }).fill('oops')
  await root.getByRole('button', { name: 'Apply matrices', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('valid JSON')
  await root.getByRole('button', { name: 'Reference example', exact: true }).click()
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.locator('.sm-lab [role="status"]')).toContainText('Step 12/12', { timeout: 16000 })
  await root.getByRole('button', { name: 'Reset steps', exact: true }).click()
  await expect(root.locator('.sm-lab [role="status"]')).toContainText('Step 0/12')
})
test('015 predictions, experiments, export, notes and source work', async ({ page }) => {
  await page.goto('/divide-and-conquer/strassen')
  const root = page.locator('.strassen-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Strassen predicted M1').fill('8')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Strassen predicted M1').fill('48')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Save experiment', exact: true }).click()
  await root.getByRole('button', { name: 'Zero matrix example', exact: true }).click()
  await expect(root.locator('.sm-final .sm-matrix-values>span')).toHaveText(['0', '0', '0', '0'])
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Load experiment', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('loaded')
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export JSON', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('strassen-experiment.json')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Strassen notes').fill('Seven products cancel cross terms.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Strassen notes')).toHaveValue('Seven products cancel cross terms.')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('function strassenMultiply')
})
test('015 dark and narrow layouts remain readable without horizontal overflow', async ({ page }, info) => {
  await page.goto('/divide-and-conquer/strassen')
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('.sm-decomposition')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/strassen-015/${info.project.name}-dark.png`, fullPage: false })
})
