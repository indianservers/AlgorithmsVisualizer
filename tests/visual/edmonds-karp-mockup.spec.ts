import { test, expect, type Page } from '@playwright/test'
import { flowExample } from '../../src/daa/edmondsKarpModel'
const root = (p: Page) => p.locator('.edmonds-karp-page')
const button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true })
const tab = (p: Page, name: string) => button(p, name).click()
const close = (p: Page) => button(p, 'Close flow dialog').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/edmonds-karp')
  await expect(root(page)).toBeVisible()
})
test('028 includes reference components, exact main panel anchors and consistent computed values', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const heading of [
    'Interactive Visualization',
    'Augmenting Path & Animation',
    'Step-by-Step Augmentations',
    'Max-Flow / Min-Cut',
    'Capacity Utilization',
    'Key Takeaways',
    'Worked Example',
    'Correctness & Complexity',
    'Common Pitfalls',
  ])
    await expect(root(page).getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root(page).locator('.ef-flow-svg .ef-graph-vertex')).toHaveCount(6)
  await expect(root(page).locator('.ef-flow-svg [data-flow-edge]')).toHaveCount(8)
  await expect(root(page).locator('.ef-residual-svg .ef-path-edge')).toHaveCount(3)
  await expect(root(page).locator('.ef-path-card')).toContainText('Bottleneck')
  await expect(root(page).locator('.ef-path-card output')).toHaveText('6')
  await expect(root(page).locator('.ef-cut-grid output')).toHaveText('11')
  await expect(root(page).locator('.ef-cut-grid')).toContainText('S-side: { S, 1, 3 }')
  await expect(root(page).locator('.ef-utilization button')).toHaveCount(8)
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.ef-lesson-header', { x: 268, y: 56, width: 1404, height: 80 }],
      ['.mom-tabs', { x: 278, y: 136, width: 1380, height: 51 }],
      ['.ef-visualization', { x: 278, y: 197, width: 1380, height: 377 }],
      ['.ef-flow-panel', { x: 293, y: 270, width: 530, height: 299 }],
      ['.ef-residual-panel', { x: 835, y: 270, width: 487, height: 299 }],
      ['.ef-animation-panel', { x: 1329, y: 270, width: 313, height: 299 }],
      ['.ef-analysis-grid', { x: 278, y: 580, width: 1380, height: 204 }],
      ['.ef-footer-grid', { x: 278, y: 793, width: 1380, height: 145 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
      if (selector !== '.ef-footer-grid') expect(Math.abs(box!.height - expected.height)).toBeLessThanOrEqual(2)
    }
  await button(page, 'Next augmentation').click()
  await expect(root(page).locator('.ef-path-card output')).toHaveText('5')
})
test('028 steps through both augmentations and the final reachable-set certificate', async ({ page }) => {
  await expect(button(page, 'Previous augmentation')).toBeDisabled()
  await button(page, 'Next augmentation').click()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 6')
  await expect(root(page).locator('.ef-path-card output')).toHaveText('5')
  await expect(root(page).locator('.ef-residual-svg .ef-reverse-edge').first()).toBeVisible()
  await button(page, 'Next augmentation').click()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 11')
  await expect(root(page).locator('.ef-path-card')).toContainText('Maximum flow reached')
  await expect(button(page, 'Animate Flow Update')).toBeDisabled()
  await expect(button(page, 'Next augmentation')).toBeDisabled()
  await button(page, 'Previous augmentation').click()
  await expect(root(page).locator('.ef-path-card output')).toHaveText('5')
  await button(page, 'Augmentation stage 1').click()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 0')
  await button(page, 'No more paths').click()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 11')
})
test('028 animation actually updates flow and residual capacities at the chosen speed', async ({ page }) => {
  await root(page).getByLabel('Flow animation speed', { exact: true }).fill('1600')
  await button(page, 'Animate Flow Update').click()
  await expect(button(page, 'Pause Flow Update')).toBeVisible()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 6')
  await expect(button(page, 'Animate Flow Update')).toBeVisible()
  await button(page, 'Animate Flow Update').click()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 11')
  await expect(button(page, 'Animate Flow Update')).toBeDisabled()
  await button(page, 'Reset').click()
  await expect(root(page).locator('.ef-flow-panel > header')).toContainText('current flow: 0')
})
test('028 residual and label toggles work and vertices expose BFS metadata', async ({ page }) => {
  await root(page).getByLabel('Show residual graph', { exact: true }).uncheck()
  await expect(root(page).locator('.ef-residual-svg [data-flow-edge]')).toHaveCount(0)
  await expect(root(page).locator('.ef-residual-hidden')).toBeVisible()
  await root(page).getByLabel('Show residual graph', { exact: true }).check()
  await root(page).getByLabel('Show vertex labels', { exact: true }).uncheck()
  await expect(root(page).locator('.ef-graph-vertex text')).toHaveCount(0)
  await root(page).getByLabel('Show vertex labels', { exact: true }).check()
  await button(page, 'Inspect residual vertex 2').click()
  await expect(page.getByRole('dialog')).toContainText('BFS parent: 1')
  await expect(page.getByRole('dialog')).toContainText('Final minimum-cut side: T-side')
})
test('028 edits capacities from graph and utilization and recomputes valid flow', async ({ page }) => {
  await button(page, 'Inspect flow edge 1 to 2').click()
  await expect(page.getByRole('dialog')).toContainText('forward residual: 6')
  await page.getByLabel('Edge capacity', { exact: true }).fill('-1')
  await button(page, 'Apply edge capacity').click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Edge capacity', { exact: true }).fill('2')
  await button(page, 'Apply edge capacity').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(root(page).locator('.ef-cut-grid output')).toHaveText('7')
  await expect(root(page).getByLabel('Flow network example', { exact: true })).toHaveValue('custom')
  await button(page, 'Inspect utilization 3 to 4').click()
  await expect(page.getByRole('dialog')).toContainText('capacity: 5')
  await close(page)
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('Maximum flow 7; minimum cut capacity 7')
})
test('028 custom JSON is validated, focused and supports empty and antiparallel networks', async ({ page }) => {
  await root(page).getByLabel('Flow network example', { exact: true }).selectOption('custom')
  const editor = page.getByLabel('Flow network JSON', { exact: true })
  await expect(editor).toBeFocused()
  for (const text of ['invalid', '{}', JSON.stringify({ ...flowExample, source: 5 }), JSON.stringify({ ...flowExample, edges: [null] })]) {
    await editor.fill(text)
    await button(page, 'Apply network').click()
    await expect(page.getByRole('alert')).toBeVisible()
  }
  await editor.fill(JSON.stringify({ vertices: 2, source: 0, sink: 1, edges: [] }))
  await button(page, 'Apply network').click()
  await expect(root(page).locator('.ef-flow-svg .ef-graph-vertex')).toHaveCount(2)
  await expect(root(page).locator('.ef-cut-grid output')).toHaveText('0')
  await expect(button(page, 'Animate Flow Update')).toBeDisabled()
  await root(page).getByLabel('Flow network example', { exact: true }).selectOption('classic')
  await expect(root(page).locator('.ef-cut-grid output')).toHaveText('23')
  await expect(root(page).locator('.ef-flow-svg [data-flow-edge]')).toHaveCount(10)
})
test('028 cancellation preset exposes actual reverse arcs and disconnected sink is handled', async ({ page }) => {
  await root(page).getByLabel('Flow network example', { exact: true }).selectOption('reverse')
  await expect(root(page).locator('.ef-cut-grid output')).toHaveText('2')
  await button(page, 'Next augmentation').click()
  await expect(root(page).locator('.ef-residual-svg .ef-path-edge[data-reverse=true]')).toHaveCount(1)
  await button(page, 'Inspect residual edge 2 to 1 (cancel flow)').click()
  await expect(page.getByRole('dialog')).toContainText('reverse cancellation capacity: 1')
  await close(page)
  await button(page, 'Next augmentation').click()
  await button(page, 'Inspect flow edge 1 to 2').click()
  await expect(page.getByRole('dialog')).toContainText('Current flow: 0')
  await close(page)
  await root(page).getByLabel('Flow network example', { exact: true }).selectOption('disconnected')
  await expect(root(page).locator('.ef-cut-grid output')).toHaveText('0')
  await expect(root(page).locator('.ef-path-card')).toContainText('Maximum flow reached')
})
test('028 theory, code, worked examples, prediction challenges and persistent notes work', async ({ page }) => {
  await button(page, 'Try It').click()
  await expect(page.getByRole('dialog')).toContainText('bottleneck 6, flow 0 → 6')
  await expect(page.getByRole('dialog')).toContainText('bottleneck 5, flow 6 → 11')
  await close(page)
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('capacity and conservation')
  await expect(root(page).getByRole('link')).toHaveAttribute('href', 'https://www.boost.org/doc/libs/1_85_0/libs/graph/doc/edmonds_karp_max_flow.html')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('arc.reverse ? -delta : delta')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted bottleneck').fill('6')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await button(page, 'It allows cancellation of existing flow').click()
  await expect(root(page).getByRole('status')).toContainText('cancels flow')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.ef-bfs-table tbody tr')).toHaveCount(6)
  await button(page, 'Jump to maximum flow').click()
  await expect(root(page).getByRole('status')).toContainText('Current flow 11')
  await expect(root(page).locator('.ef-bfs-table tbody tr').last()).toContainText('No')
  await tab(page, 'Notes')
  await root(page).getByLabel('Maximum-flow notes').fill('A reverse residual edge cancels flow. The final cut certifies optimality.')
  await button(page, 'Mark section reviewed').click()
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Maximum-flow notes')).toHaveValue('A reverse residual edge cancels flow. The final cut certifies optimality.')
  await expect(button(page, 'Section reviewed')).toHaveAttribute('aria-pressed', 'true')
})
test('028 dark mode, custom topology and narrow viewports stay usable without page overflow', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Edit network JSON').click()
  await page
    .getByLabel('Flow network JSON')
    .fill(JSON.stringify({ vertices: 8, source: 0, sink: 7, edges: Array.from({ length: 7 }, (_, i) => ({ from: i, to: i + 1, capacity: 10 })) }))
  await button(page, 'Apply network').click()
  await tab(page, 'Notes')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  await expect(root(page).locator('.ef-flow-svg .ef-graph-vertex')).toHaveCount(8)
  for (const width of info.project.name === 'desktop' ? [1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 941 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await expect(button(page, 'Animate Flow Update')).toBeVisible()
  }
  await page.screenshot({ path: `artifacts/visual-qa/edmonds-karp-028/${info.project.name}-dark.png`, fullPage: true })
})
