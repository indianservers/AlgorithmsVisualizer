import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/branch-and-bound/knapsack-best-first')
})

test('020 dashboard preserves every reference panel and derives consistent values', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.best-knapsack-page')
  for (const title of [
    'Algorithm Overview',
    'Problem Instance',
    'Current Best Solution (Incumbent)',
    'Search Tree Explorer',
    'Priority Frontier (Best-First Order)',
    'Fractional Knapsack Upper Bound',
    'Worked Example: Tracing the Best-First Search',
    'Capacity and Profit Progress',
    'Key Takeaways',
    'Complexity and Correctness',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.mom-tabs button')).toHaveCount(5)
  await expect(root.locator('.bk-stage')).toHaveCount(4)
  await expect(root.locator('.bk-instance tbody tr')).toHaveCount(4)
  await expect(root.locator('.bk-tree [role="button"]')).toHaveCount(7)
  await expect(root.locator('.bk-solution-stats output')).toHaveText('11')
  await expect(root.locator('.bk-solution-stats')).toContainText('[1, 2]')
  await expect(root.locator('.bk-bound-result')).toContainText('6 + (3/4) × 8 = 12')
  await expect(root.locator('.bk-frontier-count b')).toHaveText('1')
  await expect(root.locator('.bk-search-stats')).toContainText('7Total nodes3Expanded2Pruned1Solution')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/best-first-020/${info.project.name}-learn.png` })
  const layout = await root.locator('.bk-panel, .mom-hero, .mom-tabs').evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect()
      return { panel: element.className, x: box.x, y: box.y, width: box.width, height: box.height }
    }),
  )
  mkdirSync('artifacts/visual-qa/best-first-020', { recursive: true })
  writeFileSync(`artifacts/visual-qa/best-first-020/${info.project.name}-layout.json`, JSON.stringify(layout, null, 2))
  if (info.project.name === 'desktop') {
    const footer = await root.locator('.bk-correctness').boundingBox()
    expect(footer!.y + footer!.height, 'The final teaching panel fits the reference viewport').toBeLessThanOrEqual(941)
    for (const [selector, expected] of [
      ['.mom-hero', { x: 280, y: 61, width: 1383, height: 129 }],
      ['.mom-tabs', { x: 280, y: 200, height: 33 }],
      ['.bk-overview', { x: 280, y: 245, width: 625, height: 232 }],
      ['.bk-instance', { x: 911, y: 245, width: 371, height: 232 }],
      ['.bk-incumbent', { x: 1288, y: 245, width: 375, height: 232 }],
      ['.bk-tree-panel', { x: 280, y: 486, width: 641, height: 266 }],
      ['.bk-frontier', { x: 927, y: 486, width: 327, height: 266 }],
      ['.bk-upper-bound', { x: 1260, y: 486, width: 403, height: 266 }],
      ['.bk-worked', { x: 280, y: 761, width: 609, height: 171 }],
      ['.bk-progress', { x: 895, y: 761, width: 360, height: 171 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    for (const selector of ['.bk-overview', '.bk-incumbent', '.bk-takeaways', '.bk-correctness']) {
      const panel = root.locator(selector),
        bounds = await panel.boundingBox(),
        last = await panel
          .locator(selector === '.bk-overview' ? '.bk-stage:last-child' : selector === '.bk-takeaways' ? 'li:last-child' : 'p:last-child')
          .boundingBox()
      expect(last!.y + last!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height)
    }
  }
  await page.screenshot({ path: `artifacts/visual-qa/best-first-020/${info.project.name}-learn.png` })
})

test('020 processes the highest-bound node, handles stale frontier entries, and replays to completion', async ({ page }) => {
  const root = page.locator('.best-knapsack-page')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('.bk-solution-stats output')).toHaveText('0')
  await expect(root.locator('.bk-certificate')).toContainText('not yet proved')
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.bk-frontier-count b')).toHaveText('2')
  await expect(root.locator('.bk-solution-stats output')).toHaveText('6')
  await expect(root.locator('.bk-process').last()).toBeDisabled()
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.bk-frontier tbody tr').first()).toContainText('(2, 2, 6)')
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.bk-live-message')).toContainText('Expand node 4')
  await expect(root.locator('.bk-solution-stats output')).toHaveText('11')
  await expect(root.locator('.bk-certificate')).toContainText('Optimal profit 11 is proved')
  await expect(root.locator('.bk-frontier tbody tr').first()).toContainText('Pending prune')
  await root.getByLabel('Best-first playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Auto Play', exact: true }).click()
  await expect(root.locator('.bk-live-message')).toContainText('Frontier empty: optimal profit 11 is proved')
  await expect(root.getByRole('button', { name: 'Next Step', exact: true })).toBeDisabled()
})

test('020 tree bounds switch and keyboard inspection update the fractional calculation', async ({ page }) => {
  const root = page.locator('.best-knapsack-page')
  await root.getByLabel('Show tree bounds', { exact: true }).uncheck()
  await expect(root.locator('.bk-tree')).not.toContainText('b=')
  await root.getByLabel('Show tree bounds', { exact: true }).check()
  const node = root.getByRole('button', { name: 'Inspect best-first node 4: weight 2, profit 6, bound 11', exact: true })
  await node.focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.bk-bound-result')).toContainText('6 + 5 = 11')
  await expect(root.locator('.bk-upper-bound tbody tr').first()).toContainText('Fixed: taken')
  await root.getByRole('button', { name: 'Inspect best-first node 3: weight 6, profit 14, bound infeasible', exact: true }).click()
  await expect(root.locator('.bk-bound-result')).toHaveText('Infeasible: weight exceeds capacity')
  await expect(root.locator('.bk-solution-stats output')).toHaveText('11')
})

test('020 principles explain branching, bounds, queue policy and pruning', async ({ page }) => {
  const root = page.locator('.best-knapsack-page'),
    dialog = page.getByRole('dialog', { name: 'Best-first principle explanation', exact: true })
  for (const [stage, text] of [
    ['Branch', 'partition every possible'],
    ['Bound', 'relaxed feasible set'],
    ['Best-First', 'lower insertion ID'],
    ['Prune', 'strictly better'],
  ]) {
    await root.getByRole('button', { name: `Explore ${stage} principle`, exact: true }).click()
    await expect(dialog).toContainText(text)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  }
})

test('020 editable inputs validate and solve a new instance with original item IDs', async ({ page }) => {
  const root = page.locator('.best-knapsack-page')
  await root.getByRole('button', { name: 'Edit', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit best-first knapsack input', exact: true })
  await dialog.getByLabel('Best-first item weights', { exact: true }).fill('0, 2')
  await dialog.getByLabel('Best-first item profits', { exact: true }).fill('5, 8')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Weights must be integers')
  await dialog.getByLabel('Best-first item weights', { exact: true }).fill('5, 1, 2')
  await dialog.getByLabel('Best-first item profits', { exact: true }).fill('5, 10, 20')
  await dialog.getByLabel('Best-first capacity', { exact: true }).fill('3')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  await expect(root.locator('.bk-instance tbody tr').first().locator('td').first()).toHaveText('1')
  await expect(root.locator('.bk-upper-bound tbody tr').first().locator('td').first()).toHaveText('2')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Best-first playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Auto Play', exact: true }).click()
  await expect(root.locator('.bk-live-message')).toContainText('Frontier empty', { timeout: 6000 })
  await expect(root.locator('.bk-solution-stats output')).toHaveText('30')
  await expect(root.locator('.bk-solution-stats')).toContainText('[2, 3]')
})

test('020 prediction challenges explain wrong answers and the exact solution', async ({ page }) => {
  const root = page.locator('.best-knapsack-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted best-first root bound', { exact: true }).fill('13')
  await root.getByRole('button', { name: 'Check bound', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Try again')
  await root.getByLabel('Predicted best-first root bound', { exact: true }).fill('12')
  await root.getByRole('button', { name: 'Check bound', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct: 6 + (3/4) × 8 = 12')
  await root.getByRole('button', { name: 'Node 2: oldest', exact: true }).click()
  await expect(root.getByRole('status').nth(1)).toContainText('Reconsider')
  await root.getByRole('button', { name: 'Node 4: highest bound', exact: true }).click()
  await expect(root.getByRole('status').nth(1)).toContainText('Correct: node 4')
  await root.getByRole('button', { name: 'Prune', exact: true }).click()
  await expect(root.getByRole('status').last()).toContainText('Correct: prune it')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('extract_max_bound')
  await expect(root.locator('pre')).toContainText('rounded labels never decide pruning')
})

test('020 experiments inspect every generated node, accept 20 items, and save notes', async ({ page }) => {
  const root = page.locator('.best-knapsack-page')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Choose language', exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'Choose language', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
  await expect(root.locator('.bk-experiments tbody tr')).toHaveCount(7)
  await root.getByRole('button', { name: 'Inspect generated best-first node 5', exact: true }).click()
  await expect(root.getByRole('heading', { name: 'Selected Node Details', exact: true })).toBeVisible()
  await expect(root.locator('.bk-bound-result')).toContainText('11 = 11')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Edit input', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit best-first knapsack input', exact: true })
  await dialog.getByLabel('Best-first item weights', { exact: true }).fill(Array(20).fill(1).join(', '))
  await dialog.getByLabel('Best-first item profits', { exact: true }).fill(Array(20).fill(1).join(', '))
  await dialog.getByLabel('Best-first capacity', { exact: true }).fill('10')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  await root.getByLabel('Best-first node budget', { exact: true }).selectOption('16383')
  await root.getByRole('button', { name: 'Try zero capacity', exact: true }).click()
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.bk-live-message')).toContainText('Frontier empty: optimal profit 0 is proved')
  await root.getByLabel('Best-first knapsack notes', { exact: true }).fill('The queue orders nodes; the relaxation bounds completions.')
  await page.reload()
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(root.getByLabel('Best-first knapsack notes', { exact: true })).toHaveValue('The queue orders nodes; the relaxation bounds completions.')
})

test('020 dark mode and medium layout keep the dashboard usable', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 960 })
  const root = page.locator('.best-knapsack-page')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.bk-live-message')).toContainText('Frontier empty')
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.screenshot({ path: `artifacts/visual-qa/best-first-020/${info.project.name}-dark.png` })
})

test('020 larger searches paginate all nodes and disclose the focused tree preview', async ({ page }) => {
  const root = page.locator('.best-knapsack-page')
  await root.getByRole('button', { name: 'Edit', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit best-first knapsack input', exact: true })
  await dialog.getByLabel('Best-first item weights', { exact: true }).fill(Array(20).fill(1).join(','))
  await dialog.getByLabel('Best-first item profits', { exact: true }).fill(Array(20).fill(1).join(','))
  await dialog.getByLabel('Best-first capacity', { exact: true }).fill('10')
  await dialog.getByRole('button', { name: 'Apply input', exact: true }).click()
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  for (let i = 0; i < 32; i++) await root.getByRole('button', { name: 'Next Step', exact: true }).click()
  await expect(root.locator('.bk-certificate')).toContainText('not yet proved')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(root.locator('.bk-experiments tbody tr')).toHaveCount(25)
  await root.getByRole('button', { name: 'Next nodes', exact: true }).click()
  await root.getByRole('button', { name: 'Next nodes', exact: true }).click()
  await root.getByRole('button', { name: 'Inspect generated best-first node 64', exact: true }).click()
  await expect(root.locator('.bk-tree-caption')).toContainText('of 65 generated nodes')
  await expect(root.locator('.bk-tree-caption')).toBeVisible()
  await expect(root.getByRole('button', { name: 'Inspect best-first node 64: weight 5, profit 5, bound 10', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(root.locator('.bk-lab-summary')).toContainText('Selected Node Details')
})
