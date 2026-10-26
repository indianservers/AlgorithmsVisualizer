import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.metric-tsp-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close metric TSP dialog').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/metric-tsp-approximation')
  await expect(root(page)).toBeVisible()
})
test('039 reference panels and graph layers show a complete consistent metric tour', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of [
    'Interactive Visualization',
    'How it works',
    'Key insight',
    'Current state details',
    'MST lower bound',
    'Approximation ratio',
    'Tour cost',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.mt-city')).toHaveCount(7)
  await expect(root(page).locator('.mt-metric-edge')).toHaveCount(21)
  await expect(root(page).locator('.mt-mst-edge')).toHaveCount(6)
  await expect(root(page).locator('.mt-walk-edge')).toHaveCount(12)
  await expect(root(page).locator('.mt-tour-edge')).toHaveCount(7)
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('18.9')
  await expect(root(page).locator('.mt-lower-bound strong')).toHaveText('14.0')
  await expect(root(page).locator('.mt-ratio strong')).toHaveText('1.35')
  await expect(root(page).locator('.mt-tour-cost button')).toHaveText('0 → 1 → 3 → 2 → 6 → 5 → 4 → 0')
  await expect(root(page).locator('.mt-table-scroll tbody tr')).toHaveCount(6)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mt-visualization', { x: 280, y: 136, width: 885, height: 520 }],
      ['.mt-canvas-scroll', { x: 293, y: 205, width: 859, height: 385 }],
      ['.mt-details', { x: 280, y: 666, width: 611, height: 261 }],
      ['.mt-lower-bound', { x: 900, y: 666, width: 266, height: 140 }],
      ['.mt-ratio', { x: 900, y: 816, width: 266, height: 111 }],
      ['.mt-how', { x: 1177, y: 136, width: 395, height: 289 }],
      ['.mt-insight', { x: 1177, y: 435, width: 395, height: 164 }],
      ['.mt-tour-cost', { x: 1177, y: 612, width: 395, height: 143 }],
      ['.mt-complexity', { x: 1177, y: 765, width: 395, height: 162 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    mkdirSync('artifacts/visual-qa/metric-tsp-039', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/metric-tsp-039/default.png' })
  }
})
test('039 stage controls clear stale results and synchronize graph and table', async ({ page }) => {
  await button(page, 'Reset').click()
  await expect(button(page, 'Double tree')).toBeDisabled()
  await expect(button(page, 'Shortcut tour')).toBeDisabled()
  await expect(root(page).locator('.mt-mst-edge')).toHaveCount(0)
  await expect(root(page).locator('.mt-walk-edge')).toHaveCount(0)
  await expect(root(page).locator('.mt-tour-edge')).toHaveCount(0)
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('–')
  await expect(root(page).locator('.mt-table-scroll tbody tr')).toHaveCount(21)
  await button(page, 'Build MST').click()
  await expect(root(page).locator('.mt-mst-edge')).toHaveCount(6)
  await expect(root(page).locator('.mt-table-scroll tbody tr')).toHaveCount(6)
  await button(page, 'Double tree').click()
  await expect(root(page).locator('.mt-walk-edge')).toHaveCount(12)
  await expect(root(page).locator('.mt-tour-edge')).toHaveCount(0)
  await button(page, 'Shortcut tour').click()
  await expect(root(page).locator('.mt-tour-edge')).toHaveCount(7)
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('18.9')
  await button(page, 'Generate metric').click()
  await expect(root(page).locator('.mt-stage-note')).toContainText('Metric ready')
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('–')
})
test('039 independent legend controls change only the displayed layers', async ({ page }) => {
  for (const [name, selector, count] of [
    ['All edges (metric)', '.mt-faint-edge', 21],
    ['MST edges', '.mt-mst-edge', 6],
    ['Doubled walk (DFS)', '.mt-walk-edge', 12],
    ['Shortcut tour (TSP)', '.mt-tour-edge', 7],
  ] as const) {
    await button(page, name).click()
    await expect(root(page).locator(selector)).toHaveCount(0)
    await button(page, name).click()
    await expect(root(page).locator(selector)).toHaveCount(count)
  }
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('18.9')
})
test('039 city, edge and shortcut proof inspectors expose full precision', async ({ page }) => {
  await root(page).locator('.mt-city').first().focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('Coordinates: (0, 0)')
  await root(page).getByRole('dialog').getByRole('button', { name: 'Inspect metric edge 0–1', exact: true }).click()
  await expect(root(page).getByRole('dialog')).toContainText('2.23606797749979')
  await close(page)
  await button(page, 'Inspect detail edge 0–1 at row 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('In current MST: Yes')
  await close(page)
  await root(page).locator('.mt-tour-cost button').click()
  await expect(root(page).locator('.mt-shortcut-list button')).toHaveCount(7)
  await root(page).locator('.mt-shortcut-list button').last().click()
  await expect(root(page).getByRole('dialog')).toContainText('Metric edge 0–4')
  await close(page)
})
test('039 partial tree and walk sliders enforce valid stage transitions', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('MST edge step', { exact: true }).fill('2')
  await button(page, 'Return to metric graph').click()
  await expect(root(page).locator('.mt-mst-edge')).toHaveCount(2)
  await expect(button(page, 'Double tree')).toBeDisabled()
  await expect(root(page).locator('.mt-lower-bound')).toContainText('Accepted forest cost')
  await tab(page, 'Experiments')
  await root(page).getByLabel('DFS walk step', { exact: true }).fill('3')
  await button(page, 'Return to metric graph').click()
  await expect(root(page).locator('.mt-mst-edge')).toHaveCount(6)
  await expect(root(page).locator('.mt-walk-edge')).toHaveCount(3)
  await expect(button(page, 'Shortcut tour')).toBeDisabled()
  await tab(page, 'Experiments')
  await root(page).getByLabel('Detail table', { exact: true }).selectOption('walk')
  await button(page, 'Return to metric graph').click()
  await expect(root(page).locator('.mt-table-scroll tbody tr')).toHaveCount(3)
  await button(page, 'Double tree').click()
  await button(page, 'Shortcut tour').click()
  await expect(root(page).locator('.mt-tour-edge')).toHaveCount(7)
})
test('039 custom metric rejects invalid matrices and applies edits atomically', async ({ page }) => {
  await root(page).getByLabel('Metric TSP example').selectOption('custom')
  for (const [matrix, message] of [
    [
      [
        [0, 1, 8],
        [1, 0, 1],
        [8, 1, 0],
      ],
      'Triangle inequality',
    ],
    [
      [
        [0, 1, 2],
        [2, 0, 1],
        [2, 1, 0],
      ],
      'symmetric',
    ],
  ] as const) {
    await root(page)
      .getByLabel('Metric JSON', { exact: true })
      .fill(
        JSON.stringify({
          points: [
            [0, 0],
            [1, 0],
            [2, 0],
          ],
          source: 0,
          mode: 'matrix',
          matrix,
        }),
      )
    await button(page, 'Apply custom metric').click()
    await expect(root(page).getByRole('alert')).toContainText(message)
  }
  await root(page)
    .getByLabel('Metric JSON', { exact: true })
    .fill(
      JSON.stringify({
        points: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        source: 1,
        mode: 'matrix',
        matrix: [
          [0, 1, 2],
          [1, 0, 1],
          [2, 1, 0],
        ],
      }),
    )
  await button(page, 'Apply custom metric').click()
  await expect(root(page).locator('.mt-city')).toHaveCount(3)
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('4.0')
  await root(page).getByLabel('Metric TSP example').selectOption('custom')
  await expect(root(page).getByRole('dialog')).toBeVisible()
  await close(page)
})
test('039 presets, starting city and DFS order preserve metric guarantees', async ({ page }) => {
  await root(page).getByLabel('Metric TSP example').selectOption('square')
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('4.8')
  await expect(root(page).locator('.mt-lower-bound strong')).toHaveText('3.0')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Starting city', { exact: true }).selectOption('2')
  await root(page).getByLabel('Reverse DFS neighbor order', { exact: true }).check()
  await expect(root(page).locator('.mt-certificate')).toContainText('Tour / OPT = 1.000')
  await button(page, 'Return to metric graph').click()
  await expect(root(page).locator('.mt-tour-cost button')).toHaveText(/^2.*2$/)
  await root(page).getByLabel('Metric TSP example').selectOption('manhattan')
  await expect(root(page).locator('.mt-city')).toHaveCount(7)
  await root(page).getByLabel('Metric TSP example').selectOption('coincident')
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('0.0')
  await expect(root(page).locator('.mt-ratio')).toContainText('Zero-cost metric')
})
test('039 theory, prediction, playback and saved notes remain usable', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('MST ≤ OPT')
  await expect(root(page)).toContainText('Held–Karp')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('[...new Set(walk)]')
  await tab(page, 'Practice')
  await root(page).getByLabel('Your prediction').selectOption('opt')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Your prediction').selectOption('bound')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Metric TSP notes', { exact: true }).fill('Shortcutting never increases metric walk cost.')
  await root(page).getByLabel('Playback speed').selectOption('100')
  await button(page, 'Restart stages').click()
  await button(page, 'Play stages').click()
  await expect(root(page).locator('.mt-certificate')).toContainText('Stage: 3')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Metric TSP notes', { exact: true })).toHaveValue('Shortcutting never increases metric walk cost.')
})
test('039 singleton and nine-city inputs fit mobile and dark panels', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Edit metric JSON').click()
  await root(page)
    .getByLabel('Metric JSON', { exact: true })
    .fill(JSON.stringify({ mode: 'euclidean', source: 0, points: [[0, 0]] }))
  await button(page, 'Apply custom metric').click()
  await button(page, 'Return to metric graph').click()
  await expect(root(page).locator('.mt-city')).toHaveCount(1)
  await expect(root(page).locator('.mt-tour-cost strong')).toHaveText('0.0')
  await button(page, 'Reset').click()
  await button(page, 'Build MST').click()
  await button(page, 'Double tree').click()
  await button(page, 'Shortcut tour').click()
  await tab(page, 'Experiments')
  await button(page, 'Edit metric JSON').click()
  await root(page)
    .getByLabel('Metric JSON', { exact: true })
    .fill(
      JSON.stringify({ mode: 'euclidean', source: 8, points: Array.from({ length: 9 }, (_, i) => [(i % 3) * 1000 - 1000, Math.floor(i / 3) * 1000 - 1000]) }),
    )
  await button(page, 'Apply custom metric').click()
  await button(page, 'Switch to dark theme').click()
  await button(page, 'Return to metric graph').click()
  await expect(root(page).locator('.mt-city')).toHaveCount(9)
  await expect(root(page).locator('.mt-metric-edge')).toHaveCount(36)
  await expect(root(page).locator('.mt-tour-edge')).toHaveCount(9)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  mkdirSync('artifacts/visual-qa/metric-tsp-039', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/metric-tsp-039/${info.project.name}-dark.png`, fullPage: true })
})
