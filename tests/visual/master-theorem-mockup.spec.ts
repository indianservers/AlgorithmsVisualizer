import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/master-theorem')
})

test('008 reference dashboard has every component and measured layout anchors', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.master-page')
  for (const title of [
    'Interactive Master Theorem Explorer',
    'Recurrence Tree Visualization',
    'The Three Cases of Master Theorem',
    'Key Takeaways',
    'Worked Examples',
    'Common Exceptions / Non-applicable Cases',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.mt-tabs button')).toHaveCount(5)
  await expect(root.locator('.mt-common-choices button')).toHaveCount(6)
  await expect(root.locator('.mt-classification h3')).toHaveText('Identified case: Case 2')
  await expect(root.locator('.mt-result')).toContainText('Θ(n log n)')
  await expect(root.locator('.mt-tree-svg g[role="button"]')).toHaveCount(7)
  await expect(root.locator('.mt-case-table tbody tr')).toHaveCount(3)
  await expect(root.locator('.mt-example')).toHaveCount(2)
  await expect(root.locator('.mt-exceptions li')).toHaveCount(4)
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.mom-hero', { x: 322, y: 61, width: 1337, height: 137 }],
      ['.mom-start', { x: 1172, y: 136, width: 186, height: 45 }],
      ['.mt-tabs', { x: 322, y: 204, width: 663, height: 40 }],
      ['.mt-explorer', { x: 322, y: 254, width: 505, height: 344 }],
      ['.mt-tree', { x: 831, y: 254, width: 521, height: 344 }],
      ['.mt-cases', { x: 322, y: 607, width: 1030, height: 194 }],
      ['.mt-takeaways', { x: 1361, y: 228, width: 298, height: 395 }],
      ['.mt-worked', { x: 322, y: 810, width: 808 }],
      ['.mt-exceptions', { x: 1139, y: 810, width: 520 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  for (const [panelSelector, lastSelector] of [
    ['.mt-tree', '.mt-tree-tip'],
    ['.mt-explorer', '.mt-classification'],
    ['.mt-cases', '.mt-case-table'],
    ['.mt-takeaways', '.mt-pro-tip'],
  ] as const) {
    const panel = await root.locator(panelSelector).boundingBox(),
      last = await root.locator(panelSelector).locator(lastSelector).boundingBox()
    expect(last!.y + last!.height, `${panelSelector} content fits`).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/master-008/${info.project.name}-learn.png` })
})

test('008 editable parameters and function choices classify all three cases with validation', async ({ page }) => {
  const root = page.locator('.master-page')
  await root.getByRole('button', { name: 'Use combine work 1', exact: true }).click()
  await expect(root.locator('.mt-classification h3')).toContainText('Case 1')
  await expect(root.locator('.mt-result')).toContainText('Θ(n)')
  await root.getByRole('button', { name: 'Use combine work n log n', exact: true }).click()
  await expect(root.locator('.mt-result')).toContainText('Θ(n log^2 n)')
  await root.getByRole('button', { name: 'Use combine work n²', exact: true }).click()
  await expect(root.locator('.mt-classification h3')).toContainText('Case 3')
  await expect(root.locator('.mt-result')).toContainText('Θ(n^2)')
  await root.getByLabel('Number of subproblems a', { exact: true }).fill('4')
  await expect(root.locator('.mt-classification h3')).toContainText('Case 2')
  await expect(root.locator('.mt-result')).toContainText('Θ(n^2 log n)')
  await root.getByLabel('Size reduction factor b', { exact: true }).fill('1')
  await expect(root.getByRole('alert')).toContainText('integer b from 2 to 16')
  await expect(root.getByLabel('Size reduction factor b', { exact: true })).toHaveValue('2')
  await root.getByLabel('Size reduction factor b', { exact: true }).fill('4')
  await expect(root.getByRole('alert')).toHaveCount(0)
  await expect(root.locator('.mt-classification h3')).toContainText('Case 3')
})

test('008 custom log powers expose uncovered boundaries and eventual regularity', async ({ page }) => {
  const root = page.locator('.master-page'),
    dialog = page.getByRole('dialog', { name: 'Master Theorem detail', exact: true })
  await root.getByRole('button', { name: 'Use combine work nᵏ', exact: true }).click()
  await root.getByLabel('Polynomial exponent d', { exact: true }).fill('1')
  await root.getByLabel('Logarithmic exponent k', { exact: true }).fill('-1')
  await expect(root.locator('.mt-classification h3')).toContainText('Not covered')
  await expect(root.locator('.mt-classification')).toContainText('no result is claimed')
  await expect(root.locator('.mt-result')).toHaveCount(0)
  await root.getByLabel('Polynomial exponent d', { exact: true }).fill('2')
  await expect(root.locator('.mt-classification h3')).toContainText('Case 3')
  await root.getByRole('button', { name: 'Inspect the regularity proof', exact: true }).click()
  await expect(dialog).toContainText('r = a/b^d = 0.5 < c = 0.75 < 1')
  await expect(dialog).toContainText('approaches r from above')
  await expect(dialog.locator('.mt-regularity-threshold')).toContainText('2.0794')
  await page.keyboard.press('Escape')
  await root.getByRole('button', { name: 'Use combine work n', exact: true }).click()
  await root.getByRole('button', { name: 'Explain regularity condition', exact: true }).click()
  await expect(dialog).toContainText('ratio is exactly 1')
})

test('008 tree nodes, complete level accounting, playback and exported data use computed costs', async ({ page }) => {
  const root = page.locator('.master-page')
  await root.getByRole('button', { name: 'Inspect recursion level 1, node 1', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.mt-tree-tip')).toContainText('Level 1: 2 nodes, size 32 each')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.mt-cost-totals')).toContainText('Combine work: 384')
  await expect(root.locator('.mt-cost-totals')).toContainText('Leaf work: 64')
  await expect(root.locator('.mt-cost-totals')).toContainText('Total modeled work: 448')
  await root.getByRole('button', { name: 'Reset tree', exact: true }).click()
  await root.getByRole('button', { name: 'Next level', exact: true }).click()
  await expect(root.locator('.mt-trace-status')).toContainText('Selected level: 1/6')
  await root.getByRole('button', { name: 'Previous level', exact: true }).click()
  await root.getByRole('button', { name: 'Play tree', exact: true }).click()
  await expect(root.getByRole('button', { name: 'Next level', exact: true })).toBeDisabled({ timeout: 10000 })
  await expect(root.locator('.mt-tree-tip')).toContainText('64 leaves, size 1 each')
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export trace JSON', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('master-theorem-trace.json')
  await root.getByLabel('Recursion depth', { exact: true }).fill('0')
  await expect(root.locator('.mt-cost-totals')).toContainText('Total modeled work: 1')
  await expect(root.locator('.mt-level-table tbody tr')).toHaveCount(1)
  await expect(root.locator('.mt-level-label')).toContainText('Base work = 1')
})

test('008 case explanations, worked examples, exceptions and fullscreen accounting are interactive', async ({ page }) => {
  const root = page.locator('.master-page'),
    dialog = page.getByRole('dialog', { name: 'Master Theorem detail', exact: true })
  await root.getByRole('button', { name: 'Inspect Case 3', exact: true }).click()
  await expect(dialog).toContainText('polynomial gap without regularity is insufficient')
  await dialog.getByRole('button', { name: 'Load Case 3 example', exact: true }).click()
  await expect(root.locator('.mt-classification h3')).toContainText('Case 3')
  await root.getByRole('button', { name: "Load Strassen's Matrix Multiplication example", exact: true }).click()
  await expect(root.getByLabel('Number of subproblems a', { exact: true })).toHaveValue('7')
  await expect(root.locator('.mt-result')).toContainText('Θ(n^(log_2 7))')
  await expect(root.locator('.mt-hidden-nodes').last()).toContainText('4 of 49 nodes shown')
  await root.getByRole('button', { name: 'Fullscreen', exact: true }).click()
  await expect(dialog.locator('.mt-level-table tbody tr')).toHaveCount(7)
  await expect(dialog.locator('.mt-level-table tbody tr').last()).toContainText('117649')
  await dialog.getByRole('button', { name: 'Close theorem detail', exact: true }).click()
  await root.locator('.mt-exceptions button').nth(2).click()
  await expect(dialog).toContainText('Θ(n log log n)')
  await dialog.getByRole('button', { name: 'Explore n/log n boundary', exact: true }).click()
  await expect(root.locator('.mt-classification h3')).toContainText('Not covered')
  await root.getByRole('button', { name: 'Load Merge Sort example', exact: true }).click()
  await expect(root.locator('.mt-classification h3')).toContainText('Case 2')
})

test('008 prediction challenges, conceptual quiz and browser notes work', async ({ page }) => {
  const root = page.locator('.master-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted Master Theorem case', { exact: true }).selectOption('3')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.mt-prediction-feedback')).toContainText('Not yet')
  await root.getByLabel('Predicted Master Theorem case', { exact: true }).selectOption('2')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.mt-prediction-feedback')).toContainText('Correct. Case 2')
  await root.getByRole('button', { name: 'Next challenge', exact: true }).click()
  await root.getByLabel('Predicted Master Theorem case', { exact: true }).selectOption('1')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.mt-prediction-feedback')).toContainText('Correct. Case 1')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByLabel('It is smaller than n, but not by a fixed positive polynomial exponent.', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.locator('.mt-quiz-feedback')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Master Theorem notes', { exact: true }).fill('A polynomial gap and regularity are distinct conditions.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Master Theorem notes', { exact: true })).toHaveValue('A polynomial gap and regularity are distinct conditions.')
})

test('008 dark and narrow layouts retain readable trees and bounded large inputs', async ({ page }, info) => {
  const root = page.locator('.master-page')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({ path: `artifacts/visual-qa/master-008/${info.project.name}-dark.png` })
  expect(await root.locator('.mt-tree').evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Number of subproblems a', { exact: true }).fill('16')
  await root.getByLabel('Size reduction factor b', { exact: true }).fill('16')
  await root.getByRole('button', { name: 'Use combine work nᵏ', exact: true }).click()
  await root.getByLabel('Polynomial exponent d', { exact: true }).fill('8')
  await root.getByLabel('Logarithmic exponent k', { exact: true }).fill('5')
  await root.getByLabel('Recursion depth', { exact: true }).fill('10')
  await expect(root.locator('.mt-level-table tbody tr')).toHaveCount(11)
  await expect(root.locator('.mt-cost-totals')).not.toContainText('Infinity')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await root.getByRole('button', { name: 'Fullscreen', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Master Theorem detail', exact: true }),
    box = await dialog.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(292)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})
