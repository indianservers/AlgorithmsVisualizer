import { test, expect, type Page } from '@playwright/test'
import { articulationExample } from '../../src/daa/articulationModel'
const root = (p: Page) => p.locator('.articulation-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close articulation dialog').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/articulation-points')
  await expect(root(page)).toBeVisible()
})
test('031 includes all reference components, precise desktop anchors and the actual cut vertex', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const heading of ['Interactive Visualization', 'How it works', 'Key insight', 'Traversal state', 'Complexity'])
    await expect(root(page).getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.ap-vertex')).toHaveCount(7)
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(1)
  await expect(root(page).locator('.ap-cut-vertex')).toHaveAttribute('aria-label', 'Inspect articulation vertex 3')
  await expect(root(page).locator('.ap-state-table tbody tr').nth(3).locator('td')).toHaveText(['3', '4', '1', '2', 'Yes'])
  await expect(root(page).locator('.ap-example-result')).toContainText('{0,1,2} and {4,5,6}')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.ap-topbar', { x: 287, y: 17, width: 1283, height: 48 }],
      ['.mom-tabs', { x: 287, y: 76, width: 1283, height: 52 }],
      ['.ap-visualization', { x: 287, y: 140, width: 876, height: 502 }],
      ['.ap-graph-canvas', { x: 301, y: 215, width: 848, height: 356 }],
      ['.ap-how', { x: 1175, y: 140, width: 395, height: 334 }],
      ['.ap-insight', { x: 1175, y: 487, width: 395, height: 159 }],
      ['.ap-traversal', { x: 287, y: 654, width: 781, height: 262 }],
      ['.ap-complexity', { x: 1080, y: 658, width: 490, height: 260 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
  if (info.project.name === 'desktop') {
    const footer = await page.locator('.aimer-site-footer').boundingBox()
    expect(footer!.y).toBe(930)
    expect(footer!.height).toBe(52)
  }
  await expect(
    root(page)
      .locator('.ap-topbar')
      .getByRole('button', { name: /^Language:/ }),
  ).toHaveCount(0)
})
test('031 stepping and timed playback update discovery, low-link and cut markers', async ({ page }) => {
  await button(page, 'Step').click()
  await expect(root(page).locator('.ap-state-table tbody tr').first().locator('td')).toHaveText(['0', '1', '1', '–', 'No'])
  await expect(root(page).locator('.ap-state-table tbody tr').nth(1).locator('td').nth(1)).toHaveText('—')
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(0)
  await button(page, 'Step').click()
  await expect(root(page).locator('.ap-state-table tbody tr').nth(1).locator('td')).toHaveText(['1', '2', '2', '0', 'No'])
  await tab(page, 'Experiments')
  await root(page).getByLabel('Articulation playback speed').selectOption('100')
  await tab(page, 'Visualization')
  await button(page, 'Start DFS').click()
  await expect(button(page, 'Pause DFS')).toBeVisible()
  await expect(button(page, 'Start DFS')).toBeVisible()
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(1)
  await expect(root(page).locator('.ap-state-table tbody tr').last().locator('td')).toHaveText(['6', '7', '4', '5', 'No'])
})
test('031 values and highlight toggles work, reset restores the completed example', async ({ page }) => {
  await root(page).getByLabel('Show discovery/low values', { exact: true }).uncheck()
  await expect(root(page).locator('.ap-value-chip')).toHaveCount(0)
  await root(page).getByLabel('Highlight articulation points', { exact: true }).uncheck()
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(0)
  await button(page, 'Reset').click()
  await expect(root(page).locator('.ap-value-chip')).toHaveCount(7)
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(1)
})
test('031 vertex removal previews show actual components and restore the original graph', async ({ page }) => {
  await button(page, 'Inspect articulation vertex 3').click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('before removal: 1. Components after removal: 2')
  await expect(page.getByRole('dialog')).toContainText('{0,1,2} | {4,5,6}')
  await button(page, 'Preview removal in graph').click()
  await expect(root(page).getByRole('status')).toContainText('2 components after removal')
  await expect(root(page).locator('[data-ap-edge]')).toHaveCount(6)
  await expect(button(page, 'Start DFS')).toBeDisabled()
  await expect(root(page).locator('.ap-removed-vertex')).toHaveCount(1)
  await button(page, 'Restore graph').click()
  await expect(root(page).locator('[data-ap-edge]')).toHaveCount(10)
  await expect(button(page, 'Start DFS')).toBeEnabled()
  await button(page, 'Inspect traversal vertex 0').click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('is not an articulation point')
  await expect(page.getByRole('dialog')).toContainText('DFS root')
  await close(page)
  await expect(root(page).locator('.ap-example-result')).toContainText('Vertex 0 is not')
})
test('031 root, cycle, disconnected and parallel-edge presets apply the correct criteria', async ({ page }) => {
  const preset = root(page).getByLabel('Articulation graph example', { exact: true })
  await preset.selectOption('tree')
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(1)
  await expect(root(page).locator('.ap-cut-vertex')).toHaveAttribute('aria-label', 'Inspect articulation vertex 0')
  await button(page, 'Inspect articulation vertex 0').click()
  await expect(page.getByRole('dialog')).toContainText('DFS children = {1, 2, 3, 4, 5, 6}')
  await close(page)
  await preset.selectOption('cycle')
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(0)
  await preset.selectOption('disconnected')
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('Original components: 3')
  await button(page, 'Test removal of vertex 4').click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('after removal: 4')
  await close(page)
  await tab(page, 'Visualization')
  await preset.selectOption('parallel')
  await expect(root(page).locator('.ap-cut-vertex')).toHaveAttribute('aria-label', 'Inspect articulation vertex 1')
  await button(page, 'Inspect DFS edge 4: 2 to 2').click()
  await expect(page.getByRole('dialog')).toContainText('back edge or self-loop')
})
test('031 custom graph editor validates zero-based inputs, directed graphs and isolated vertices', async ({ page }) => {
  await root(page).getByLabel('Articulation graph example', { exact: true }).selectOption('custom')
  const editor = page.getByLabel('Articulation graph JSON')
  await expect(editor).toBeFocused()
  for (const text of [
    'invalid',
    '{}',
    JSON.stringify({ ...articulationExample, root: 7 }),
    JSON.stringify({ ...articulationExample, edges: [[0, 8]] }),
    JSON.stringify({ ...articulationExample, directed: true }),
    JSON.stringify({ ...articulationExample, edges: [null] }),
  ]) {
    await editor.fill(text)
    await button(page, 'Apply articulation graph').click()
    await expect(page.getByRole('alert')).toBeVisible()
  }
  await editor.fill(JSON.stringify({ vertices: 1, root: 0, edges: [] }))
  await button(page, 'Apply articulation graph').click()
  await expect(root(page).locator('.ap-vertex')).toHaveCount(1)
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(0)
  await button(page, 'Inspect articulation vertex 0').click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('after removal: 0')
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('is not an articulation point')
})
test('031 changing DFS root changes the trace while preserving cut vertices', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Articulation DFS root').selectOption('6')
  await expect(root(page).getByRole('status')).toContainText('Articulation points: {3}')
  await tab(page, 'Visualization')
  await expect(root(page).locator('.ap-state-table tbody tr').last().locator('td').nth(1)).toHaveText('1')
  await expect(root(page).locator('.ap-cut-vertex')).toHaveCount(1)
})
test('031 theory, code, prediction, worked removal, language settings and notes work', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('Count children in the DFS tree')
  await button(page, 'Try the worked removal').click()
  await expect(page.getByRole('dialog')).toContainText('low[4] = 4 ≥ d[3] = 4')
  await button(page, 'Preview vertex 3 removal').click()
  await expect(root(page).getByRole('status')).toContainText('2 components')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('children >= 2')
  await tab(page, 'Practice')
  await root(page).getByLabel('Articulation prediction').fill('yes')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await button(page, 'Count DFS children').click()
  await expect(root(page).getByRole('status')).toContainText('not the number of original neighbors')
  await tab(page, 'Experiments')
  await root(page)
    .getByRole('button', { name: /^Language:/ })
    .click()
  await expect(page.getByRole('dialog', { name: 'Choose language', exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'Choose language', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
  await root(page).getByLabel('Articulation-point notes').fill('For non-roots use ≥; DFS roots need two children. Compare component counts after deletion.')
  await button(page, 'Mark section reviewed').click()
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Articulation-point notes')).toHaveValue(
    'For non-roots use ≥; DFS roots need two children. Compare component counts after deletion.',
  )
  await expect(button(page, 'Section reviewed')).toHaveAttribute('aria-pressed', 'true')
})
test('031 maximum-size graphs, tables and dark mode stay usable at narrow widths', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Edit articulation graph JSON').click()
  await page.getByLabel('Articulation graph JSON').fill(JSON.stringify({ vertices: 8, root: 0, edges: Array.from({ length: 7 }, (_, v) => [v, v + 1]) }))
  await button(page, 'Apply articulation graph').click()
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  for (const width of info.project.name === 'desktop' ? [1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 992 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await expect(button(page, 'Step')).toBeVisible()
  }
  await expect(root(page).locator('.ap-state-table tbody tr')).toHaveCount(8)
  expect(
    await root(page)
      .locator('.ap-table-scroll')
      .evaluate((e) => e.scrollHeight > e.clientHeight),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/articulation-031/${info.project.name}-dark.png`, fullPage: true })
})
