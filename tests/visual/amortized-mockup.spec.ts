import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/amortized-analysis')
  await expect(page.locator('.amortized-page')).toBeVisible()
})

test('011 reference dashboard has all components and measured layout anchors', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.amortized-page')
  await page.screenshot({ path: `artifacts/visual-qa/amortized-011/${info.project.name}-learn.png` })
  for (const title of [
    'Dynamic Array Resizing Visualizer',
    'Accounting Method (Stack Example)',
    'Potential Method (Dynamic Array)',
    'Aggregate Analysis Chart',
    'Worked Example: Dynamic Array Append',
    'Formulas, Assumptions and Interpretation',
    'Key Takeaways',
    'Common Pitfalls',
    'Pro Tip',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.am-tabs button')).toHaveCount(5)
  await expect(root.locator('.am-actual')).toHaveText('5')
  await expect(root.locator('.am-total')).toHaveText('12')
  await expect(root.locator('.am-resizes')).toHaveText('3')
  await expect(root.locator('.am-phi')).toHaveText('Φ = 2')
  await expect(root.locator('.am-timeline-list button')).toHaveCount(10)
  await expect(root.getByRole('button', { name: /Inspect worked append/ })).toHaveCount(8)
  await expect(root.locator('.am-worked-analysis')).toContainText('15')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 279, y: 65, width: 1378, height: 127 }],
      ['.am-visualizer', { x: 279, y: 257, width: 1023, height: 274 }],
      ['.am-accounting', { x: 279, y: 540, width: 346, height: 257 }],
      ['.am-potential', { x: 635, y: 540, width: 329, height: 257 }],
      ['.am-aggregate', { x: 974, y: 540, width: 328, height: 257 }],
      ['.am-takeaways', { x: 1315, y: 257, width: 342, height: 222 }],
      ['.am-pitfalls', { x: 1315, y: 490, width: 342, height: 219 }],
      ['.am-pro-tip', { x: 1315, y: 715, width: 342, height: 87 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  }
  for (const selector of ['.am-takeaways', '.am-pitfalls', '.am-pro-tip']) {
    const card = await root.locator(selector).boundingBox(),
      text = await root.locator(`${selector} p`).last().boundingBox()
    expect(text!.y + text!.height).toBeLessThanOrEqual(card!.y + card!.height)
  }
  const chart = await root.locator('.am-aggregate').boundingBox(),
    axis = await root.locator('.am-chart svg text').last().boundingBox()
  expect(axis!.y + axis!.height).toBeLessThanOrEqual(chart!.y + chart!.height)
  await page.screenshot({ path: `artifacts/visual-qa/amortized-011/${info.project.name}-learn.png` })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('011 live append, pop, reset and invalid input preserve actual cost history', async ({ page }) => {
  const root = page.locator('.amortized-page')
  await root.getByRole('button', { name: 'Push (Append)', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('13')
  await expect(root.locator('.am-actual')).toHaveText('1')
  await expect(root.locator('.am-array-panel h3')).toContainText('size 6 / capacity 8')
  await root.getByRole('button', { name: 'Pop', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('14')
  await expect(root.locator('.am-array-panel h3')).toContainText('size 5 / capacity 8')
  await root.getByLabel('Value to append', { exact: true }).fill('')
  await root.getByRole('button', { name: 'Push (Append)', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('finite value')
  await expect(root.locator('.am-total')).toHaveText('14')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('0')
  await expect(root.locator('.am-array-panel h3')).toContainText('size 0 / capacity 1')
  await expect(root.getByRole('button', { name: 'Pop', exact: true })).toBeDisabled()
})

test('011 chart and worked steps select real snapshots; editing forks the planned future', async ({ page }) => {
  const root = page.locator('.amortized-page')
  await root.getByRole('button', { name: 'Inspect aggregate operation 8', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.am-total')).toHaveText('15')
  await root.getByRole('button', { name: 'Push (Append)', exact: true }).click()
  await expect(root.locator('.am-actual')).toHaveText('9')
  await expect(root.locator('.am-total')).toHaveText('24')
  await expect(root.locator('.am-array-panel h3')).toContainText('size 9 / capacity 16')
  await expect(root.locator('.am-timeline-list button')).toHaveCount(9)
  await root.getByRole('button', { name: 'Inspect operation 5', exact: true }).click()
  await root.getByLabel('Value to append', { exact: true }).fill('-7')
  await root.getByRole('button', { name: 'Push (Append)', exact: true }).click()
  await expect(root.locator('.am-timeline-list button')).toHaveCount(6)
  await expect(root.locator('.am-total')).toHaveText('13')
  await expect(root.locator('.am-timeline-list button').last()).toContainText('push(-7)')
  await root.getByRole('button', { name: 'Inspect worked append 3', exact: true }).click()
  await expect(root.locator('.am-actual')).toHaveText('3')
  await expect(root.locator('.am-total')).toHaveText('6')
})

test('011 potential calculation and separate stack credits explain their own models', async ({ page }) => {
  const root = page.locator('.amortized-page')
  await root.getByRole('button', { name: 'Inspect amortized cost calculation', exact: true }).click()
  await expect(root.locator('.am-potential-equation')).toContainText('5 + 2 − 4 = 3')
  await root.getByRole('button', { name: 'Pop a stack item', exact: true }).click()
  await expect(root.locator('.am-stack-feedback')).toContainText('Push a stack item before popping it')
  await root.getByRole('button', { name: 'Push a stack item', exact: true }).click()
  await expect(root.locator('.am-stack-balance')).toContainText('Saved credits: 1 · charged: 2 · actual: 1')
  await root.getByRole('button', { name: 'Pop a stack item', exact: true }).click()
  await expect(root.locator('.am-stack-balance')).toContainText('Saved credits: 0 · charged: 2 · actual: 2')
  await root.getByRole('button', { name: 'Assumptions', exact: true }).click()
  await expect(root.locator('.am-formulas')).toContainText('capacity')
})

test('011 stepping, playback, bounded examples and trace export work', async ({ page }) => {
  const root = page.locator('.amortized-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByRole('button', { name: 'Step back', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('7')
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('12')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.getByRole('button', { name: 'Step forward', exact: true })).toBeDisabled({ timeout: 10000 })
  await expect(root.locator('.am-total')).toHaveText('25')
  await root.getByLabel('Append example count', { exact: true }).fill('32')
  await root.getByRole('button', { name: 'Load append sequence', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('0')
  await root.getByLabel('Selected operation', { exact: true }).fill('32')
  await expect(root.locator('.am-total')).toHaveText('63')
  await expect(root.getByRole('button', { name: 'Push (Append)', exact: true })).toBeDisabled()
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export JSON', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('amortized-array-trace.json')
  await root.getByRole('button', { name: 'Reference example', exact: true }).click()
  await expect(root.locator('.am-total')).toHaveText('12')
})

test('011 prediction feedback, conceptual quiz and persisted notes work', async ({ page }) => {
  const root = page.locator('.amortized-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted actual append cost', { exact: true }).fill('2')
  await root.getByLabel('Predicted amortized append cost', { exact: true }).fill('3')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.am-prediction-feedback')).toContainText('Not yet')
  await root.getByLabel('Predicted actual append cost', { exact: true }).fill('1')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.am-prediction-feedback')).toContainText('Correct! Actual cost = 1; amortized cost = 3.')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByLabel('It deterministically bounds total cost over a sequence.', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.locator('.am-quiz-feedback')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await root.getByLabel('Amortized-analysis notes', { exact: true }).fill('Copies are paid for over the sequence.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Amortized-analysis notes', { exact: true })).toHaveValue('Copies are paid for over the sequence.')
})

test('011 dark theme and large examples fit narrow screens', async ({ page }, info) => {
  const root = page.locator('.amortized-page')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Append example count', { exact: true }).fill('32')
  await root.getByRole('button', { name: 'Load append sequence', exact: true }).click()
  await root.getByLabel('Selected operation', { exact: true }).fill('32')
  await page.setViewportSize({ width: 320, height: 900 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await root.getByRole('button', { name: 'Reference example', exact: true }).click()
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({ path: `artifacts/visual-qa/amortized-011/${info.project.name}-dark.png` })
})
