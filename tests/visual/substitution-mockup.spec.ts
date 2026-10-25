import { expect, test } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/recurrence-substitution')
})
test('006 reference composition includes all panels and fits the viewport', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.substitution-page')
  for (const name of [
    'Recurrence Explorer',
    'Proof Builder',
    'Recurrence Tree (Visualization)',
    'Key Takeaways',
    'Concept Summary',
    'Common Mistakes',
    'Edge Cases & Tips',
  ])
    await expect(root.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root.locator('.sb-tabs button')).toHaveCount(5)
  await expect(root.locator('.sb-proof-steps>li')).toHaveCount(5)
  await expect(root.locator('.sb-worked li')).toHaveCount(5)
  await expect(root.locator('.sb-tree-svg g[role=button]')).toHaveCount(7)
  await expect(root.locator('.sb-conclusion')).toContainText('O(n log n)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/substitution-006/${info.project.name}-learn.png` })
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 326, y: 60, width: 1332, height: 130 }],
      ['.sb-tabs', { x: 326, y: 200, width: 680, height: 42 }],
      ['.sb-explorer', { x: 326, y: 256, width: 884, height: 180 }],
      ['.sb-builder', { x: 326, y: 446, width: 500, height: 428 }],
      ['.sb-worked', { x: 838, y: 446, width: 372, height: 428 }],
      ['.sb-tree', { x: 1222, y: 256, width: 436, height: 266 }],
      ['.sb-takeaways', { x: 1222, y: 532, width: 436, height: 342 }],
      ['.sb-footer-grid', { x: 326, y: 884, width: 1332 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    const panel = await root.locator('.sb-worked').boundingBox(),
      last = await root.locator('.sb-conclusion').boundingBox()
    expect(last!.y + last!.height).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
})
test('006 recurrence editor validates supported inputs and loads honest certificates', async ({ page }) => {
  const root = page.locator('.substitution-page')
  await root.getByLabel('Recurrence relation', { exact: true }).fill('T(n) = T(n − 1) + n')
  await root.getByRole('button', { name: 'Analyze', exact: true }).click()
  await expect(root.locator('.sb-conclusion')).toContainText('O(n²)')
  await root.getByLabel('Recurrence relation', { exact: true }).fill('unsupported')
  await root.getByRole('button', { name: 'Analyze', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('four supported')
  await expect(root.locator('.sb-conclusion')).toContainText('O(n²)')
  await root.getByRole('button', { name: 'T(n) = 3T(n/2) + n', exact: true }).click()
  await expect(root.getByLabel('Your guess for T(n):', { exact: true })).toHaveValue('strengthened')
  await expect(root.locator('.sb-tree-scroll')).toContainText('4 of 9')
})
test('006 guessing and base-case changes recompute the proof instead of accepting every bound', async ({ page }) => {
  const root = page.locator('.substitution-page')
  await root.getByLabel('Your guess for T(n):', { exact: true }).selectOption('linear')
  await expect(root.locator('.sb-conclusion')).toContainText('not certified')
  await expect(root.locator('.sb-worked')).toContainText('> cn')
  await root.getByLabel('Your guess for T(n):', { exact: true }).selectOption('nlog')
  await root.locator('.sb-proof-steps > li').nth(4).getByRole('button').click()
  await root.getByLabel('Proof constant c', { exact: true }).fill('1')
  await expect(root.locator('.sb-conclusion')).toContainText('larger constant')
  await root.getByLabel('Proof constant c', { exact: true }).fill('2')
  await expect(root.locator('.sb-conclusion')).toContainText('O(n log n)')
})
test('006 keyboard tree selection, proof navigation and exact-cost table work', async ({ page }) => {
  const root = page.locator('.substitution-page')
  await root.getByRole('button', { name: 'Inspect tree level 1, node 1', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.sb-tree-selection')).toContainText('2 recursive calls')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByRole('button', { name: 'Next step', exact: true }).click()
  await expect(root.locator('.sb-controls output')).toContainText('Step 2 of 5')
  await expect(root.locator('tbody tr')).toHaveCount(8)
  await expect(root.locator('tbody tr').filter({ has: page.getByRole('cell', { name: '8', exact: true }) })).toContainText('32')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await root.getByRole('button', { name: 'Play proof', exact: true }).click()
  await expect(root.locator('.sb-controls output')).toContainText('Step 5 of 5', { timeout: 7000 })
  await expect(root.getByRole('button', { name: 'Play proof', exact: true })).toBeVisible()
})
test('006 predictions, quiz and persistent notes are interactive', async ({ page }) => {
  const root = page.locator('.substitution-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted T(8)', { exact: true }).fill('16')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Predicted T(8)', { exact: true }).fill('32')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByRole('button', { name: 'Use c ≥ 2', exact: false }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Record the recurrence, guess, induction domain, constant, and base cases.', { exact: true }).fill('Use one constant; check T(2) = 4.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.locator('textarea')).toHaveValue('Use one constant; check T(2) = 4.')
})
test('006 dark theme remains readable and contained', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/substitution-006/${info.project.name}-dark.png` })
})
test('006 logarithmic combine work and a loose bound have distinct explanations', async ({ page }) => {
  const root = page.locator('.substitution-page')
  await root.getByRole('button', { name: 'T(n) = 2T(n/2) + n log n', exact: true }).click()
  await expect(root.locator('.sb-conclusion')).toContainText('O(n log² n)')
  await root.locator('.sb-worked-heading').click()
  await root.getByText('Exact solution and matching lower bound', { exact: true }).click()
  await expect(root.locator('.sb-expanded-proof')).toContainText('n[1 + h(h + 1)/2]')
  await root.getByLabel('Your guess for T(n):', { exact: true }).selectOption('linear')
  await expect(root.locator('.sb-conclusion')).toContainText('not certified')
  await root.getByRole('button', { name: 'Use recommended bound', exact: true }).click()
  await expect(root.locator('.sb-conclusion')).toContainText('O(n log² n)')
  await root.getByRole('button', { name: 'T(n) = 2T(n/2) + n', exact: true }).click()
  await root.getByLabel('Your guess for T(n):', { exact: true }).selectOption('square')
  await expect(root.locator('.sb-conclusion')).toContainText('O(n²)')
  await expect(root.locator('.sb-expanded-proof')).toContainText('loose upper bound')
})
