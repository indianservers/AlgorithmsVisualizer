import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/branch-and-bound/branch-bound-method')
})

test('022 keeps panel styles after visiting Boyer Moore and returning', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Desktop reference geometry.')
  const styles = (selector: string) =>
    page.locator(selector).evaluateAll((elements) =>
      elements.map((element) => {
        const s = getComputedStyle(element)
        return [s.width, s.height, s.background, s.padding, s.fontSize]
      }),
    )
  const before = await styles('.bound-method-page .bm-panel, .bound-method-page .bm-icon')
  await page.locator('.sidebar-category-toggle').filter({ hasText: 'DAA Extensions' }).click()
  await page.locator('.sidebar-algorithm[href="/daa-extensions/boyer-moore"]').click()
  await expect(page.locator('.boyer-moore-page')).toBeVisible()
  const boyerBefore = await styles('.boyer-moore-page .bm-panel, .boyer-moore-page .bm-icon')
  await page.locator('.sidebar-category-toggle').filter({ hasText: 'Branch and Bound' }).click()
  await page.locator('.sidebar-algorithm[href="/branch-and-bound/branch-bound-method"]').click()
  await expect(page.locator('.bound-method-page')).toBeVisible()
  expect(await styles('.bound-method-page .bm-panel, .bound-method-page .bm-icon')).toEqual(before)
  await page.locator('.sidebar-category-toggle').filter({ hasText: 'DAA Extensions' }).click()
  await page.locator('.sidebar-algorithm[href="/daa-extensions/boyer-moore"]').click()
  await expect(page.locator('.boyer-moore-page')).toBeVisible()
  expect(await styles('.boyer-moore-page .bm-panel, .boyer-moore-page .bm-icon')).toEqual(boyerBefore)
})

test('022 dashboard includes all reference components and a coherent default tree', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.bound-method-page')
  await expect(root.getByRole('heading', { name: 'Branch and Bound: Method and Bounds', exact: true, level: 1 })).toBeVisible()
  for (const title of [
    'Interactive Visualization',
    'Branching Search Tree',
    'Incumbent vs Optimistic Bound',
    'Pruning Rule Examples',
    'Search Order Comparison',
    'Key Takeaways',
    'Worked Examples',
    'Correctness & Complexity',
    'Common Pitfalls',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.mom-tabs button')).toHaveCount(6)
  await expect(root.locator('.bm-tree-svg [role="button"]')).toHaveCount(7)
  await expect(root.locator('.bm-rule-card')).toHaveCount(2)
  await expect(root.locator('.bm-order-card')).toHaveCount(2)
  await expect(root.locator('.bm-tree-svg')).toContainText('UB = 16')
  await expect(root.locator('.bm-tree-svg')).toContainText('Prunable')
  await expect(root.locator('.bm-bound-chart')).toHaveAttribute('aria-label', 'Upper bound 16; feasible incumbent 12')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  mkdirSync('artifacts/visual-qa/bound-method-022', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/bound-method-022/${info.project.name}-visualization.png` })
  const layout = await root
    .locator('.bm-panel, .bm-lesson-header, .bm-rule-card, .bm-order-grid')
    .evaluateAll((elements) => elements.map((element) => ({ className: element.className, ...element.getBoundingClientRect().toJSON() })))
  writeFileSync(`artifacts/visual-qa/bound-method-022/${info.project.name}-layout.json`, JSON.stringify(layout, null, 2))
  if (info.project.name === 'desktop') {
    expect(await root.locator('.bm-visual-heading p').evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    for (const [selector, expected] of [
      ['.bm-lesson-header', { x: 284, y: 56, width: 1373, height: 78 }],
      ['.mom-tabs', { x: 284, y: 134, width: 1373, height: 55 }],
      ['.bm-visualization', { x: 284, y: 202, width: 1373, height: 537 }],
      ['.bm-tree-panel', { x: 296, y: 272, width: 455, height: 459 }],
      ['.bm-bound-panel', { x: 760, y: 272, width: 358, height: 459 }],
      ['.bm-rules-panel', { x: 1127, y: 272, width: 518, height: 459 }],
      ['.bm-rule-card', { x: 1140, y: 332, height: 194 }],
      ['.bm-order-grid', { x: 1140, y: 584, height: 145 }],
      ['.bm-footer-grid', { x: 290, y: 745, width: 1365 }],
    ] as const) {
      const box = await root.locator(selector).first().boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    for (const panel of await root.locator('.bm-footer-grid>.bm-panel').all()) {
      const box = await panel.boundingBox(),
        last = await panel.locator('li:last-child,button:last-child').last().boundingBox()
      expect(last!.y + last!.height).toBeLessThanOrEqual(box!.y + box!.height)
    }
    const order = await root.locator('.bm-order-grid').boundingBox(),
      panel = await root.locator('.bm-rules-panel').boundingBox()
    expect(order!.y + order!.height).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
  await page.screenshot({ path: `artifacts/visual-qa/bound-method-022/${info.project.name}-visualization.png` })
})

test('022 mode switch reverses the bound and pruning direction with a valid minimization example', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.getByLabel('Branch and bound problem type', { exact: true }).selectOption('min')
  await expect(root.locator('.bm-tree-svg')).toContainText('LB = 60')
  await expect(root.locator('.bm-bound-chart')).toHaveAttribute('aria-label', 'Lower bound 60; feasible incumbent 80')
  await expect(root.locator('.bm-bound-tip')).toContainText('If LB ≥ incumbent')
  await root.getByRole('button', { name: 'Show complete best-first order', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Complete structural search order', exact: true })
  await expect(dialog.locator('.bm-complete-order')).toHaveText('1 → 2 → 4 → 3 → 7 → 5 → 6')
  await page.keyboard.press('Escape')
  await root.getByLabel('Branch and bound problem type', { exact: true }).selectOption('max')
  await expect(root.locator('.bm-bound-chart')).toHaveAttribute('aria-label', 'Upper bound 16; feasible incumbent 12')
})

test('022 tree selection explains pruned and unreached nodes and visual switches do not alter search', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.getByLabel('Show bounds', { exact: true }).uncheck()
  await expect(root.locator('.bm-tree-svg')).not.toContainText('UB =')
  await root.getByLabel('Show bounds', { exact: true }).check()
  await root.getByRole('button', { name: 'Inspect method node 5, value 10, UB 11', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.bm-bound-chart')).toHaveAttribute('aria-label', 'Upper bound 11; feasible incumbent 12')
  await root.getByRole('button', { name: 'Explain selected bound and incumbent', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Method node and bound details', exact: true })
  await expect(dialog).toContainText('11 ≤ 12')
  await expect(dialog).toContainText('Actual search status: pruned')
  await page.keyboard.press('Escape')
  await root.getByRole('button', { name: 'Inspect method node 6, value 8, UB 9', exact: true }).click()
  await root.getByRole('button', { name: 'Explain selected bound and incumbent', exact: true }).click()
  await expect(dialog).toContainText('ancestor node 3 was pruned')
  await page.keyboard.press('Escape')
  await root.getByLabel('Show prune decisions', { exact: true }).uncheck()
  await expect(root.locator('.bm-tree-svg')).not.toContainText('Prunable')
  await expect(root.locator('.bm-bound-chart')).toHaveAttribute('aria-label', 'Upper bound 9; feasible incumbent 12')
})

test('022 independent pruning-rule inputs update both inequalities and validate numbers', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.getByLabel('Maximization upper bound', { exact: true }).fill('8')
  await expect(root.locator('.bm-rule-max')).toContainText('Since 8 > 7, keep this node')
  await root.getByLabel('Maximization feasible incumbent', { exact: true }).fill('8')
  await expect(root.locator('.bm-rule-max')).toContainText('Since 8 ≤ 8, prune this node')
  await root.getByLabel('Minimization lower bound', { exact: true }).fill('70')
  await expect(root.locator('.bm-rule-min')).toContainText('Since 70 < 80, keep this node')
  await root.getByLabel('Minimization feasible incumbent', { exact: true }).fill('60')
  await expect(root.locator('.bm-rule-min')).toContainText('Since 70 ≥ 60, prune this node')
  await root.getByLabel('Maximization upper bound', { exact: true }).fill('')
  await expect(root.locator('.bm-rule-max')).toContainText('Use integers from 0 to 999')
  await expect(root.locator('.bm-bound-chart')).toHaveAttribute('aria-label', 'Upper bound 16; feasible incumbent 12')
})

test('022 structural-order replay visits exactly that order and supports undo', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.getByRole('button', { name: 'Show complete best-first order', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Complete structural search order', exact: true })
  await expect(dialog.locator('.bm-complete-order')).toHaveText('1 → 2 → 3 → 4 → 5 → 7 → 6')
  await dialog.getByRole('button', { name: 'Replay this order', exact: true }).click()
  await expect(root.getByLabel('Enable safe pruning', { exact: true })).not.toBeChecked()
  await expect(root.getByLabel('Method feasible seed', { exact: true })).toHaveValue('none')
  for (let i = 0; i < 3; i++) await root.getByRole('button', { name: 'Process next node', exact: true }).click()
  await expect(root.locator('.bm-experiments')).toContainText('Processed: 1 → 2 → 3')
  await root.getByRole('button', { name: 'Step Back', exact: true }).click()
  await expect(root.locator('.bm-experiments')).toContainText('Processed: 1 → 2.')
  for (let i = 0; i < 5; i++) await root.getByRole('button', { name: 'Process next node', exact: true }).click()
  await expect(root.locator('.bm-live-message')).toContainText('Frontier empty: optimal terminal value 12 is proved')
  await expect(root.locator('.bm-experiments')).toContainText('Processed: 1 → 2 → 3 → 4 → 5 → 7 → 6')
  await expect(root.getByRole('button', { name: 'Process next node', exact: true })).toBeDisabled()
})

test('022 unsafe bounds are rejected and a changed finite example can be repaired and solved', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Edit values and bounds', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit method example', exact: true })
  await dialog.getByLabel('Method node bounds', { exact: true }).fill('16,14,7,12,11,9,11')
  await dialog.getByRole('button', { name: 'Apply verified example', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Unsafe bound at node 3')
  await dialog.getByLabel('Method node values', { exact: true }).fill('0,10,8,20,10,8,7')
  await dialog.getByRole('button', { name: 'Use tight safe bounds', exact: true }).click()
  await expect(dialog.getByLabel('Method node bounds', { exact: true })).toHaveValue('20, 20, 8, 20, 10, 8, 7')
  await expect(dialog).toContainText('enumerating the four known terminal solutions')
  await dialog.getByLabel('Edited method feasible seed', { exact: true }).selectOption('none')
  await dialog.getByRole('button', { name: 'Apply verified example', exact: true }).click()
  for (let i = 0; i < 3; i++) await root.getByRole('button', { name: 'Process next node', exact: true }).click()
  await expect(root.locator('.bm-live-message')).toContainText('Incumbent is 20')
  await expect(root.locator('.bm-certificate')).toContainText('Optimal terminal value 20 is certified')
  await root.getByRole('button', { name: 'Inspect potential method node 7', exact: true }).click()
  const details = page.getByRole('dialog', { name: 'Method node and bound details', exact: true })
  await expect(details).toContainText('Value 7 is a complete terminal objective')
})

test('022 prediction challenges separate incumbent feasibility, pruning and selection', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByRole('button', { name: 'Keep', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Reconsider')
  await root.getByRole('button', { name: 'Prune', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct: 11 ≤ 12')
  await root.getByLabel('Predicted best-first method node', { exact: true }).fill('3')
  await root.getByRole('button', { name: 'Check next node', exact: true }).click()
  await expect(root.getByRole('status').nth(1)).toContainText('Try again')
  await root.getByLabel('Predicted best-first method node', { exact: true }).fill('4')
  await root.getByRole('button', { name: 'Check next node', exact: true }).click()
  await expect(root.getByRole('status').nth(1)).toContainText('Correct: node 4')
  await root.getByRole('button', { name: 'No', exact: true }).click()
  await expect(root.getByRole('status').last()).toContainText('Only an actual feasible 0/1 subset')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('prune if UB ≤ incumbent')
  await expect(root.locator('pre')).toContainText('prune if LB ≥ incumbent')
})

test('022 reviewed sections, saved notes, search shortcut and dark mode work responsively', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 960 })
  const root = page.locator('.bound-method-page')
  await page.keyboard.press('Control+k')
  await expect(root.getByLabel('Search topics', { exact: true })).toBeFocused()
  await root.getByLabel('Search topics', { exact: true }).fill('knapsack')
  await expect(root.locator('.mom-search-results button').first()).toBeVisible()
  await root.getByLabel('Search topics', { exact: true }).fill('')
  await root.getByRole('button', { name: 'Mark Visualization reviewed', exact: true }).click()
  await expect(root.locator('.bm-section-progress')).toContainText('1 of 6 sections')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Choose language', exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'Choose language', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
  await root.getByLabel('Branch and bound method notes', { exact: true }).fill('A bound promises; a feasible solution witnesses.')
  await root.getByRole('button', { name: 'Mark Notes reviewed', exact: true }).click()
  await page.reload()
  await expect(root.locator('.bm-section-progress')).toContainText('2 of 6 sections')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Branch and bound method notes', { exact: true })).toHaveValue('A bound promises; a feasible solution witnesses.')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/bound-method-022/${info.project.name}-dark.png` })
})

test('022 worked examples open their interactive algorithm lessons', async ({ page }) => {
  const root = page.locator('.bound-method-page')
  await root.locator('.bm-worked>button').first().click()
  await expect(page).toHaveURL(/knapsack-fifo$/)
  await expect(page.locator('.fifo-knapsack-page')).toBeVisible()
  await page.goto('/branch-and-bound/branch-bound-method')
  await root.locator('.bm-worked>button').nth(1).click()
  await expect(page).toHaveURL(/tsp-branch-and-bound$/)
  await expect(page.locator('.tsp-branch-page')).toBeVisible()
})
