import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/branch-and-bound/knapsack-fifo')
})

test('019 reference dashboard includes all learning components and coherent default values', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.fifo-knapsack-page')
  for (const heading of [
    'Problem Overview',
    'Items (Example Input)',
    'Branch and Bound Tree Explorer',
    'FIFO Queue (Frontier Order)',
    'Upper Bound Calculator',
    'Incumbent (Best Profit)',
    'Node Details',
    'Worked Example (Capacity 5)',
    'Key Takeaways',
    'Correctness',
    'Complexity Analysis',
    'Assumptions and Constraints',
  ])
    await expect(root.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root.locator('.mom-tabs button')).toHaveCount(5)
  await expect(root.locator('.fk-tree [role="button"]')).toHaveCount(7)
  await expect(root.locator('.fk-queue tbody tr')).toHaveCount(3)
  await expect(root.locator('.fk-incumbent output')).toHaveText('7')
  await expect(root.locator('.fk-equation')).toHaveText('UB = 3 + 4 = 7')
  await expect(root.locator('.fk-stats>div').last()).toContainText('Nodes Explored4')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  mkdirSync('artifacts/visual-qa/fifo-knapsack-019', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/fifo-knapsack-019/${info.project.name}-learn.png` })
  const layout = await root
    .locator('.fk-panel, .mom-hero, .mom-tabs')
    .evaluateAll((elements) => elements.map((element) => ({ className: element.className, ...element.getBoundingClientRect().toJSON() })))
  writeFileSync(`artifacts/visual-qa/fifo-knapsack-019/${info.project.name}-layout.json`, JSON.stringify(layout, null, 2))
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 296, y: 63, width: 1361, height: 120 }],
      ['.mom-tabs', { x: 296, y: 193, height: 36 }],
      ['.fk-overview', { x: 296, y: 238, width: 959, height: 109 }],
      ['.fk-items', { x: 296, y: 355, width: 339, height: 316 }],
      ['.fk-tree-panel', { x: 643, y: 355, width: 612, height: 316 }],
      ['.fk-queue', { x: 1263, y: 238, width: 394, height: 174 }],
      ['.fk-bound', { x: 1263, y: 421, width: 394, height: 250 }],
      ['.fk-footers', { x: 296, y: 860, width: 1361 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    for (const selector of ['.fk-details', '.fk-worked', '.fk-takeaways']) {
      const bounds = await root.locator(selector).boundingBox(),
        last = await root.locator(`${selector} ${selector === '.fk-details' ? 'dd:last-child' : 'li:last-child'}`).boundingBox()
      expect(last!.y + last!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height)
    }
    for (const panel of await root.locator('.fk-footers>.fk-panel').all()) {
      const bounds = await panel.boundingBox(),
        content = await panel.locator('li:last-child,p').last().boundingBox()
      expect(content!.y + content!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height)
    }
  }
  await page.screenshot({ path: `artifacts/visual-qa/fifo-knapsack-019/${info.project.name}-learn.png` })
})

test('019 FIFO step removes only the front node and keeps pruning consistent', async ({ page }) => {
  const root = page.locator('.fifo-knapsack-page')
  await root.getByRole('button', { name: 'Step Forward', exact: true }).click()
  await expect(root.locator('.fk-count b')).toHaveText('2')
  await expect(root.locator('.fk-queue tbody tr').first()).toContainText('(2, 3, 4)')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await expect(root.locator('.fk-live-message')).toContainText('Dequeue node 4')
  await expect(root.locator('.fk-live-message')).toContainText('6.75 ≤ incumbent 7')
  await root.getByLabel('FIFO playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Auto Play', exact: true }).click()
  await expect(root.locator('.fk-live-message')).toContainText('Queue empty: optimal profit 7 is proved.')
  await expect(root.getByRole('button', { name: 'Step Forward', exact: true })).toBeDisabled()
  await expect(root.locator('.fk-incumbent output')).toHaveText('7')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('.fk-count b')).toHaveText('1')
  await expect(root.locator('.fk-incumbent output')).toHaveText('0')
  await expect(root.locator('.fk-certificate')).toContainText('not yet proved')
})

test('019 node selection recalculates a real fractional fill and supports keyboard inspection', async ({ page }) => {
  const root = page.locator('.fifo-knapsack-page')
  const skip = root.getByRole('button', { name: 'Inspect node 2: (1, 0, 0), upper bound 6.5', exact: true })
  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.fk-equation')).toContainText('6.5')
  await expect(root.locator('.fk-fraction')).toHaveText('24')
  await expect(root.locator('.fk-details')).toContainText('Skipped item 1')
  await root.getByRole('button', { name: 'Computation Steps', exact: true }).click()
  await expect(root.locator('.fk-computation')).toContainText('Item 3: use 2/4 × profit 5.')
  await root.getByRole('button', { name: 'Explain fractional upper bound', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Fractional bound explanation', exact: true })
  await expect(dialog).toContainText('UB = 3 + 4 = 7')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('019 inputs validate, preserve original IDs after sorting, and run a custom example exactly', async ({ page }) => {
  const root = page.locator('.fifo-knapsack-page')
  await root.getByRole('button', { name: 'Edit knapsack input', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit knapsack input', exact: true })
  await dialog.getByLabel('Item weights', { exact: true }).fill('0, 1')
  await dialog.getByLabel('Item profits', { exact: true }).fill('5, 10')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Weights must be integers')
  await dialog.getByLabel('Item weights', { exact: true }).fill('5, 1, 2')
  await dialog.getByLabel('Item profits', { exact: true }).fill('5, 10, 20')
  await dialog.getByLabel('Knapsack capacity', { exact: true }).fill('3')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  await expect(root.locator('.fk-items tbody tr').first()).toContainText('2')
  await expect(root.locator('.fk-items tbody tr').first().locator('td').first()).toHaveText('2')
  await expect(root.locator('.fk-stats>div').nth(2)).toContainText('—')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('FIFO playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Auto Play', exact: true }).click()
  await expect(root.locator('.fk-live-message')).toContainText('Queue empty', { timeout: 6000 })
  await expect(root.locator('.fk-incumbent output')).toHaveText('30')
  await expect(root.locator('.fk-incumbent')).toContainText('items: {2, 3}')
})

test('019 predictions explain mistakes and correct bounds; code explains the actual policy', async ({ page }) => {
  const root = page.locator('.fifo-knapsack-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted upper bound', { exact: true }).fill('7.5')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Try again')
  await root.getByLabel('Predicted upper bound', { exact: true }).fill('6.5')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct: UB = 4 + (2/4) × 5 = 6.5')
  await root.getByRole('button', { name: 'Expand', exact: true }).click()
  await expect(root.getByRole('status').last()).toContainText('Reconsider')
  await root.getByRole('button', { name: 'Prune', exact: true }).click()
  await expect(root.getByRole('status').last()).toContainText('Correct. Prune')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('Q.pop_front()')
  await expect(root.locator('pre')).toContainText('never round before pruning')
})

test('019 overweight branches never become incumbents or display a numeric upper bound', async ({ page }) => {
  const root = page.locator('.fifo-knapsack-page')
  await root.getByRole('button', { name: 'Edit knapsack input', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit knapsack input', exact: true })
  await dialog.getByLabel('Item weights', { exact: true }).fill('3, 4')
  await dialog.getByLabel('Item profits', { exact: true }).fill('6, 7')
  await dialog.getByLabel('Knapsack capacity', { exact: true }).fill('5')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  for (let i = 0; i < 2; i++) await root.getByRole('button', { name: 'Step Forward', exact: true }).click()
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Inspect generated node 3', exact: true }).click()
  await expect(root.locator('.fk-equation')).toHaveText('Infeasible: weight > capacity')
  await expect(root.locator('.fk-bound-tip')).toContainText('will be pruned when dequeued')
  await expect(root.locator('.fk-incumbent output')).toHaveText('6')
  await expect(root.locator('.fk-details')).toContainText('No (overweight)')
})

test('019 experiments inspect generated nodes, handle zero capacity, and persist learning notes', async ({ page }) => {
  const root = page.locator('.fifo-knapsack-page')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Choose language', exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'Choose language', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
  await expect(root.locator('.fk-node-table tbody tr')).toHaveCount(7)
  await root.getByRole('button', { name: 'Inspect generated node 4', exact: true }).click()
  await expect(root.locator('.fk-equation')).toContainText('6.75')
  await expect(root.locator('.fk-lab-summary')).toContainText('will be pruned when it reaches the front')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByLabel('FIFO node budget', { exact: true }).selectOption('16383')
  await root.getByRole('button', { name: 'Try zero capacity', exact: true }).click()
  await root.getByRole('button', { name: 'Process next node', exact: true }).click()
  await expect(root.locator('.fk-live-message')).toContainText('Queue empty: optimal profit 0 is proved')
  await root.getByLabel('Knapsack learning notes', { exact: true }).fill('A fractional relaxation allows every integral choice.')
  await page.reload()
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(root.getByLabel('Knapsack learning notes', { exact: true })).toHaveValue('A fractional relaxation allows every integral choice.')
})

test('019 remains usable at medium width and in dark mode', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 960 })
  const root = page.locator('.fifo-knapsack-page')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await expect(root.getByRole('heading', { name: 'FIFO Search Laboratory', exact: true })).toBeVisible()
  await root.getByRole('button', { name: 'Step Forward', exact: true }).click()
  await expect(root.locator('.fk-live-message')).toContainText('Dequeue node 4')
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  const originalViewport = page.viewportSize()!
  for (const width of info.project.name === 'desktop' ? [1672, 1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 941 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await expect(root.getByRole('button', { name: 'Step Forward', exact: true })).toBeVisible()
  }
  await page.setViewportSize(originalViewport)
  await page.screenshot({ path: `artifacts/visual-qa/fifo-knapsack-019/${info.project.name}-dark.png` })
})
