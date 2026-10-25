import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/recursion-tree')
})

test('007 reference dashboard contains all learning components and measured anchors', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.recursion-page')
  for (const title of [
    'Interactive Recursion Tree',
    'Level Cost Summary',
    'Leaf Cost Analysis',
    'Total Work',
    'Key Takeaways',
    'Common Mistakes',
    'Worked Example: T(n) = 4T(n/2) + n',
    'Assumptions and Constraints',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.rt-tabs button')).toHaveCount(5)
  await expect(root.locator('.rt-diagram .rt-node')).toHaveCount(13)
  await expect(root.locator('.rt-preview-note')).toContainText('8/16 at level 2')
  await expect(root.locator('.rt-cost-chart circle[role="button"]')).toHaveCount(8)
  await expect(root.locator('.rt-overall')).toHaveAttribute('data-bound', 'Θ(n^2)')
  await expect(root.locator('.rt-overall sup')).toHaveText('2')
  await expect(root.locator('.rt-total')).toContainText('n(n − 1)')
  await expect(root.locator('.rt-leaf-cards').first()).toContainText('16384')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.mom-hero', { x: 320, y: 61, width: 1340, height: 145 }],
      ['.mom-start', { x: 1161, y: 141, width: 196, height: 43 }],
      ['.rt-tabs', { x: 320, y: 216, width: 666, height: 41 }],
      ['.rt-tree-panel', { x: 320, y: 271, width: 631, height: 411 }],
      ['.rt-summary', { x: 960, y: 271, width: 340, height: 411 }],
      ['.rt-leaf', { x: 320, y: 694, width: 490, height: 130 }],
      ['.rt-total', { x: 821, y: 694, width: 479, height: 130 }],
      ['.rt-takeaways', { x: 1312, y: 237, width: 348, height: 401 }],
      ['.rt-mistakes', { x: 1312, y: 650, width: 348, height: 185 }],
      ['.rt-worked', { x: 320, y: 835, width: 910 }],
      ['.rt-assumptions', { x: 1241, y: 837, width: 419 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  for (const [panelSelector, lastSelector] of [
    ['.rt-tree-panel', '.rt-diagram-scroll'],
    ['.rt-summary', '.rt-cost-formula'],
    ['.rt-leaf', '.rt-leaf-cards'],
    ['.rt-takeaways', '.rt-pro-tip'],
  ] as const) {
    const panel = await root.locator(panelSelector).boundingBox(),
      last = await root.locator(panelSelector).locator(lastSelector).boundingBox()
    expect(last!.y + last!.height, `${panelSelector} content fits`).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    const leaf = await root.locator('.rt-leaf-bound').boundingBox(),
      result = await root.locator('.rt-overall').boundingBox()
    expect(leaf!.x + leaf!.width, 'Leaf cost remains beside the overall result').toBeLessThanOrEqual(result!.x)
  }
  await page.screenshot({ path: `artifacts/visual-qa/recursion-tree-007/${info.project.name}-learn.png` })
})

test('007 editable branch, reduction and combine controls recompute the recurrence', async ({ page }) => {
  const root = page.locator('.recursion-page')
  await root.getByLabel('Branch factor a', { exact: true }).fill('2')
  await expect(root.locator('.rt-overall')).toContainText('Θ(n log n)')
  await expect(root.locator('.rt-cost-formula')).toContainText('Internal level costs are equal')
  await root.getByLabel('Work per node function', { exact: true }).selectOption('one')
  await expect(root.locator('.rt-overall')).toContainText('Θ(n)')
  await root.getByLabel('Branch factor a', { exact: true }).fill('1')
  await expect(root.locator('.rt-overall')).toContainText('Θ(log n)')
  await root.getByLabel('Size reduction b', { exact: true }).fill('1')
  await expect(root.getByRole('alert')).toContainText('integer b from 2 to 16')
  await expect(root.getByLabel('Size reduction b', { exact: true })).toHaveValue('2')
  await root.getByLabel('Size reduction b', { exact: true }).fill('4')
  await expect(root.getByRole('alert')).toHaveCount(0)
  await root.getByLabel('Branch factor slider', { exact: true }).fill('16')
  await expect(root.getByLabel('Branch factor a', { exact: true })).toHaveValue('16')
  await expect(root.getByLabel('Branch factor slider', { exact: true })).toHaveValue('16')
})

test('007 chart scales plot identical costs on genuinely different axes', async ({ page }) => {
  const root = page.locator('.recursion-page'),
    points = root.locator('.rt-cost-chart circle[role="button"]')
  const linear = await points.evaluateAll((nodes) => nodes.slice(0, 3).map((n) => Number(n.getAttribute('cy'))))
  expect(linear[0] - linear[1]).toBeLessThan(linear[1] - linear[2])
  await root.getByRole('button', { name: 'Logarithmic', exact: true }).click()
  const log = await points.evaluateAll((nodes) => nodes.slice(0, 3).map((n) => Number(n.getAttribute('cy'))))
  expect(Math.abs(log[0] - log[1] - (log[1] - log[2]))).toBeLessThan(0.001)
  await root.getByRole('button', { name: 'Inspect level 2 cost 512', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.rt-cost-formula')).toContainText('Level 2: 16 × 32 = 512')
  await expect(root.locator('.rt-chart-callout')).toContainText('Level 2: 512')
  await root.getByRole('button', { name: 'Linear', exact: true }).click()
  await expect(root.locator('.rt-cost-formula')).toContainText('Level 2: 16 × 32 = 512')
  await root.getByRole('button', { name: 'Inspect recursion level 1, node 1', exact: true }).click()
  await expect(root.locator('.rt-cost-formula')).toContainText('Level 1: 4 × 64 = 256')
})

test('007 stepping, playback, leaf base cases and exported accounting follow all levels', async ({ page }) => {
  const root = page.locator('.recursion-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.rt-numeric-totals')).toContainText('Internal work: 16256')
  await expect(root.locator('.rt-numeric-totals')).toContainText('Leaf work: 16384')
  await expect(root.locator('.rt-numeric-totals')).toContainText('Modeled total: 32640')
  await root.getByRole('button', { name: 'Next level', exact: true }).click()
  await expect(root.locator('.rt-trace-status')).toContainText('Level 1/7 · nodes = 4')
  await root.getByRole('button', { name: 'Previous level', exact: true }).click()
  await root.getByRole('button', { name: 'Play levels', exact: true }).click()
  await expect(root.getByRole('button', { name: 'Next level', exact: true })).toBeDisabled({ timeout: 10000 })
  await expect(root.locator('.rt-trace-status')).toContainText('Level 7/7 · nodes = 16384 · size per node = 1')
  await expect(root.locator('.rt-cost-formula')).toContainText('T(1) = 1')
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export levels JSON', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('recursion-tree-levels.json')
  await root.locator('.rt-cost-chart circle[role="button"]').last().hover()
  await root.getByLabel('Recursion tree depth', { exact: true }).fill('0')
  await expect(root.locator('.rt-level-table tbody tr')).toHaveCount(1)
  await expect(root.locator('.rt-numeric-totals')).toContainText('Internal work: 0')
  await expect(root.locator('.rt-numeric-totals')).toContainText('Modeled total: 1')
  await expect(root.locator('.rt-diagram .rt-node')).toHaveCount(1)
})

test('007 worked proofs, common mistakes and the decrement chain explain correct totals', async ({ page }) => {
  const root = page.locator('.recursion-page'),
    dialog = page.getByRole('dialog', { name: 'Recursion tree detail', exact: true })
  await root.getByRole('button', { name: 'Inspect worked step 2', exact: true }).click()
  await expect(dialog.locator('.rt-worked-proof')).toContainText('16256')
  await expect(dialog.locator('.rt-level-table tbody tr')).toHaveCount(8)
  await expect(dialog.locator('.rt-level-table button')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Explore the worked recurrence', exact: true }).click()
  await root.getByRole('button', { name: 'Contrast T(n−1) + n', exact: true }).click()
  await expect(dialog.locator('.rt-chain-status')).toContainText('Depth: 5 · Total work: 21')
  await expect(dialog.locator('.rt-chain-svg rect')).toHaveCount(6)
  await dialog.getByLabel('Decrement recurrence input n', { exact: true }).fill('4')
  await expect(dialog.locator('.rt-chain-status')).toContainText('Depth: 3 · Total work: 10')
  await expect(dialog.locator('.rt-chain-svg rect')).toHaveCount(4)
  await page.keyboard.press('Escape')
  await root.locator('.rt-mistakes button').first().click()
  await expect(dialog).toContainText('it is not a constant 2n')
  await dialog.getByRole('button', { name: 'Close recursion detail', exact: true }).click()
  await root.getByRole('button', { name: 'Expand tree accounting', exact: true }).click()
  await expect(dialog.locator('.rt-expanded-total')).toContainText('16256 + 16384 = 32640')
})

test('007 custom logarithmic functions use explicit leaf costs and level-sum extensions', async ({ page }) => {
  const root = page.locator('.recursion-page')
  await root.getByLabel('Branch factor a', { exact: true }).fill('2')
  await root.getByLabel('Work per node function', { exact: true }).selectOption('custom')
  await root.getByLabel('Tree logarithmic exponent k', { exact: true }).fill('-1')
  await expect(root.locator('.rt-overall')).toContainText('Θ(n log log n)')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.rt-numeric-totals')).not.toContainText('Infinity')
  await expect(root.locator('.rt-level-table tbody tr').last()).toContainText('128')
  await root.getByLabel('Tree logarithmic exponent k', { exact: true }).fill('-2')
  await expect(root.locator('.rt-overall')).toContainText('Θ(n)')
  await root.getByRole('button', { name: 'Compare binary search', exact: true }).click()
  await expect(root.locator('.rt-overall')).toContainText('Θ(log n)')
  await root.getByRole('button', { name: 'Compare merge sort', exact: true }).click()
  await expect(root.locator('.rt-numeric-totals')).toContainText('Modeled total: 1024')
})

test('007 prediction challenges, quiz and persistent notes are interactive', async ({ page }) => {
  const root = page.locator('.recursion-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted next level work', { exact: true }).fill('128')
  await root.getByLabel('Predicted number of leaves', { exact: true }).fill('16384')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.rt-prediction-feedback')).toContainText('Not yet')
  await root.getByLabel('Predicted next level work', { exact: true }).fill('256')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.rt-prediction-feedback')).toContainText('Correct. Level 1 costs 256; there are 16384 leaves')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByLabel('aⁱ f(n/bⁱ), because every node contributes work.', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.locator('.rt-quiz-feedback')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Recursion tree notes', { exact: true }).fill('Sum internal levels separately from the base-case leaves.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Recursion tree notes', { exact: true })).toHaveValue('Sum internal levels separately from the base-case leaves.')
})

test('007 dark and narrow layouts preserve readable previews and large level accounting', async ({ page }, info) => {
  const root = page.locator('.recursion-page')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({ path: `artifacts/visual-qa/recursion-tree-007/${info.project.name}-dark.png` })
  expect(await root.locator('.rt-diagram-scroll').evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Branch factor a', { exact: true }).fill('16')
  await root.getByLabel('Size reduction b', { exact: true }).fill('16')
  await root.getByLabel('Work per node function', { exact: true }).selectOption('custom')
  await root.getByLabel('Tree polynomial exponent d', { exact: true }).fill('8')
  await root.getByLabel('Tree logarithmic exponent k', { exact: true }).fill('5')
  await root.getByLabel('Recursion tree depth', { exact: true }).fill('10')
  await expect(root.locator('.rt-level-table tbody tr')).toHaveCount(11)
  await expect(root.locator('.rt-numeric-totals')).not.toContainText('Infinity')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await root.getByRole('button', { name: 'Expand tree accounting', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Recursion tree detail', exact: true }),
    box = await dialog.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(292)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})
