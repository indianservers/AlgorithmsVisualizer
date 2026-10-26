import { test, expect, type Page } from '@playwright/test'
import { matchingGraph } from '../../src/daa/bipartiteMatchingModel'
const root = (p: Page) => p.locator('.bipartite-matching-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close matching dialog').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/bipartite-matching')
  await expect(root(page)).toBeVisible()
})
test('029 includes all reference panels, exact desktop anchors and genuine before/after matchings', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const heading of [
    'Interactive Visualization',
    'Bipartite Graph (original)',
    'Augmenting Path Animation',
    'Augmentation Steps',
    'Graph after Augmentation',
    'Current Matching',
    'Animation Controls',
    'Key Takeaways',
    'Worked Example',
    'Correctness & Complexity',
    'Common Pitfalls',
  ])
    await expect(root(page).getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root(page).locator('.bp-before-diagram .bp-vertex')).toHaveCount(6)
  await expect(root(page).locator('.bp-before-diagram [data-matching-edge]')).toHaveCount(7)
  await expect(root(page).locator('.bp-before-diagram .bp-matched-edge')).toHaveCount(2)
  await expect(root(page).locator('.bp-after-diagram .bp-matched-edge')).toHaveCount(3)
  await expect(root(page).locator('.bp-before-diagram .bp-path-edge')).toHaveCount(1)
  await expect(root(page).locator('.bp-current-panel pre')).toHaveText('(1, 4)\n(2, 5)\n(3, 6)')
  await expect(root(page).locator('.bp-result-status')).toContainText('Perfect matching found')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.bp-lesson-header', { x: 280, y: 55, width: 1380, height: 70 }],
      ['.mom-tabs', { x: 284, y: 125, width: 1376, height: 50 }],
      ['.bp-original-panel', { x: 299, y: 261, width: 487, height: 367 }],
      ['.bp-animation-panel', { x: 800, y: 261, width: 398, height: 367 }],
      ['.bp-result-panel', { x: 1211, y: 261, width: 434, height: 291 }],
      ['.bp-current-panel', { x: 1211, y: 562, width: 434, height: 141 }],
      ['.bp-controls', { x: 1211, y: 703, width: 434, height: 86 }],
      ['.bp-steps-panel', { x: 299, y: 640, width: 899, height: 141 }],
      ['.bp-footer-grid', { x: 298, y: 791, width: 1348, height: 166 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
      if (selector !== '.bp-footer-grid') expect(Math.abs(box!.height - expected.height)).toBeLessThanOrEqual(2)
    }
  await button(page, 'Step Forward').click()
  await expect(root(page)).toHaveAttribute('data-stage', '1')
  if (info.project.name === 'desktop') {
    const tops = await root(page)
      .locator('.bp-stage-track button > i')
      .evaluateAll((elements) => elements.map((e) => e.getBoundingClientRect().top))
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1)
  }
})
test('029 replays all four stages, updates current matching on flip and respects boundaries', async ({ page }) => {
  await expect(button(page, 'Step Back')).toBeDisabled()
  await button(page, 'Step Forward').click()
  await expect(root(page)).toHaveAttribute('data-stage', '1')
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('Current matching size: 2')
  await tab(page, 'Visualization')
  await button(page, 'Step Forward').click()
  await expect(root(page)).toHaveAttribute('data-stage', '2')
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('Current matching size: 3')
  await tab(page, 'Visualization')
  await button(page, 'Step Forward').click()
  await expect(button(page, 'Step Forward')).toBeDisabled()
  await button(page, 'Step Back').click()
  await expect(root(page)).toHaveAttribute('data-stage', '2')
  await button(page, 'Matching stage 1').click()
  await expect(button(page, 'Step Back')).toBeDisabled()
  await root(page).getByLabel('Matching speed preset').selectOption('fast')
  await button(page, 'Play').click()
  await expect(root(page)).toHaveAttribute('data-stage', '3')
})
test('029 chooses free starts, rejects matched starts, and toggles labels and path highlighting', async ({ page }) => {
  await button(page, 'Start from vertex 1').click()
  await expect(root(page).getByRole('status')).toContainText('already matched')
  await expect(button(page, 'Animate Augmenting Path')).toBeDisabled()
  await expect(button(page, 'Matching stage 3')).toBeDisabled()
  await button(page, 'Step Forward').click()
  await expect(button(page, 'Step Forward')).toBeDisabled()
  await button(page, 'Start from vertex 2').click()
  await expect(button(page, 'Animate Augmenting Path')).toBeEnabled()
  await root(page).getByLabel('Show alternating path', { exact: true }).uncheck()
  await expect(root(page).locator('.bp-path-edge')).toHaveCount(0)
  await root(page).getByLabel('Show alternating path', { exact: true }).check()
  await expect(root(page).locator('.bp-path-edge')).toHaveCount(1)
  await root(page).getByLabel('Show vertex labels', { exact: true }).uncheck()
  await expect(root(page).locator('.bp-vertex text')).toHaveCount(0)
  await root(page).getByLabel('Show vertex labels', { exact: true }).check()
  await expect(root(page).locator('.bp-vertex text')).toHaveCount(12)
})
test('029 rerouting removes a matched edge and adds two unmatched edges', async ({ page }) => {
  await root(page).getByLabel('Bipartite graph example', { exact: true }).selectOption('reroute')
  await expect(root(page).locator('.bp-before-diagram .bp-path-edge')).toHaveCount(3)
  await expect(root(page).locator('.bp-after-diagram .bp-matched-edge[data-matching-edge="1-4"]')).toHaveCount(0)
  await expect(root(page).locator('.bp-after-diagram .bp-matched-edge[data-matching-edge="1-5"]')).toHaveCount(1)
  await expect(root(page).locator('.bp-after-diagram .bp-matched-edge[data-matching-edge="2-4"]')).toHaveCount(1)
  await button(page, 'Try It').click()
  await expect(page.getByRole('dialog')).toContainText('2 → 4 → 1 → 5')
  await button(page, 'Play this augmentation').click()
  await expect(button(page, 'Pause')).toBeVisible()
})
test('029 edge inspector edits matching and refuses shared endpoints', async ({ page }) => {
  await button(page, 'Inspect original edge 2 to 4').click()
  await button(page, 'Add edge to matching').click()
  await expect(page.getByRole('alert')).toContainText('disjoint')
  await close(page)
  await button(page, 'Inspect original edge 1 to 4').click()
  await button(page, 'Remove edge from matching').click()
  await expect(root(page).locator('.bp-before-diagram .bp-matched-edge')).toHaveCount(1)
  await button(page, 'Inspect original edge 2 to 4').click()
  await button(page, 'Add edge to matching').click()
  await expect(root(page).locator('.bp-before-diagram .bp-matched-edge')).toHaveCount(2)
  await button(page, 'Inspect original vertex 1').click()
  await expect(page.getByRole('dialog')).toContainText('Original mate: free')
  await button(page, 'Use as starting vertex').click()
  await expect(button(page, 'Start from vertex 1')).toHaveAttribute('aria-pressed', 'true')
})
test('029 custom graph editor validates partitions, edges and initial matching', async ({ page }) => {
  await root(page).getByLabel('Bipartite graph example', { exact: true }).selectOption('custom')
  const editor = page.getByLabel('Bipartite graph JSON')
  await expect(editor).toBeFocused()
  for (const text of [
    'invalid',
    '{}',
    JSON.stringify({ left: 2, right: 2, edges: [[1, 2]] }),
    JSON.stringify({
      ...matchingGraph,
      matching: [
        [1, 4],
        [2, 4],
      ],
    }),
  ]) {
    await editor.fill(text)
    await button(page, 'Apply bipartite graph').click()
    await expect(page.getByRole('alert')).toBeVisible()
  }
  await editor.fill(
    JSON.stringify({
      left: 2,
      right: 3,
      edges: [
        [1, 3],
        [2, 4],
      ],
      matching: [],
    }),
  )
  await button(page, 'Apply bipartite graph').click()
  await expect(root(page).locator('.bp-before-diagram .bp-vertex')).toHaveCount(5)
  await expect(root(page).locator('.bp-result-status')).toContainText('Further augmentations')
  await expect(root(page).getByLabel('Bipartite graph example', { exact: true })).toHaveValue('custom')
  await tab(page, 'Experiments')
  await button(page, 'Find maximum matching').click()
  await expect(root(page).getByRole('status')).toContainText('Current matching size: 2')
  await tab(page, 'Visualization')
  await expect(root(page).locator('.bp-result-status')).toContainText('Maximum matching found')
  await expect(root(page).locator('.bp-result-status')).not.toContainText('Perfect')
})
test('029 checks every free vertex rather than stopping after one blocked search', async ({ page }) => {
  await root(page).getByLabel('Bipartite graph example', { exact: true }).selectOption('blocked')
  await expect(root(page).getByRole('status')).toContainText('Search other free vertices')
  await tab(page, 'Experiments')
  await button(page, 'Find next augmentation').click()
  await expect(root(page).getByRole('status')).toContainText('Selected path: 2 → 4')
  await tab(page, 'Visualization')
  await button(page, 'Matching stage 3').click()
  await tab(page, 'Experiments')
  await expect(root(page).getByRole('status')).toContainText('Current matching size: 1')
  await button(page, 'Find next augmentation').click()
  await expect(root(page)).toContainText('No free U vertex has an augmenting path')
  await expect(root(page)).toContainText('equal to the maximum matching size')
})
test('029 theory, code, prediction and notes are usable and persistent', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('maximal matching')
  await expect(root(page).getByRole('link')).toHaveAttribute(
    'href',
    'https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/BipartiteMatching.html',
  )
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('symmetric_difference')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted matching size').fill('3')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await button(page, 'Search every free vertex in U').click()
  await expect(root(page).getByRole('status')).toContainText('another free vertex')
  await tab(page, 'Notes')
  await root(page).getByLabel('Bipartite matching notes').fill('Alternate unmatched and matched edges; start and finish free.')
  await button(page, 'Mark section reviewed').click()
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Bipartite matching notes')).toHaveValue('Alternate unmatched and matched edges; start and finish free.')
  await expect(button(page, 'Section reviewed')).toHaveAttribute('aria-pressed', 'true')
})
test('029 maximum partition sizes, dark mode and narrow screens remain within viewport', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Edit graph and matching JSON').click()
  await page.getByLabel('Bipartite graph JSON').fill(
    JSON.stringify({
      left: 5,
      right: 5,
      edges: [
        [1, 6],
        [2, 7],
        [3, 8],
        [4, 9],
        [5, 10],
      ],
      matching: [],
    }),
  )
  await button(page, 'Apply bipartite graph').click()
  await button(page, 'Find maximum matching').click()
  await tab(page, 'Notes')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  for (const width of info.project.name === 'desktop' ? [1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 941 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await expect(button(page, 'Step Forward')).toBeVisible()
    const matchingBox = await root(page).locator('.bp-current-panel').boundingBox(),
      controlsBox = await root(page).locator('.bp-controls').boundingBox()
    expect(matchingBox!.y + matchingBox!.height).toBeLessThanOrEqual(controlsBox!.y + 1)
  }
  await expect(root(page).locator('.bp-before-diagram .bp-vertex')).toHaveCount(10)
  await page.screenshot({ path: `artifacts/visual-qa/bipartite-029/${info.project.name}-dark.png`, fullPage: true })
})
