import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.vertex-cover-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close vertex cover dialog').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/vertex-cover-approximation')
  await expect(root(page)).toBeVisible()
})
test('038 default has a valid matching and consistent cover across every panel', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of [
    'Interactive Visualization',
    'How it works',
    'Key insight',
    'Algorithm state',
    'Chosen vertices (vertex cover)',
    'Coverage summary',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.vc-vertex')).toHaveCount(6)
  await expect(root(page).locator('.vc-edge')).toHaveCount(8)
  await expect(root(page).locator('.vc-matching-edge')).toHaveCount(2)
  await expect(root(page).locator('.vc-in-cover')).toHaveCount(4)
  await expect(root(page).locator('.vc-summary dd')).toHaveText(['6', '8', '2', '0', '8'])
  await expect(root(page).locator('.vc-chips button')).toHaveText(['0', '1', '3', '4'])
  await expect(root(page).locator('.vc-result')).toContainText('size 4')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.vc-visualization', { x: 286, y: 136, width: 887, height: 498 }],
      ['.vc-canvas-scroll', { x: 299, y: 210, width: 861, height: 365 }],
      ['.vc-how', { x: 1187, y: 136, width: 386, height: 304 }],
      ['.vc-insight', { x: 1187, y: 453, width: 386, height: 168 }],
      ['.vc-state', { x: 286, y: 646, width: 626, height: 183 }],
      ['.vc-chosen', { x: 925, y: 646, width: 303, height: 183 }],
      ['.vc-result', { x: 286, y: 839, width: 942, height: 87 }],
      ['.vc-summary', { x: 1241, y: 634, width: 332, height: 164 }],
      ['.vc-complexity', { x: 1241, y: 809, width: 332, height: 117 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    mkdirSync('artifacts/visual-qa/vertex-cover-038', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/vertex-cover-038/default.png' })
  }
})
test('038 selection is pending until stepped, and history rewinds all state', async ({ page }) => {
  await button(page, 'Select edge').click()
  await expect(root(page).locator('.vc-pending')).toContainText('(0, 1)')
  await expect(root(page).locator('.vc-summary dd')).toHaveText(['6', '8', '0', '8', '0'])
  await button(page, 'Step approximation').click()
  await expect(root(page).locator('.vc-summary dd')).toHaveText(['6', '8', '1', '4', '4'])
  await button(page, 'Step approximation').click()
  await expect(root(page).locator('.vc-chips button')).toHaveText(['0', '1', '3', '4'])
  await button(page, 'Show cover step 1').click()
  await expect(root(page).locator('.vc-result')).toContainText('4 uncovered edges remain')
  await button(page, 'Reset').click()
  await expect(root(page).locator('.vc-in-cover')).toHaveCount(0)
})
test('038 graph toggles preserve the cover and actual edge state', async ({ page }) => {
  await root(page).getByLabel('Show matching', { exact: true }).uncheck()
  await expect(root(page).locator('.vc-matching-edge')).toHaveCount(0)
  await expect(root(page).locator('.vc-in-cover')).toHaveCount(4)
  await root(page).getByLabel('Show uncovered only', { exact: true }).check()
  await expect(root(page).locator('.vc-edge')).toHaveCount(0)
  await expect(root(page).locator('.vc-no-edges')).toBeVisible()
  await button(page, 'Reset').click()
  await expect(root(page).locator('.vc-edge')).toHaveCount(8)
  await button(page, 'Step approximation').click()
  await expect(root(page).locator('.vc-edge')).toHaveCount(4)
})
test('038 edge and vertex inspectors support manual matching choices', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Edge 5: (2, 4) — covered').click()
  await expect(root(page).getByRole('dialog')).toContainText('Status: covered')
  await button(page, 'Restart with this edge').click()
  await button(page, 'Return to cover graph').click()
  await button(page, 'Step approximation').click()
  await expect(root(page).locator('.vc-chips button')).toHaveText(['2', '4'])
  await button(page, 'Inspect chosen vertex 4').click()
  await expect(root(page).getByRole('dialog')).toContainText('Degree: 4. In cover: Yes.')
  await root(page).getByRole('dialog').getByRole('button', { name: 'Inspect edge 0–4', exact: true }).click()
  await expect(root(page).getByRole('dialog')).toContainText('already has a selected endpoint')
  await close(page)
  await button(page, 'Reset').click()
  await root(page).locator('.vc-edge').first().focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toBeVisible()
  await close(page)
})
test('038 custom JSON applies atomically and rejects malformed and non-simple graphs', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Edit graph JSON').click()
  await root(page).getByLabel('Graph JSON', { exact: true }).fill('{"vertices":2,"edges":[[0,0]]}')
  await button(page, 'Apply custom graph').click()
  await expect(root(page).getByRole('alert')).toContainText('self-loops')
  await root(page).getByLabel('Graph JSON', { exact: true }).fill('{"vertices":2,"edges":[[0,1],[1,0]]}')
  await button(page, 'Apply custom graph').click()
  await expect(root(page).getByRole('alert')).toContainText('duplicate')
  await root(page).getByLabel('Graph JSON', { exact: true }).fill('{"vertices":8,"edges":[[0,7],[2,5]]}')
  await button(page, 'Apply custom graph').click()
  await expect(root(page).getByRole('dialog')).not.toBeVisible()
  await button(page, 'Return to cover graph').click()
  await expect(root(page).locator('.vc-summary dd')).toHaveText(['8', '2', '2', '0', '2'])
  await expect(root(page).locator('.vc-vertex')).toHaveCount(8)
})
test('038 tight star, edgeless graphs and edge order expose the actual guarantee', async ({ page }) => {
  await root(page).getByLabel('Vertex cover graph example').selectOption('star')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.vc-certificate')).toContainText('Approximation ratio: 2.000')
  await button(page, 'Return to cover graph').click()
  await root(page).getByLabel('Vertex cover graph example').selectOption('path')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.vc-certificate')).toContainText('Final cover size 6')
  await button(page, 'Reverse edge order').click()
  await expect(root(page).locator('.vc-certificate')).toContainText('Final cover size 6')
  await button(page, 'Return to cover graph').click()
  await root(page).getByLabel('Vertex cover graph example').selectOption('empty')
  await expect(button(page, 'Select edge')).toBeDisabled()
  await expect(button(page, 'Step approximation')).toBeDisabled()
  await expect(root(page).locator('.vc-summary dd')).toHaveText(['4', '0', '0', '0', '0'])
  await tab(page, 'Experiments')
  await expect(root(page).locator('.vc-certificate')).toContainText('OPT = 0')
})
test('038 playback, learning and prediction work with persisted notes', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('Maximal means no extension is possible')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('cover.has(u) || cover.has(v)')
  await tab(page, 'Practice')
  await root(page).getByLabel('Your prediction').selectOption('2,2')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Your prediction').selectOption('2,1')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Vertex cover notes', { exact: true }).fill('Matching edges lower-bound OPT.')
  await root(page).getByLabel('Playback speed').selectOption('100')
  await button(page, 'Restart trace').click()
  await button(page, 'Play from current step').click()
  await expect(root(page).locator('.vc-certificate')).toContainText('Current step: 2')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Vertex cover notes', { exact: true })).toHaveValue('Matching edges lower-bound OPT.')
})
test('038 mobile stays within viewport and dark mode keeps panels readable', async ({ page }, info) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await tab(page, 'Experiments')
  await button(page, 'Switch to dark theme').click()
  await button(page, 'Return to cover graph').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(
    await root(page)
      .locator('.vc-panel')
      .first()
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).not.toBe('rgb(255, 255, 255)')
  mkdirSync('artifacts/visual-qa/vertex-cover-038', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/vertex-cover-038/${info.project.name}-dark.png`, fullPage: true })
})

test('038 maximum-size inputs remain inspectable and custom graphs can be edited again', async ({ page }) => {
  const edges: number[][] = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ]
  for (let u = 0; u < 8; u++) for (let v = u + 1; v < 8; v++) if (edges.length < 20 && !edges.some(([a, b]) => a === u && b === v)) edges.push([u, v])
  await tab(page, 'Experiments')
  await button(page, 'Edit graph JSON').click()
  await root(page)
    .getByLabel('Graph JSON', { exact: true })
    .fill(JSON.stringify({ vertices: 8, edges }))
  await button(page, 'Apply custom graph').click()
  await button(page, 'Return to cover graph').click()
  await expect(root(page).locator('.vc-in-cover')).toHaveCount(8)
  await expect(root(page).locator('.vc-chips button')).toHaveCount(8)
  await expect(root(page).locator('.vc-summary dd')).toHaveText(['8', '20', '4', '0', '20'])
  const chosen = await root(page).locator('.vc-chosen').boundingBox(),
    last = await root(page).locator('.vc-chosen>p').boundingBox()
  expect(last!.y + last!.height).toBeLessThanOrEqual(chosen!.y + chosen!.height)
  await root(page).getByLabel('Vertex cover graph example').selectOption('custom')
  await expect(root(page).getByRole('dialog')).toBeVisible()
  await root(page).getByLabel('Graph JSON', { exact: true }).fill('{"vertices":1,"edges":[]}')
  await button(page, 'Apply custom graph').click()
  await expect(root(page).locator('.vc-vertex')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
