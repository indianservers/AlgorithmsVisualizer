import { test, expect } from '@playwright/test'

const branching = {
  vertices: 5,
  source: 0,
  directed: true,
  edges: [
    { from: 0, to: 1, weight: 2 },
    { from: 0, to: 2, weight: 6 },
    { from: 1, to: 3, weight: 5 },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.removeItem('algodrishti-traversal-view')
  })
})

for (const [id, mode] of [
  ['bfs-traversal', 'BFS'],
  ['dfs-traversal', 'DFS'],
  ['daa-bfs', 'BFS'],
  ['daa-dfs', 'DFS'],
]) {
  test(`${id} keeps graph view and offers explorer icons`, async ({ page }) => {
    await page.goto('/#/graphs/' + id)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    const explorer = page.getByRole('region', { name: `${mode} explorer icons visualization` })
    await expect(explorer).toBeVisible()
    await expect(page.locator('.explorer-node-label')).toHaveText(['0', '1', '2', '3', '4'])
    await expect(page.locator('.explorer-weight text')).toHaveText(['2', '6', '1', '5', '2', '1'])
    await expect(page.locator('.explorer-bridge[marker-end]')).toHaveCount(6)
    await expect(page.locator(mode === 'BFS' ? '.explorer-sonar' : '.explorer-lantern')).toBeVisible()
    await expect(page.locator('.explorer-ticket strong')).toHaveText(mode === 'BFS' ? ['1', '2'] : ['1', '2'])
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.locator('.explorer-island.current')).toHaveAttribute('data-node', '1')
    await page.getByRole('button', { name: 'Graph', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.locator('.explorer-island.current')).toHaveAttribute('data-node', '1')
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.locator('.explorer-current')).toHaveText('Expedition complete')
    await page.locator('.explorer-workbench').screenshot({ path: `test-results/explorer-${id}-${test.info().project.name}.png`, animations: 'disabled' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
}

test('DFS breadcrumbs follow the parent tree when changing branches', async ({ page }) => {
  await page.goto('/#/graphs/dfs-traversal')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByText('Advanced: edit full JSON input', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Problem input (JSON)', exact: true }).fill(JSON.stringify(branching))
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await page.getByRole('button', { name: 'Icons', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.explorer-breadcrumbs > span')).toHaveText('0 → 1 → 3')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.explorer-current')).toContainText('Backtrack → 2')
  await expect(page.locator('.explorer-breadcrumbs > span')).toHaveText('0 → 2')
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await expect(page.locator('.explorer-order')).toContainText('1 unreachable')
})
