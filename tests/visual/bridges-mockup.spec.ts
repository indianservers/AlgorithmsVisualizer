import { test, expect, type Page } from '@playwright/test'
import { bridgeExample } from '../../src/daa/bridgeLessonModel'
const root = (p: Page) => p.locator('.bridges-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close bridge dialog').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/bridges')
  await expect(root(page)).toBeVisible()
})
test('030 includes all reference components, exact desktop anchors and computed low-link values', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const heading of [
    'Interactive Visualization',
    'Graph G (original)',
    'DFS Traversal Order',
    'Node Details',
    'Low-link Values Table',
    'Edges Classification',
    'Key Takeaways',
    'Worked Example',
    'Correctness & Complexity',
    'Common Mistakes',
  ])
    await expect(root(page).getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root(page).locator('.br-vertex')).toHaveCount(6)
  await expect(root(page).locator('[data-bridge-edge]')).toHaveCount(7)
  await expect(root(page).locator('.br-bridge-edge')).toHaveCount(1)
  await expect(root(page).locator('.br-bridge-edge')).toHaveAttribute('data-bridge-edge', '3')
  await expect(root(page).locator('.br-playback')).toContainText('Step 6 / 14')
  await expect(root(page).locator('.br-values-table tbody tr').nth(2).locator('td')).toHaveText(['3', '2', '0', '2'])
  await expect(root(page).locator('.br-details-panel')).toContainText('Yes')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.br-lesson-header', { x: 247, y: 52, width: 1412, height: 73 }],
      ['.mom-tabs', { x: 251, y: 125, width: 1408, height: 52 }],
      ['.br-original-panel', { x: 264, y: 252, width: 546, height: 431 }],
      ['.br-traversal-panel', { x: 820, y: 252, width: 290, height: 431 }],
      ['.br-details-panel', { x: 1120, y: 252, width: 240, height: 431 }],
      ['.br-table-panel', { x: 1370, y: 252, width: 276, height: 265 }],
      ['.br-classification-panel', { x: 1370, y: 527, width: 276, height: 162 }],
      ['.br-footer-grid', { x: 260, y: 701, width: 1388, height: 208 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
})
test('030 timeline selection and playback expose the evolving discovery and low-link values', async ({ page }) => {
  await root(page).getByRole('button', { name: 'DFS step 1: Start DFS at vertex 1', exact: true }).click()
  await expect(button(page, 'Previous DFS step')).toBeDisabled()
  await expect(root(page).locator('.br-values-table tbody tr').nth(1).locator('td')).toHaveText(['2', '—', '—', '—'])
  await button(page, 'Next DFS step').click()
  await expect(root(page).locator('.br-values-table tbody tr').nth(1).locator('td')).toHaveText(['2', '1', '1', '1'])
  await tab(page, 'Experiments')
  await root(page).getByLabel('DFS playback speed', { exact: true }).selectOption('100')
  await tab(page, 'Visualization')
  await button(page, 'Play DFS playback').click()
  await expect(button(page, 'Next DFS step')).toBeDisabled()
  await expect(button(page, 'Play DFS playback')).toBeVisible()
  await expect(root(page).locator('.br-values-table tbody tr').last().locator('td')).toHaveText(['6', '5', '2', '5'])
  await expect(root(page).locator('.br-bridge-edge')).toHaveCount(1)
})
test('030 graph, table, child and previous/next controls select actual node details', async ({ page }) => {
  await button(page, 'Inspect DFS vertex 4').click()
  await expect(root(page).getByLabel('DFS vertex details')).toHaveValue('4')
  await expect(root(page).locator('.br-details-panel dd').nth(3)).toHaveText('3')
  await button(page, 'Previous DFS vertex').click()
  await expect(root(page).getByLabel('DFS vertex details')).toHaveValue('3')
  await button(page, 'Inspect DFS child 5').click()
  await expect(root(page).getByLabel('DFS vertex details')).toHaveValue('5')
  await button(page, 'Next DFS vertex').click()
  await expect(root(page).getByLabel('DFS vertex details')).toHaveValue('6')
  await button(page, 'Inspect low-link vertex 2').click()
  await expect(root(page).getByLabel('DFS vertex details')).toHaveValue('2')
  await expect(root(page).locator('.br-values-table .br-selected-row')).toContainText('2')
})
test('030 toggles graph annotations and distinguishes final preview from selected-step values', async ({ page }) => {
  await root(page).getByLabel('Show vertex labels', { exact: true }).uncheck()
  await expect(root(page).locator('.br-vertex-label')).toHaveCount(0)
  await root(page).getByLabel('Show values (tin/low)', { exact: true }).uncheck()
  await expect(root(page).locator('.br-value-chip')).toHaveCount(0)
  await root(page).getByLabel('Show vertex labels', { exact: true }).check()
  await root(page).getByLabel('Show values (tin/low)', { exact: true }).check()
  await expect(root(page).locator('.br-value-chip')).toHaveCount(6)
  await tab(page, 'Experiments')
  await root(page).getByLabel('Preview final values while reviewing', { exact: true }).uncheck()
  await tab(page, 'Visualization')
  await expect(root(page).locator('.br-values-table tbody tr').nth(4).locator('td').nth(1)).toHaveText('—')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Preview final values while reviewing', { exact: true }).check()
  await tab(page, 'Visualization')
  await expect(root(page).locator('.br-values-table tbody tr').nth(4).locator('td').nth(1)).toHaveText('4')
})
test('030 removal tests confirm a bridge, preserve parallel edges and allow rerunning the changed graph', async ({ page }) => {
  await button(page, 'Inspect graph edge 4: 3 to 4').click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('before removal: 1. Components after removal: 2')
  await expect(page.getByRole('dialog')).toContainText('{1, 2, 3, 5, 6} | {4}')
  await button(page, 'Remove edge and rerun DFS').click()
  await expect(root(page).locator('[data-bridge-edge]')).toHaveCount(6)
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('2 connected component(s); 0 bridge')
  await tab(page, 'Visualization')
  await root(page).getByLabel('Bridge graph example', { exact: true }).selectOption('parallel')
  const parallelArc = button(page, 'Inspect graph edge 1: 1 to 2').locator('path').last()
  await parallelArc.scrollIntoViewIfNeeded()
  const midpoint = await parallelArc.evaluate((el) => {
    const path = el as SVGPathElement,
      point = path.getPointAtLength(path.getTotalLength() / 2),
      screen = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()!)
    return { x: screen.x, y: screen.y }
  })
  await page.mouse.click(midpoint.x, midpoint.y)
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('is not a bridge')
  await close(page)
  await button(page, 'Inspect graph edge 3: 2 to 3').click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('is a bridge')
})
test('030 chain, cycle and disconnected presets and changing DFS root preserve correct bridge sets', async ({ page }) => {
  const preset = root(page).getByLabel('Bridge graph example', { exact: true })
  await preset.selectOption('chain')
  await expect(root(page).locator('.br-bridge-edge')).toHaveCount(5)
  await preset.selectOption('cycle')
  await expect(root(page).locator('.br-bridge-edge')).toHaveCount(0)
  await preset.selectOption('disconnected')
  await expect(root(page).locator('.br-bridge-edge')).toHaveCount(1)
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('3 connected component(s)')
  await tab(page, 'Visualization')
  await preset.selectOption('default')
  await tab(page, 'Experiments')
  await root(page).getByLabel('DFS starting vertex', { exact: true }).selectOption('6')
  await expect(root(page).getByRole('status')).toContainText('1 bridge edge(s)')
  await tab(page, 'Visualization')
  await expect(root(page).locator('.br-bridge-edge')).toHaveAttribute('data-bridge-edge', '3')
})
test('030 custom graph JSON validates bounds and supports self-loops and isolated vertices', async ({ page }) => {
  await root(page).getByLabel('Bridge graph example', { exact: true }).selectOption('custom')
  const editor = page.getByLabel('Undirected bridge graph JSON', { exact: true })
  await expect(editor).toBeFocused()
  for (const text of [
    'invalid',
    '{}',
    JSON.stringify({ ...bridgeExample, vertices: 9 }),
    JSON.stringify({ ...bridgeExample, edges: [[1, 9]] }),
    JSON.stringify({ ...bridgeExample, edges: [null] }),
  ]) {
    await editor.fill(text)
    await button(page, 'Apply bridge graph').click()
    await expect(page.getByRole('alert')).toBeVisible()
  }
  await editor.fill(
    JSON.stringify({
      vertices: 2,
      start: 1,
      edges: [
        [1, 1],
        [1, 2],
      ],
    }),
  )
  await button(page, 'Apply bridge graph').click()
  await expect(root(page).locator('.br-vertex')).toHaveCount(2)
  await expect(root(page).locator('.br-bridge-edge')).toHaveAttribute('data-bridge-edge', '1')
  await tab(page, 'Experiments')
  await button(page, 'Edit undirected graph JSON').click()
  await editor.fill(JSON.stringify({ vertices: 1, start: 1, edges: [] }))
  await button(page, 'Apply bridge graph').click()
  await expect(root(page).getByRole('status')).toContainText('0 bridge edge(s)')
  await tab(page, 'Visualization')
  await expect(root(page).locator('.br-vertex')).toHaveCount(1)
})
test('030 theory, worked proof, code, prediction challenges and persistent notes work', async ({ page }) => {
  await button(page, 'Try It').click()
  await expect(page.getByRole('dialog')).toContainText('low[4] = 3 > tin[3] = 2')
  await button(page, 'Inspect the bridge discovery step').click()
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('second parallel edge')
  await expect(root(page).getByRole('link')).toHaveAttribute('href', 'https://algs4.cs.princeton.edu/41graph/index.php')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('edgeId == parentEdgeId')
  await tab(page, 'Practice')
  await root(page).getByLabel('Bridge prediction').fill('yes')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await button(page, 'Not a bridge').click()
  await expect(root(page).getByRole('status')).toContainText('equality')
  await tab(page, 'Notes')
  await root(page).getByLabel('Graph bridges notes').fill('Skip the parent edge ID. Strict low[child] > tin[parent] identifies a bridge.')
  await button(page, 'Mark section reviewed').click()
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Graph bridges notes')).toHaveValue('Skip the parent edge ID. Strict low[child] > tin[parent] identifies a bridge.')
  await expect(button(page, 'Section reviewed')).toHaveAttribute('aria-pressed', 'true')
})
test('030 maximum-size graph, scrolling table and dark mode remain usable at narrow widths', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Edit undirected graph JSON').click()
  await page
    .getByLabel('Undirected bridge graph JSON')
    .fill(JSON.stringify({ vertices: 8, start: 1, edges: Array.from({ length: 7 }, (_, i) => [i + 1, i + 2]) }))
  await button(page, 'Apply bridge graph').click()
  await tab(page, 'Notes')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  for (const width of info.project.name === 'desktop' ? [1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 941 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await expect(button(page, 'Next DFS step')).toBeVisible()
  }
  await expect(root(page).locator('.br-values-table tbody tr')).toHaveCount(8)
  expect(
    await root(page)
      .locator('.br-values-table-scroll')
      .evaluate((e) => e.scrollHeight > e.clientHeight),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/bridges-030/${info.project.name}-dark.png`, fullPage: true })
})
