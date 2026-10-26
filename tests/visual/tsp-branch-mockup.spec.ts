import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/branch-and-bound/tsp-branch-and-bound')
})

test('021 default visualization includes every reference component and consistent graph values', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.tsp-branch-page')
  for (const title of [
    'Interactive Visualization',
    'City Graph (TSP Instance)',
    'Branch and Bound Search Tree',
    'Controls',
    'Current Best Tour (Incumbent)',
    'Distance Matrix',
    'Lower Bound Calculator',
    'Frontier Nodes',
    'Key Takeaways',
    'Worked Example',
    'Correctness & Complexity',
    'Common Pitfalls',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.mom-tabs button')).toHaveCount(6)
  await expect(root.getByRole('button', { name: 'Visualization', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(root.locator('.tp-city-graph [role="button"]')).toHaveCount(5)
  await expect(root.locator('.tp-city-graph rect')).toHaveCount(10)
  await expect(root.locator('.tp-tree [role="button"]')).toHaveCount(8)
  await expect(root.locator('.tp-best-cost output')).toHaveText('40')
  await expect(root.locator('.tp-tour-cities')).toHaveText('1→2→4→5→3→1')
  await expect(root.locator('.tp-lower-result output')).toHaveText('38')
  await expect(root.locator('.tp-frontier-count')).toHaveText('2')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.tp-lesson-header', { x: 277, y: 58, width: 1394, height: 75 }],
      ['.mom-tabs', { x: 285, y: 133, width: 1372, height: 57 }],
      ['.tp-visual-heading', { x: 300, y: 216, width: 1342, height: 44 }],
      ['.tp-graph', { x: 300, y: 271, width: 398, height: 340 }],
      ['.tp-search-tree', { x: 710, y: 271, width: 586, height: 340 }],
      ['.tp-controls', { x: 1308, y: 271, width: 334, height: 144 }],
      ['.tp-incumbent', { x: 1308, y: 427, width: 334, height: 184 }],
      ['.tp-matrix', { x: 300, y: 623, width: 307, height: 204 }],
      ['.tp-calculator', { x: 619, y: 623, width: 511, height: 204 }],
      ['.tp-frontier', { x: 1142, y: 623, width: 500, height: 204 }],
      ['.tp-footer-grid', { x: 300, y: 839, width: 1342 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    for (const selector of ['.tp-incumbent', '.tp-calculator', '.tp-controls']) {
      const panel = root.locator(selector),
        box = await panel.boundingBox(),
        last = await panel
          .locator(selector === '.tp-incumbent' ? 'p:last-child' : selector === '.tp-calculator' ? 'tr:last-child' : 'button:last-child')
          .boundingBox()
      expect(last!.y + last!.height).toBeLessThanOrEqual(box!.y + box!.height)
    }
    expect(await root.getByRole('button', { name: 'Expand Next Node', exact: true }).evaluate((e) => getComputedStyle(e).color)).toBe('rgb(255, 255, 255)')
  }
  await page.screenshot({ path: `artifacts/visual-qa/tsp-021/${info.project.name}-visualization.png` })
})

test('021 rewind restores actual snapshots and reset returns to the root', async ({ page }) => {
  const root = page.locator('.tsp-branch-page')
  await root.getByRole('button', { name: 'Step Back', exact: true }).click()
  await expect(root.locator('.tp-tree [role="button"]')).toHaveCount(5)
  await expect(root.locator('.tp-lower-result output')).toHaveText('36')
  await expect(root.locator('.tp-live-message')).toContainText('Expand 1.')
  await root.getByRole('button', { name: 'Expand Next Node', exact: true }).click()
  await expect(root.locator('.tp-tree [role="button"]')).toHaveCount(8)
  await expect(root.locator('.tp-live-message')).toContainText('Expand 1 → 3.')
  await root.locator('.tp-controls').getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('.tp-tree [role="button"]')).toHaveCount(1)
  await expect(root.locator('.tp-frontier-count')).toHaveText('1')
  await expect(root.getByRole('button', { name: 'Step Back', exact: true })).toBeDisabled()
  await expect(root.locator('.tp-best-cost output')).toHaveText('40')
})

test('021 autoplay drains the priority frontier and certifies the feasible seed', async ({ page }) => {
  const root = page.locator('.tsp-branch-page')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByLabel('TSP playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByRole('button', { name: 'Auto Play', exact: true }).click()
  await expect(root.locator('.tp-live-message')).toContainText('Frontier empty: optimal tour cost 40 is proved', { timeout: 6000 })
  await expect(root.getByRole('button', { name: 'Expand Next Node', exact: true })).toBeDisabled()
  await expect(root.locator('.tp-incumbent')).toContainText('certified optimal')
  await expect(root.locator('.tp-frontier-count')).toHaveText('0')
})

test('021 bound and weight switches, keyboard nodes and city inspection work', async ({ page }) => {
  const root = page.locator('.tsp-branch-page')
  await root.getByLabel('Show edge weights', { exact: true }).uncheck()
  await expect(root.locator('.tp-city-graph rect')).toHaveCount(0)
  await root.getByLabel('Show edge weights', { exact: true }).check()
  await root.getByRole('button', { name: 'Inspect city 2 distances', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.tp-city-inspection')).toContainText('City 2 distances: 10, 0, 12, 9, 20')
  await root.getByRole('button', { name: 'Inspect TSP node 2: 1 → 3, lower bound 36', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.tp-lower-result output')).toHaveText('36')
  await expect(root.locator('.tp-city-inspection')).toHaveCount(0)
  await root.getByLabel('Select TSP bound node', { exact: true }).selectOption('3')
  await expect(root.locator('.tp-lower-result output')).toHaveText('44')
  await root.getByLabel('Show bound computation', { exact: true }).uncheck()
  await expect(root.locator('.tp-bound-hidden')).toContainText('Bound computation hidden')
  await root.getByLabel('Show bound computation', { exact: true }).check()
  await expect(root.locator('.tp-lower-result output')).toHaveText('44')
})

test('021 matrix edits enforce symmetry and solve a two-city tour from another source', async ({ page }) => {
  const root = page.locator('.tsp-branch-page')
  await root.getByRole('button', { name: 'Edit distance between cities 1 and 2', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit TSP matrix', exact: true })
  await dialog.getByLabel('TSP distance matrix rows', { exact: true }).fill('0, 5\n4, 0')
  await dialog.getByRole('button', { name: 'Apply matrix', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('symmetric matrix')
  await dialog.getByLabel('TSP distance matrix rows', { exact: true }).fill('0, 7\n7, 0')
  await dialog.getByLabel('TSP start city', { exact: true }).fill('2')
  await dialog.getByRole('button', { name: 'Apply matrix', exact: true }).click()
  await expect(root.locator('.tp-city-graph [role="button"]')).toHaveCount(2)
  await expect(root.locator('.tp-best-cost output')).toHaveText('14')
  await expect(root.locator('.tp-tour-cities')).toHaveText('2→1→2')
  await expect(root.locator('.tp-lower-result output')).toHaveText('14')
  await root.getByRole('button', { name: 'Expand Next Node', exact: true }).click()
  await expect(root.locator('.tp-live-message')).toContainText('optimal tour cost 14 is proved')
  await root.getByLabel('TSP example', { exact: true }).selectOption('four')
  await expect(root.locator('.tp-best-cost output')).toHaveText('80')
  await expect(root.locator('.tp-city-graph [role="button"]')).toHaveCount(4)
})

test('021 predictions and proof explain the correct arithmetic and pruning contract', async ({ page }) => {
  const root = page.locator('.tsp-branch-page')
  await root.getByRole('button', { name: 'Read the proof', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'TSP lower bound proof', exact: true })
  await expect(dialog).toContainText('10 + 9 + 7 + 6 + 6 = 38')
  await expect(dialog).toContainText('No required outgoing edge is omitted or counted twice')
  await page.keyboard.press('Escape')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted TSP lower bound', { exact: true }).fill('37')
  await root.getByRole('button', { name: 'Check lower bound', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Try again')
  await root.getByLabel('Predicted TSP lower bound', { exact: true }).fill('38')
  await root.getByRole('button', { name: 'Check lower bound', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct: 10 + 9 + 7 + 6 + 6 = 38')
  await root.getByLabel('Predicted TSP tour cost', { exact: true }).fill('40')
  await root.getByRole('button', { name: 'Check tour cost', exact: true }).click()
  await expect(root.getByRole('status').nth(1)).toContainText('Symmetry does not mean doubling')
  await root.getByRole('button', { name: 'No', exact: true }).click()
  await expect(root.getByRole('status').last()).toContainText('Correct. A feasible tour is an upper bound')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('If U is empty: LB = path_cost + distance(last, start)')
})

test('021 unseeded larger searches paginate every partial tour and disclose a focused preview', async ({ page }) => {
  const root = page.locator('.tsp-branch-page')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Edit matrix', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit TSP matrix', exact: true })
  const text = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => (i === j ? 0 : 1)).join(',')).join('\n')
  await dialog.getByLabel('TSP distance matrix rows', { exact: true }).fill(text)
  await dialog.getByRole('button', { name: 'Apply matrix', exact: true }).click()
  await root.getByLabel('Seed a nearest-neighbor tour', { exact: true }).uncheck()
  await root.getByLabel('TSP node budget', { exact: true }).selectOption('16383')
  for (let i = 0; i < 4; i++) await root.getByRole('button', { name: 'Process next node', exact: true }).click()
  await expect(root.locator('.tp-certificate')).toContainText('not yet proved')
  await expect(root.locator('.tp-all-nodes tbody tr')).toHaveCount(25)
  await root.getByRole('button', { name: 'Next nodes', exact: true }).click()
  await root.getByRole('button', { name: 'Inspect generated TSP node 25', exact: true }).click()
  await expect(root.locator('.tp-tree-caption')).toContainText('of 26 generated nodes')
  await expect(root.locator('.tp-lower-result output')).toHaveText('8')
  await expect(root.locator('.tp-best-cost output')).toHaveText('—')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('021 review progress, notes, search shortcut and dark mode remain usable', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 960 })
  const root = page.locator('.tsp-branch-page')
  await page.keyboard.press('Control+k')
  await expect(root.getByLabel('Search topics', { exact: true })).toBeFocused()
  await root.getByLabel('Search topics', { exact: true }).fill('knapsack')
  await expect(root.locator('.mom-search-results button').first()).toBeVisible()
  await root.getByLabel('Search topics', { exact: true }).fill('')
  await root.getByRole('button', { name: 'Mark Visualization reviewed', exact: true }).click()
  await expect(root.locator('.tp-section-progress')).toContainText('1 of 6 sections')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('TSP learning notes', { exact: true }).fill('Each remaining outgoing edge contributes once to a safe bound.')
  await root.getByRole('button', { name: 'Mark Notes reviewed', exact: true }).click()
  await page.reload()
  await expect(root.locator('.tp-section-progress')).toContainText('2 of 6 sections')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('TSP learning notes', { exact: true })).toHaveValue('Each remaining outgoing edge contributes once to a safe bound.')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/tsp-021/${info.project.name}-dark.png` })
})
