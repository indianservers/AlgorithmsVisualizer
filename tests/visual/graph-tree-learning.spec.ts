import { expect, test } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { isTreeLearningModule } from '../../src/learning/treeModel'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
})

for (const module of allModules.filter(isTreeLearningModule))
  test(`tree workshop: ${module.id}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/#/data-structures/${module.id}`)
    const studio = page.locator('.tree-academy')
    await expect(studio).toBeVisible()
    await expect(studio.getByRole('heading', { name: 'Worked example', exact: true })).toBeVisible()
    await expect(studio.getByRole('heading', { name: 'Rule to preserve' })).toBeVisible()
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(studio.getByRole('img')).toBeVisible()
    await studio.getByRole('button', { name: 'Replay', exact: true }).click()
    const next = studio.getByRole('button', { name: 'Next tree step' })
    if (await next.isEnabled()) {
      await next.click()
      await expect(studio.locator('.ls-trace h3')).toContainText('Step 2')
    }
    expect(errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })

test('BST supports custom keys, traversal, search and deletion', async ({ page }) => {
  await page.goto('/#/data-structures/binary-search-tree-operations')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.tree-academy')
  await studio.getByLabel('Tree example input').fill('8,3,10,1,6')
  await studio.getByRole('button', { name: 'Build example' }).click()
  await studio.getByLabel('Traversal order', { exact: true }).selectOption('inorder')
  await studio.getByRole('button', { name: 'Trace traversal' }).click()
  await studio.getByLabel('Tree timeline').press('End')
  await expect(studio.locator('.ls-output')).toHaveText('1 → 3 → 6 → 8 → 10')
  await studio.getByLabel('Key', { exact: true }).fill('3')
  await studio.getByRole('button', { name: 'Delete key' }).click()
  await studio.getByLabel('Tree timeline').press('End')
  await expect(studio.getByRole('button', { name: 'Inspect node 3', exact: true })).toHaveCount(0)
  await studio.getByRole('button', { name: 'Search key' }).click()
  await studio.getByLabel('Tree timeline').press('End')
  await expect(studio.locator('.ls-trace')).toContainText('is absent')
  await studio.getByLabel('Tree example input').fill('1, not-a-number')
  await studio.getByRole('button', { name: 'Build example' }).click()
  await expect(studio.getByRole('alert')).toContainText('finite numbers')
})

test('range and expression workshops compute user examples', async ({ page }) => {
  await page.goto('/#/data-structures/segment-tree')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.tree-academy')
  await studio.getByLabel('Tree example input').fill('2,4,6,8')
  await studio.getByRole('button', { name: 'Build example' }).click()
  await studio.getByRole('button', { name: 'Query range' }).click()
  await studio.getByLabel('Tree timeline').press('End')
  await expect(studio.locator('.ls-trace')).toContainText('= 18')
  await page.goto('/#/data-structures/expression-trees')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await studio.getByLabel('Tree example input').fill('3+5*2')
  await studio.getByRole('button', { name: 'Build example' }).click()
  await studio.getByLabel('Tree timeline').press('End')
  await expect(studio.locator('.ls-trace')).toContainText('= 13')
})

for (const [category, id] of [
  ['graphs', 'bfs-traversal'],
  ['graphs', 'dijkstra'],
  ['graphs', 'bellman-ford'],
  ['graphs', 'prim'],
  ['graphs', 'kosaraju-scc'],
  ['daa-extensions', 'bridges'],
  ['daa-extensions', 'edmonds-karp'],
  ['backtracking', 'graph-coloring'],
])
  test(`graph explorer: ${id}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/#/${category}/${id}`)
    await page.getByRole('button', { name: 'Learn', exact: true }).click()
    const studio = page.locator('.graph-academy')
    await expect(studio.getByRole('heading', { name: 'Weighted adjacency matrix' })).toBeVisible()
    await expect(studio.getByRole('img')).toBeVisible()
    await studio.getByRole('button', { name: 'Next graph step' }).click()
    await expect(studio.locator('.ls-trace h3')).toContainText('Step 2')
    await studio.getByRole('button', { name: 'Inspect vertex 1', exact: true }).click()
    await expect(studio.locator('.ls-inspector')).toContainText('Vertex 1')
    expect(errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })

test('graph edits invalidate old traces, recompute and compare the same input', async ({ page }) => {
  await page.goto('/#/graphs/bfs-traversal')
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  const studio = page.locator('.graph-academy')
  await studio.getByLabel('Graph learning example').selectOption('disconnected')
  await expect(studio.getByRole('button', { name: 'Next graph step' })).toBeDisabled()
  await studio.getByRole('button', { name: 'Run edited graph' }).click()
  await studio.getByLabel('Graph lab timeline').press('End')
  await expect(studio.locator('.ls-trace')).toContainText('Complete')
  await studio.getByLabel('From vertex').fill('2')
  await studio.getByLabel('To vertex').fill('3')
  await studio.getByRole('button', { name: 'Add edge', exact: true }).click()
  await expect(studio.getByRole('button', { name: 'Next graph step' })).toBeDisabled()
  await studio.getByRole('button', { name: 'Run edited graph' }).click()
  await studio.getByLabel('Comparison graph algorithm').selectOption('daa-dfs')
  await studio.getByRole('button', { name: 'Compare graph results' }).click()
  await expect(studio.locator('.ls-comparison')).toContainText('Depth-First Search')
  await expect(studio.locator('.ls-comparison article')).toHaveCount(2)
})

test('captures graph and tree learning layouts', async ({ page }, testInfo) => {
  for (const [route, label] of [
    ['data-structures/avl-tree-rotations', 'avl'],
    ['graphs/dijkstra', 'graph'],
  ]) {
    await page.goto(`/#/${route}`)
    await page.getByRole('button', { name: label === 'avl' ? 'Visualization' : 'Learn', exact: true }).click()
    await page.locator('.learning-studio').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `artifacts/learning-studio/${testInfo.project.name}-${label}.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})

test('tree learning tabs preserve input, save examples and compare real shapes', async ({ page }) => {
  await page.goto('/#/data-structures/binary-search-tree-operations')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.tree-academy')
  await studio.getByLabel('Tree example input').fill('1,2,3,4,5,6,7')
  await studio.getByRole('button', { name: 'Build example' }).click()
  await studio.getByText('Compare BST and AVL with these keys', { exact: true }).click()
  await expect(studio.locator('.ls-snapshot').first()).toContainText('7 occupied levels')
  await expect(studio.locator('.ls-snapshot').last()).toContainText('3 occupied levels')
  await page.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(studio.locator('.ls-code-guide')).toContainText('inorder successor')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await studio.getByRole('button', { name: 'Save tree input' }).click()
  await expect(studio.getByRole('status')).toContainText('saved')
  await page.reload()
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await studio.getByRole('button', { name: 'Load tree example 1', exact: true }).click()
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await expect(studio.getByLabel('Tree example input')).toHaveValue('1, 2, 3, 4, 5, 6, 7')
  await expect(page.locator('.bottom-panel .log-list')).toHaveCount(0)
})

test('graph suite keeps its topic and offers the relevant algorithms', async ({ page }) => {
  await page.goto('/#/graphs/graph-shortest-paths-suite')
  await expect(page.locator('.graph-suite-layout')).toContainText('Graph Shortest Paths Suite')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByLabel('Graph suite algorithm').selectOption('bellman-ford')
  await expect(page.locator('.graph-academy .ls-chip')).toHaveText('Bellman–Ford')
  await page.goto('/#/graphs/prerequisite-graph')
  await expect(page.locator('.graph-suite-layout')).toContainText('conflicting prerequisites')
  await expect(page.getByLabel('Graph suite algorithm')).toHaveValue('kahn-topological-sort')
})

test('tree studio supports keyboard operations and dark theme without overflow', async ({ page }, testInfo) => {
  await page.goto('/#/data-structures/avl-tree-rotations')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.tree-academy')
  await studio.getByRole('button', { name: 'Replay', exact: true }).click()
  await studio.getByRole('button', { name: 'Next tree step' }).focus()
  await page.keyboard.press('Space')
  await expect(studio.locator('.ls-trace h3')).toContainText('Step 2')
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click()
  await expect(page.locator('[data-theme=dark]')).not.toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/learning-studio/${testInfo.project.name}-tree-dark.png`, fullPage: true })
})
