import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/greedy-exchange')
  await expect(page.locator('.greedy-exchange-page')).toBeVisible()
})

test('010 reference dashboard contains every component and measured layout anchors', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.greedy-exchange-page')
  await page.screenshot({ path: `artifacts/visual-qa/greedy-exchange-010/${info.project.name}-learn.png` })
  for (const heading of [
    'Activity Selection Visualizer',
    'Local Choice vs Global Outcome',
    'Exchange Argument (Before → After)',
    'Worked Example: Fractional Knapsack',
    'When Greedy Fails',
    'Key Takeaways',
  ])
    await expect(root.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root.locator('.ge-tabs button')).toHaveCount(5)
  await expect(root.locator('.ge-activity-body .ge-schedule g[role="button"]')).toHaveCount(6)
  await expect(root.locator('.ge-steps button')).toHaveCount(3)
  await expect(root.locator('.ge-before .ge-mini-label')).toHaveText(['A2 [3, 5]', 'A4 [5, 7]', 'A6 [8, 10]'])
  await expect(root.locator('.ge-after .ge-mini-label')).toHaveText(['A1 [1, 4]', 'A4 [5, 7]', 'A6 [8, 10]'])
  await expect(root.locator('.ge-selected-summary')).toContainText('{A1, A4, A6}')
  await expect(root.locator('.ge-knapsack-result output')).toHaveText('240')
  await expect(root.locator('.ge-item-table tbody tr')).toHaveCount(4)
  await expect(root.locator('.ge-counterexample')).toContainText('4 + 1 + 1 → 3 coins')
  await expect(root.locator('.ge-counterexample')).toContainText('3 + 3 → 2 coins')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.mom-hero', { x: 326, y: 63, width: 1332, height: 137 }],
      ['.ge-tabs', { x: 326, y: 210, width: 649, height: 40 }],
      ['.ge-activity', { x: 326, y: 262, width: 827, height: 328 }],
      ['.ge-comparison', { x: 1165, y: 262, width: 493, height: 328 }],
      ['.ge-exchange', { x: 326, y: 602, width: 556, height: 332 }],
      ['.ge-knapsack', { x: 894, y: 602, width: 421 }],
      ['.ge-fails', { x: 1326, y: 602, width: 332 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  for (const selector of ['.ge-activity', '.ge-comparison', '.ge-exchange', '.ge-knapsack', '.ge-fails', '.ge-takeaways']) {
    const panel = await root.locator(selector).boundingBox(),
      last = await root.locator(selector).locator('p, li').last().boundingBox()
    expect(last!.y + last!.height, `${selector} text remains visible`).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/greedy-exchange-010/${info.project.name}-learn.png` })
})

test('010 playback and every decision use the actual sorted interval trace', async ({ page }) => {
  const root = page.locator('.greedy-exchange-page')
  await root.getByRole('button', { name: 'Run Greedy', exact: true }).click()
  await expect(root.locator('.ge-selected-summary')).toContainText('Total count: 0')
  await expect(root.getByRole('button', { name: 'Run Greedy', exact: true })).toBeVisible({ timeout: 10000 })
  await expect(root.locator('.ge-selected-summary')).toContainText('Total count: 3 (Optimal)')
  await expect(root.locator('.mom-progress-details')).toContainText('1 of 5 activities')
  await expect(root.locator('.mom-progress b')).toHaveText('20%')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByRole('button', { name: 'Reset trace', exact: true }).click()
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.ge-trace-status')).toContainText('Step 1/6 · A1: accept')
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.ge-trace-status')).toContainText('Step 2/6 · A2: skip')
  await root.getByRole('button', { name: 'Step back', exact: true }).click()
  await expect(root.locator('.ge-trace-status')).toContainText('Step 1/6')
  await root.getByRole('button', { name: 'Inspect decision 6', exact: true }).click()
  await expect(root.locator('.ge-selected-summary')).toContainText('{A1, A4, A6}')
  await root.getByRole('button', { name: 'Inspect activity A3', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.ge-inspection')).toContainText('A3: [0, 6] · duration 6')
})

test('010 editable intervals, tie endpoints, examples and validation stay consistent', async ({ page }) => {
  const root = page.locator('.greedy-exchange-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Activity intervals', { exact: true }).fill('Long, 0, 10\nB, 1, 2\nC, 2, 3\nD, 3, 4')
  await root.getByRole('button', { name: 'Apply activities', exact: true }).click()
  await expect(root.locator('.ge-trace-status')).toContainText('Step 0/4')
  await root.getByLabel('Selected activity decision', { exact: true }).fill('4')
  await expect(root.locator('.ge-selected-summary')).toContainText('{B, C, D}')
  await root.getByRole('button', { name: 'Earliest Start', exact: true }).click()
  await expect(root.locator('.ge-comparison-count')).toHaveText('1')
  await expect(root.locator('.ge-comparison-result')).toContainText('the optimum has 3')
  await root.getByLabel('Activity intervals', { exact: true }).fill('Bad, 5, 5')
  await root.getByRole('button', { name: 'Apply activities', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('start < finish')
  await expect(root.locator('.ge-selected-summary')).toContainText('{B, C, D}')
  await root.getByLabel('Activity example', { exact: true }).selectOption('2')
  await expect(root.locator('.ge-selected-summary')).toContainText('{A1, A2, A3}')
  await expect(root.getByRole('alert')).toHaveCount(0)
})

test('010 alternative rules and the exchange transform report truthful outcomes', async ({ page }) => {
  const root = page.locator('.greedy-exchange-page')
  await root.getByRole('button', { name: 'Largest Duration', exact: true }).click()
  await expect(root.locator('.ge-comparison-count')).toHaveText('2')
  await expect(root.locator('.ge-comparison-result')).toContainText('the optimum has 3')
  await root.getByRole('button', { name: 'Earliest Start', exact: true }).click()
  await expect(root.locator('.ge-comparison-count')).toHaveText('2')
  await root.getByRole('button', { name: 'Earliest Finish (Greedy)', exact: true }).click()
  await expect(root.locator('.ge-comparison-count')).toHaveText('3')
  await expect(root.locator('.ge-after .ge-mini-label').first()).toHaveText('A1 [1, 4]')
  await root.getByRole('button', { name: 'Reset exchange argument', exact: true }).click()
  await expect(root.locator('.ge-after .ge-mini-label').first()).toHaveText('A2 [3, 5]')
  await root.getByRole('button', { name: 'Apply greedy exchange', exact: true }).click()
  await expect(root.locator('.ge-after .ge-mini-label').first()).toHaveText('A1 [1, 4]')
  await expect(root.locator('.ge-exchange-note')).toContainText('Since 4 ≤ 5')
  await expect(root.locator('.ge-exchange-note')).toContainText('Both schedules contain 3 activities')
})

test('010 fractional inputs, exclusions and capacity recompute an optimal fractional fill', async ({ page }) => {
  const root = page.locator('.greedy-exchange-page')
  await root.getByLabel('Knapsack capacity', { exact: true }).fill('45')
  await expect(root.locator('.ge-knapsack-result output')).toHaveText('220')
  await expect(root.locator('.ge-item-table tbody tr').nth(2)).toContainText('0.5')
  await root.getByLabel('Include item 1', { exact: true }).uncheck()
  await expect(root.locator('.ge-knapsack-result output')).toHaveText('200')
  await root.getByLabel('Item 2 value', { exact: true }).fill('200')
  await expect(root.locator('.ge-knapsack-result output')).toHaveText('300')
  await root.getByLabel('Knapsack capacity', { exact: true }).fill('0')
  await expect(root.locator('.ge-knapsack-result output')).toHaveText('0')
  await expect(root.getByRole('progressbar')).toHaveAttribute('value', '0')
  await root.getByLabel('Item 3 weight', { exact: true }).fill('0')
  await expect(root.getByRole('alert')).toContainText('positive weight')
  await expect(root.getByLabel('Item 3 weight', { exact: true })).toHaveValue('30')
})

test('010 coin DP, predictions, proof quiz and persistent notes work', async ({ page }) => {
  const root = page.locator('.greedy-exchange-page')
  await root.locator('.ge-theory summary').click()
  await root.getByLabel('Coin denominations', { exact: true }).fill('4, 6')
  await root.getByLabel('Coin amount', { exact: true }).fill('5')
  await root.getByRole('button', { name: 'Compare coin solutions', exact: true }).click()
  await expect(root.locator('.ge-counterexample')).toContainText('remainder 1')
  await expect(root.locator('.ge-counterexample')).toContainText('No exact solution')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByRole('button', { name: 'Reset prediction trace', exact: true }).click()
  await root.getByLabel('Predicted activity decision', { exact: true }).selectOption('skip')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.ge-prediction-feedback')).toContainText('Not yet')
  await root.getByLabel('Predicted activity decision', { exact: true }).selectOption('accept')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.ge-prediction-feedback')).toContainText('Correct. A1')
  await root.getByRole('button', { name: 'Reveal next decision', exact: true }).click()
  await root.getByLabel('Predicted activity decision', { exact: true }).selectOption('skip')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.ge-prediction-feedback')).toContainText('in conflict with A1')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByLabel('The greedy activity ends no later than the first activity it replaces.', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.locator('.ge-quiz-feedback')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await root.getByLabel('Greedy exchange notes', { exact: true }).fill('Preserve the feasible suffix and cardinality.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Greedy exchange notes', { exact: true })).toHaveValue('Preserve the feasible suffix and cardinality.')
})

test('010 dark and narrow layouts retain controls and long interval sets', async ({ page }, info) => {
  const root = page.locator('.greedy-exchange-page')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await root.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(root.locator('.ge-selected-summary')).toContainText('Total count: 0')
  }
  await page.setViewportSize({ width: 320, height: 900 })
  const chart = await root.locator('.ge-chart-scroll > svg').boundingBox()
  expect(chart!.width).toBeGreaterThanOrEqual(460)
  expect(await root.locator('.ge-chart-scroll').evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({ path: `artifacts/visual-qa/greedy-exchange-010/${info.project.name}-dark.png` })
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Activity intervals', { exact: true }).fill(Array.from({ length: 12 }, (_, i) => `A${i + 1}, ${i}, ${i + 1}`).join('\n'))
  await root.getByRole('button', { name: 'Apply activities', exact: true }).click()
  await root.getByLabel('Selected activity decision', { exact: true }).fill('12')
  await expect(root.locator('.ge-selected-summary')).toContainText('Total count: 12 (Optimal)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
