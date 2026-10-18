import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
  })
})

test('concept library offers lessons without institutional references', async ({ page }) => {
  await page.goto('/#/daa/syllabus-dashboard')
  await expect(page.getByRole('heading', { name: 'DAA Concept Library' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Core learning path' })).toBeVisible()
  await expect(page.getByText(/University|IIT Patna|Allahabad|JNTUH|Duke University|Official syllabus/i)).toHaveCount(0)
  await expect(page.locator('.daa-workspace a[href^="http"]')).toHaveCount(0)
  await page.getByLabel('Find topic').fill('Dijkstra')
  await expect(page.getByRole('rowheader', { name: /Dijkstra/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await expect(page).toHaveScreenshot('daa-concepts.png')
})

test('editable graph computes distances, validates negative input and saves a reloadable trace', async ({ page }) => {
  await page.goto('/#/graphs/dijkstra')
  await expect(page.getByRole('heading', { name: 'Dijkstra', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const input = {
    vertices: 3,
    directed: true,
    source: 0,
    edges: [
      { from: 0, to: 1, weight: 4 },
      { from: 1, to: 2, weight: 2 },
    ],
  }
  await page.getByText('Advanced: edit full JSON input', { exact: true }).click()
  await page.getByLabel('Problem input (JSON)').fill(JSON.stringify(input))
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await expect(page.locator('.daa-result')).toContainText('6')
  await expect(page.locator('.daa-state')).toHaveScreenshot('daa-weighted-graph.png')
  await page.getByRole('button', { name: 'Save experiment locally' }).click()
  await expect(page.getByRole('heading', { name: 'Saved experiments' })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByRole('button', { name: 'Load saved trace' }).click()
  await page.getByText('Advanced: edit full JSON input', { exact: true }).click()
  await expect(page.getByLabel('Problem input (JSON)')).toHaveValue(JSON.stringify(input, null, 2))
  await page.getByLabel('Problem input (JSON)').fill(JSON.stringify({ ...input, edges: [{ from: 0, to: 1, weight: -1 }] }))
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('non-negative')
  await expect(page.getByRole('heading', { name: 'Computed timeline' })).toHaveCount(0)
})

test('DP table, implementation and practice work at desktop and mobile sizes', async ({ page }) => {
  await page.goto('/#/dynamic-programming/longest-common-subsequence')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByLabel('DP Source / left string').fill('ABC')
  await page.getByLabel('DP Target / right string').fill('AC')
  await page.getByRole('button', { name: 'Run DP example', exact: true }).click()
  await page.getByRole('button', { name: 'Jump to solution', exact: true }).click()
  await expect(page.locator('.dp-solution')).toContainText('AC')
  await expect(page.locator('.dp-table')).toBeVisible()
  await expect(page.locator('.dp-table [data-status=path]')).not.toHaveCount(0)
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export DP trace' }).click()
  expect((await download).suggestedFilename()).toBe('longest-common-subsequence-trace.json')
  await page.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(page.locator('.dp-code pre')).toContainText('export function lcs')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.getByText('Reveal challenge reasoning', { exact: true }).click()
  await expect(page.getByText('A common substring is a different problem.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Mark as studied' }).click()
  await expect(page.getByRole('button', { name: 'Studied — undo', exact: false })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('theory pages explain reductions and greedy suites link to real algorithms', async ({ page }) => {
  await page.goto('/#/complexity-theory/three-sat-clique-reduction')
  await expect(page.getByRole('heading', { name: 'Worked Reduction: 3-SAT → Clique', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Visualization', exact: true })).toBeVisible()
  await expect(page.getByText('Forward:', { exact: false })).toBeVisible()
  await page.goto('/#/greedy/greedy-suite')
  await expect(page.getByLabel('Greedy suite concept')).toBeVisible()
  await page.getByRole('navigation', { name: 'Full greedy lessons' }).getByRole('link', { name: 'Fractional Knapsack', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Fractional Knapsack', exact: true, level: 1 })).toBeVisible()
})
