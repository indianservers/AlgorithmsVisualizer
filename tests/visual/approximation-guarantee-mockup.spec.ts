import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
const root = (p: Page) => p.locator('.approximation-guarantee-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close guarantee inspector').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/approximation-method')
  await expect(root(page)).toBeVisible()
})
test('047 native panels display a valid six-vertex cover and the real guarantee', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    'Approximation Ratio',
    'Example Selector',
    'Controls',
    'Graph and Approximate Solution',
    'Worst-Case Guarantee on This Example',
    'How the Algorithm Works',
    'PTAS / FPTAS Overview',
    'Key Takeaways',
    'Correctness & Feasibility',
    'Complexity',
    'Common Pitfalls',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.ag-vertex')).toHaveCount(8)
  await expect(root(page).locator('.ag-matching-edge')).toHaveCount(3)
  await expect(root(page).locator('.ag-selected')).toHaveCount(6)
  await expect(root(page).locator('.ag-bar-value')).toHaveText(['4', '6', '8'])
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('1.5')
  if (info.project.name === 'desktop') {
    mkdirSync('artifacts/visual-qa/approximation-guarantee-047', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/approximation-guarantee-047/default.png' })
    const bounds = await root(page).locator('.ag-graph').boundingBox()
    expect(bounds!.x).toBe(279)
    expect(bounds!.y).toBe(399)
    const layout = []
    for (const selector of [
      '.ag-toolbar',
      '.ag-hero',
      '.mom-tabs',
      '.ag-ratio',
      '.ag-selector',
      '.ag-controls',
      '.ag-graph',
      '.ag-guarantee',
      '.ag-how',
      '.ag-schemes',
      '.ag-takeaways',
      '.ag-correctness',
      '.ag-complexity',
      '.ag-pitfalls',
    ])
      layout.push({ selector, ...(await root(page).locator(selector).boundingBox()) })
    writeFileSync('artifacts/visual-qa/approximation-guarantee-047/layout.json', JSON.stringify(layout, null, 2))
    const expected = [
      [279, 10, 1376, 45],
      [269, 55, 1403, 70],
      [279, 125, 1376, 50],
      [279, 186, 624, 203],
      [913, 186, 363, 203],
      [1287, 186, 368, 203],
      [279, 399, 715, 253],
      [1003, 399, 652, 253],
      [279, 662, 502, 163],
      [791, 662, 428, 163],
      [1228, 662, 427, 163],
      [279, 835, 608, 97],
      [898, 835, 320, 97],
      [1228, 835, 427, 97],
    ]
    for (let i = 0; i < layout.length; i++)
      for (const [j, key] of (['x', 'y', 'width', 'height'] as const).entries())
        expect(Math.abs(layout[i][key]! - expected[i][j]), `${layout[i].selector} ${key}`).toBeLessThanOrEqual(2)
    await expect(page.locator('.sidebar-algorithm.active')).toBeInViewport()
    await expect(page.getByRole('link', { name: 'Home dashboard', exact: true })).toBeInViewport()
  }
})
test('047 graph vertices, edges and proof certificates are inspectable', async ({ page }) => {
  await button(page, 'Inspect vertex 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('Selected in approximate cover: Yes')
  await close(page)
  await button(page, 'Inspect edge 1–2').click()
  await expect(root(page).getByRole('dialog')).toContainText('Zero-based edge ID: 0')
  await close(page)
  await root(page).locator('.ag-certificate').click()
  await expect(root(page).getByRole('dialog')).toContainText('OPT ≥ |M|')
  await page.keyboard.press('Escape')
  await expect(root(page).getByRole('dialog')).toHaveCount(0)
})
test('047 reset and manual matching choices preserve feasibility truth', async ({ page }) => {
  await button(page, 'Reset').click()
  await expect(root(page).locator('.ag-selected')).toHaveCount(0)
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('Partial solution')
  await button(page, 'Inspect edge 1–2').click()
  await button(page, 'Use this edge next').click()
  await expect(root(page).locator('.ag-selected')).toHaveCount(2)
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('Partial solution')
  await button(page, 'Show algorithm stage 3').click()
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('1.5')
})
test('047 each visual layer and optimum comparison can be toggled independently', async ({ page }) => {
  await root(page).getByLabel('Show Matching', { exact: true }).uncheck()
  await expect(root(page).locator('.ag-matching-edge')).toHaveCount(0)
  await expect(root(page).locator('.ag-selected')).toHaveCount(6)
  await root(page).getByLabel('Show Approx. Cover', { exact: true }).uncheck()
  await expect(root(page).locator('.ag-selected')).toHaveCount(0)
  await root(page).getByLabel('Show OPT (for comparison)', { exact: true }).uncheck()
  await expect(root(page).locator('.ag-bar-value')).toHaveText(['6'])
  await expect(root(page).locator('.ag-ratio-formula')).toHaveText('OPT comparison hidden')
})
test('047 custom graphs validate atomically and the star attains factor two', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Example preset', { exact: true }).selectOption('star')
  await expect(root(page).getByRole('status')).toContainText('ALG = 2, OPT = 1, ρ = 2')
  await root(page).getByLabel('Custom approximation input', { exact: true }).fill('{"vertices":3,"edges":[[0,0]]}')
  await button(page, 'Apply custom input').click()
  await expect(root(page).getByRole('alert')).toBeVisible()
  await expect(root(page).getByRole('status')).toContainText('ALG = 2')
  await root(page).getByLabel('Custom approximation input', { exact: true }).fill('{"vertices":3,"edges":[[0,1],[1,2]]}')
  await root(page).getByLabel('Preferred zero-based edge order', { exact: true }).fill('1')
  await button(page, 'Apply custom input').click()
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await expect(root(page).getByRole('status')).toContainText('ALG = 2, OPT = 1')
  await tab(page, 'Visualization')
  await expect(root(page).locator('.ag-vertex')).toHaveCount(3)
})
test('047 metric TSP and Max-Cut compute their own solutions and ratio conventions', async ({ page }) => {
  await root(page).getByLabel('Approximation example', { exact: true }).selectOption('metric-tsp')
  await expect(root(page).locator('.ag-vertex')).toHaveCount(7)
  await expect(root(page).locator('.ag-bar-value').nth(1)).toHaveText('18.861')
  await root(page).locator('.ag-proof-summary').click()
  await expect(root(page).getByRole('dialog')).toContainText('triangle inequality')
  await close(page)
  await root(page).getByLabel('Approximation example', { exact: true }).selectOption('max-cut')
  await expect(root(page).locator('.ag-cut-a,.ag-cut-b')).toHaveCount(8)
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('OPTALG')
  await expect(root(page).getByRole('button', { name: 'Inspect cost OPT / 2', exact: true })).toBeVisible()
  await root(page).locator('.ag-proof-summary').click()
  await expect(root(page).getByRole('dialog')).toContainText('ALG ≥ m/2 ≥ OPT/2')
  await close(page)
})
test('047 zero-cost cases avoid undefined ratio claims and reject nonmetric input', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Example preset', { exact: true }).selectOption('zero')
  await tab(page, 'Visualization')
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('ratio undefined')
  await root(page).getByLabel('Approximation example', { exact: true }).selectOption('metric-tsp')
  await tab(page, 'Experiments')
  await root(page)
    .getByLabel('Custom approximation input', { exact: true })
    .fill(
      JSON.stringify({
        mode: 'matrix',
        source: 0,
        points: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        matrix: [
          [0, 1, 3],
          [1, 0, 1],
          [3, 1, 0],
        ],
      }),
    )
  await button(page, 'Apply custom input').click()
  await expect(root(page).getByRole('alert')).toContainText('Triangle inequality')
})
test('047 animation, timeline and scheme accuracy controls update the same model', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Algorithm step', { exact: true }).fill('0')
  await button(page, 'Next step').click()
  await expect(root(page).getByText('Current cost: 2. Partial solution', { exact: true })).toBeVisible()
  await root(page).getByLabel('Animation speed', { exact: true }).selectOption('150')
  await button(page, 'Play animation').click()
  await expect(root(page).getByText('Current cost: 6. Feasible solution', { exact: true })).toBeVisible()
  await root(page).getByLabel('Accuracy ε', { exact: true }).fill('0.05')
  await expect(root(page).locator('.ag-scheme-values')).toContainText('1 + ε = 1.05')
  await expect(root(page).locator('.ag-scheme-values')).toContainText('1.00e+20')
})
test('047 theory, prediction challenges and persistent notes are complete', async ({ page }) => {
  await button(page, 'Start Learning').click()
  await expect(root(page).getByText('A tight example', { exact: true })).toBeVisible()
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('OPT ≥ |M|')
  await tab(page, 'Practice')
  await button(page, '2').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await button(page, '1.5').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Notes')
  await root(page).getByLabel('Approximation learning notes', { exact: true }).fill('Feasible cover; OPT >= matching size.')
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Approximation learning notes', { exact: true })).toHaveValue('Feasible cover; OPT >= matching size.')
})
test('047 dark and mobile layouts keep local graph scrolling and controls accessible', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await tab(page, 'Visualization')
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await root(page).boundingBox())!.width).toBeGreaterThan(page.viewportSize()!.width - 300)
  if (info.project.name === 'mobile') expect((await root(page).boundingBox())!.width).toBeGreaterThan(page.viewportSize()!.width - 30)
  await button(page, 'Mark studied').click()
  await expect(button(page, 'Studied')).toHaveAttribute('aria-pressed', 'true')
  mkdirSync('artifacts/visual-qa/approximation-guarantee-047', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/approximation-guarantee-047/${info.project.name}-dark.png`, fullPage: info.project.name === 'mobile' })
})

test('047 maximum supported graph and metric inputs remain interactive', async ({ page }) => {
  await tab(page, 'Experiments')
  const edges: number[][] = []
  for (let u = 0; u < 8; u++) for (let v = u + 1; v < 8; v++) if (edges.length < 20) edges.push([u, v])
  await root(page)
    .getByLabel('Custom approximation input', { exact: true })
    .fill(JSON.stringify({ vertices: 8, edges }))
  await button(page, 'Apply custom input').click()
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await tab(page, 'Visualization')
  await expect(root(page).locator('.ag-edge')).toHaveCount(20)
  await root(page).getByLabel('Approximation example', { exact: true }).selectOption('metric-tsp')
  await tab(page, 'Experiments')
  await root(page)
    .getByLabel('Custom approximation input', { exact: true })
    .fill(JSON.stringify({ mode: 'manhattan', source: 8, points: Array.from({ length: 9 }, (_, i) => [i * 2, (i * i) % 7]) }))
  await button(page, 'Apply custom input').click()
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await tab(page, 'Visualization')
  await expect(root(page).locator('.ag-vertex')).toHaveCount(9)
  await expect(root(page).locator('.ag-edge')).toHaveCount(36)
  await expect(root(page).locator('.ag-ratio-formula')).toContainText('guaranteed')
})

test('047 search shortcuts, progress and the tight example work across modes', async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(root(page).getByLabel('Search topics', { exact: true })).toBeFocused()
  await root(page).getByLabel('Search topics', { exact: true }).fill('no-such-lesson-047')
  await expect(root(page).getByText('No matching topics.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await root(page).getByLabel('Search topics', { exact: true }).fill('vertex cover')
  await expect(root(page).locator('.ag-search-results button').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await root(page).getByLabel('Approximation example', { exact: true }).selectOption('metric-tsp')
  await tab(page, 'Learn')
  await button(page, 'Explore the tight star example').click()
  await expect(root(page).getByLabel('Approximation example', { exact: true })).toHaveValue('cover')
  await expect(root(page).locator('.ag-bar-value')).toHaveText(['1', '2', '2'])
  await expect(root(page).locator('.ag-progress')).toContainText('2 of 6 sections')
})
