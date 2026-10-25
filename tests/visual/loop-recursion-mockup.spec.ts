import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/loop-recursion-analysis')
})
test('005 reference dashboard contains every panel and the default computation', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.loop-recursion-page')
  for (const name of [
    'Loop Iteration Visualizer',
    'Growth Rate Comparison',
    'Recursion Call Stack Visualizer',
    'Recurrence Overview',
    'Worked Examples',
    'Assumptions and Constraints',
    'Common Mistakes',
  ])
    await expect(root.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root.locator('.lr-tabs button')).toHaveCount(5)
  await expect(root.locator('.lr-heat-grid button')).toHaveCount(36)
  await expect(root.locator('.lr-loop-result output')).toHaveText('n × n = 36')
  await expect(root.locator('.lr-stack-table ol>li')).toHaveCount(5)
  await expect(root.locator('.lr-stack-table>header')).toContainText('5 live frames; peak 5')
  await expect(root.locator('.lr-recurrences tbody tr')).toHaveCount(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 320, y: 59, width: 1339, height: 137 }],
      ['.lr-tabs', { x: 320, y: 207, width: 659, height: 43 }],
      ['.lr-loops', { x: 320, y: 261, width: 649, height: 298 }],
      ['.lr-growth', { x: 979, y: 261, width: 680, height: 298 }],
      ['.lr-stack', { x: 320, y: 571, width: 735, height: 260 }],
      ['.lr-recurrences', { x: 1065, y: 571, width: 594, height: 260 }],
      ['.lr-footer-grid', { x: 320, y: 843, width: 1339 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    const description = await root.locator('.mom-hero-title>p').boundingBox(),
      progress = await root.locator('.mom-progress').boundingBox()
    expect(description!.height).toBeGreaterThan(30)
    expect(description!.x + description!.width).toBeLessThanOrEqual(progress!.x)
  }
  await page.screenshot({ path: `artifacts/visual-qa/loop-recursion-005/${info.project.name}-learn.png` })
})
test('005 loop size, ordinal heatmap selection and animation use the same execution count', async ({ page }) => {
  const root = page.locator('.loop-recursion-page')
  await root.getByLabel('Loop size n', { exact: true }).fill('3')
  await expect(root.locator('.lr-heat-grid button')).toHaveCount(9)
  await root.getByRole('button', { name: 'Inspect iteration 5: i 2, j 2', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.lr-loop-status')).toContainText('Step 5/9: i = 2, j = 2; count = 5')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await root.getByRole('button', { name: 'Play loop animation', exact: true }).click()
  await expect(root.locator('.lr-loop-status')).toContainText('Step 9/9', { timeout: 5000 })
  await expect(root.getByRole('button', { name: 'Play loop animation', exact: true })).toBeVisible()
  await root.getByLabel('Loop size n', { exact: true }).fill('20')
  await expect(root.locator('.lr-heat-grid button')).toHaveCount(400)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
test('005 triangular and doubling programs have distinct exact counts and pseudocode', async ({ page }) => {
  const root = page.locator('.loop-recursion-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Loop pattern', { exact: true }).selectOption('triangular')
  await expect(root.locator('.lr-heat-grid button')).toHaveCount(21)
  await expect(root.locator('.lr-loop-result output')).toHaveText('n(n + 1)/2 = 21')
  await root.getByLabel('Loop pattern', { exact: true }).selectOption('doubling')
  await expect(root.locator('.lr-heat-grid button')).toHaveCount(3)
  await expect(root.getByLabel('Active loop pseudocode', { exact: true })).toContainText('while i ≤ n')
  await expect(root.locator('.lr-loop-result output')).toHaveText('⌊log₂ n⌋ + 1 = 3')
  await root.getByRole('button', { name: 'Next iteration', exact: true }).click()
  await expect(root.locator('.lr-loop-status')).toContainText('i = 1')
  await root.getByLabel('Editable loop n', { exact: true }).fill('1')
  await expect(root.locator('.lr-loop-result output')).toHaveText('⌊log₂ n⌋ + 1 = 1')
})
test('005 growth controls alter real chart paths, ranges and series visibility', async ({ page }) => {
  const root = page.locator('.loop-recursion-page')
  const path = root.locator('.lr-plot path[data-series=quadratic]'),
    initial = await path.getAttribute('d')
  await root.getByRole('button', { name: 'Linear', exact: true }).click()
  expect(await path.getAttribute('d')).not.toBe(initial)
  await root.getByLabel('Growth chart input range', { exact: true }).selectOption('20')
  await expect(root.locator('.lr-plot')).toHaveAttribute('aria-label', 'Linear growth rate chart')
  await root.getByRole('checkbox', { name: /^Quadratic/ }).uncheck()
  await expect(path).toHaveCount(0)
  await expect(root.locator('.lr-plot path[data-series]')).toHaveCount(3)
  await root.getByRole('button', { name: 'Logarithmic', exact: true }).click()
  await expect(root.locator('.lr-plot')).toHaveAttribute('aria-label', 'Logarithmic growth rate chart')
})
test('005 call stack expands frames, returns factorial values and handles the zero base case', async ({ page }) => {
  const root = page.locator('.loop-recursion-page')
  await root.getByRole('button', { name: 'Expand stack frame fact(4)', exact: true }).click()
  await expect(root.locator('.lr-frame-detail')).toContainText('Eventual return value = 24')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByRole('button', { name: 'Next call step', exact: true }).click()
  await expect(root.locator('.lr-stack-table ol>li')).toHaveCount(4)
  await expect(root.locator('.lr-stack-message')).toContainText('fact(0) returns 1')
  await root.getByRole('button', { name: 'Play calls', exact: true }).click()
  await expect(root.locator('.lr-stack-message')).toContainText('fact(4) returns 24', { timeout: 7000 })
  await expect(root.locator('.lr-stack-table ol>li')).toHaveCount(0)
  await root.getByLabel('Recursive input n', { exact: true }).fill('0')
  await expect(root.locator('.lr-stack-table ol>li')).toHaveCount(1)
  await expect(root.locator('.lr-stack-message')).toContainText('Base case: fact(0)')
  await root.getByLabel('Recursive input n', { exact: true }).fill('10')
  await expect(root.locator('.lr-stack-table ol>li')).toHaveCount(11)
  expect(
    await root.locator('.lr-chain').evaluate((el) => {
      const box = el.getBoundingClientRect()
      return [...el.querySelectorAll('rect')].every((rect) => {
        const r = rect.getBoundingClientRect()
        return r.right <= box.right + 1 && r.bottom <= box.bottom + 1
      })
    }),
  ).toBe(true)
})
test('005 binary search uses actual intervals and recurrence overview explains stack versus arrays', async ({ page }) => {
  const root = page.locator('.loop-recursion-page')
  await root.getByLabel('Recursive function', { exact: true }).selectOption('binary')
  await expect(root.locator('.lr-stack-table ol>li')).toHaveCount(4)
  await root.getByRole('button', { name: 'Expand stack frame search(0, 3)', exact: true }).click()
  await expect(root.locator('.lr-frame-detail')).toContainText('target = 5')
  await root.getByRole('button', { name: 'View more', exact: true }).click()
  await expect(root.locator('.lr-recurrence-details')).toContainText('Θ(n) auxiliary array space')
  await expect(root.locator('.lr-recurrence-details')).toContainText('n + n/2 + n/4')
})
test('005 worked examples, prediction, quiz and saved notes teach the computed states', async ({ page }) => {
  const root = page.locator('.loop-recursion-page')
  await root.locator('.lr-example').nth(1).getByRole('button').first().click()
  await expect(root.locator('.lr-example').nth(1)).toContainText('21, not 36')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted iteration count', { exact: true }).fill('21')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByRole('button', { name: '5 frames:', exact: false }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root
    .getByLabel('Record the loop bounds, exact count, recurrence, and peak stack depth.', { exact: true })
    .fill('Count the base frame; triangular n=6 gives 21.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.locator('textarea')).toHaveValue('Count the base frame; triangular n=6 gives 21.')
})
test('005 dark theme works on desktop and mobile without header overlap', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/loop-recursion-005/${info.project.name}-dark.png` })
})
