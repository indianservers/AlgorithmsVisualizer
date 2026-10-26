import { test, expect, type Page } from '@playwright/test'
const root = (p: Page) => p.locator('.eulerian-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  preset = (p: Page, name: string) => root(p).getByLabel('Eulerian graph example', { exact: true }).selectOption(name)

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/eulerian-trail')
  await expect(root(page)).toBeVisible()
})

test('032 reference panels and default trace match the four-edge circuit', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of ['Interactive Visualization', 'How it works', 'Key insight', 'Current trail', 'Degree check', 'Complexity'])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.eu-vertex')).toHaveCount(4)
  await expect(root(page).locator('.eu-edge')).toHaveCount(4)
  await expect(root(page).locator('.eu-active-edge')).toHaveAttribute('data-euler-edge', '1')
  await expect(root(page).locator('.eu-trail-strip b')).toHaveText(['0', '1', '2'])
  await expect(root(page).locator('.eu-history-table tbody tr').last().locator('td')).toHaveText(['2', '1 → 2', '2', '[0, 1, 2]'])
  await expect(root(page).locator('.eu-degree-table tbody tr')).toHaveCount(4)
  await expect(root(page).locator('.eu-degree-status')).toContainText('Eulerian circuit exists')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.eu-topbar', { x: 282, y: 17, width: 1289, height: 48 }],
      ['.eu-visualization', { x: 282, y: 138, width: 869, height: 484 }],
      ['.eu-graph-canvas', { x: 295, y: 211, width: 845, height: 344 }],
      ['.eu-how', { x: 1165, y: 138, width: 406, height: 330 }],
      ['.eu-insight', { x: 1165, y: 475, width: 406, height: 148 }],
      ['.eu-trail-panel', { x: 282, y: 635, width: 528, height: 285 }],
      ['.eu-degree-panel', { x: 821, y: 635, width: 355, height: 285 }],
      ['.eu-complexity', { x: 1187, y: 635, width: 384, height: 285 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
    expect((await page.locator('.aimer-site-footer').boundingBox())!.y).toBe(934)
  }
})

test('032 step, playback, history inspection and reset track actual used edges', async ({ page }) => {
  await button(page, 'Step').click()
  await expect(root(page).locator('.eu-trail-strip b')).toHaveText(['0', '1', '2', '3'])
  await button(page, 'Show Eulerian step 1').click()
  await expect(root(page).locator('.eu-trail-strip b')).toHaveText(['0', '1'])
  await tab(page, 'Experiments')
  await root(page).getByLabel('Eulerian playback speed').selectOption('100')
  await tab(page, 'Visualization')
  await button(page, 'Start').click()
  await expect(button(page, 'Pause')).toBeVisible()
  await expect(button(page, 'Start')).toBeVisible({ timeout: 10000 })
  await expect(root(page).locator('.eu-used-edge')).toHaveCount(4)
  await expect(root(page).locator('.eu-trail-strip b')).toHaveText(['0', '1', '2', '3', '0'])
  await button(page, 'Reset').click()
  await expect(root(page).locator('.eu-trail-strip b')).toHaveText(['0', '1', '2'])
})

test('032 edge and degree toggles and vertex/edge inspection are functional', async ({ page }) => {
  await root(page).getByLabel('Show used edges', { exact: true }).uncheck()
  await expect(root(page).locator('.eu-used-edge')).toHaveCount(0)
  await expect(root(page).locator('.eu-active-edge')).toHaveCount(1)
  await root(page).getByLabel('Show vertex degree', { exact: true }).uncheck()
  await expect(root(page).locator('.eu-degree-chip')).toHaveCount(0)
  await button(page, 'Inspect degree vertex 1').click()
  await expect(page.getByRole('dialog')).toContainText('Degree: 2. Even degree.')
  await button(page, 'Use as starting vertex').click()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Eulerian starting vertex')).toHaveValue('1')
  await button(page, 'Inspect edge 1: 0 — 1').click()
  await expect(page.getByRole('dialog')).toContainText('Consumed at current step: yes')
  await button(page, 'Close Eulerian dialog').click()
  await tab(page, 'Visualization')
  await button(page, 'Reset').click()
  await expect(root(page).locator('.eu-degree-chip')).toHaveCount(4)
})

test('032 open trails require an odd endpoint and disconnected even graphs fail', async ({ page }) => {
  await preset(page, 'open')
  await expect(root(page).locator('.eu-odd-row')).toHaveCount(2)
  await expect(root(page).locator('.eu-degree-status')).toContainText('Open Eulerian trail exists')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Eulerian starting vertex').selectOption('1')
  await expect(root(page)).toContainText('start at an odd-degree endpoint')
  await tab(page, 'Visualization')
  await expect(button(page, 'Start')).toBeDisabled()
  await expect(root(page).locator('.eu-example-result')).not.toContainText('0 → 1 → 2 → 3')
  await preset(page, 'odd')
  await expect(root(page).locator('.eu-degree-status')).toContainText('4 odd-degree vertices')
  await expect(button(page, 'Step')).toBeDisabled()
  await preset(page, 'disconnected')
  await expect(root(page).locator('.eu-odd-row')).toHaveCount(0)
  await expect(root(page).locator('.eu-degree-status')).toContainText('different connected components')
  await expect(button(page, 'Start')).toBeDisabled()
})

test('032 parallel IDs, loops and cycle splicing retain a valid final edge order', async ({ page }) => {
  await preset(page, 'parallel')
  await expect(root(page).locator('.eu-degree-table tbody tr').first().locator('td')).toHaveText(['0', '4', 'No'])
  await tab(page, 'Experiments')
  await button(page, 'Jump to final trail').click()
  await expect(root(page).locator('.eu-run-summary')).toContainText('Used edges: 4 / 4')
  await expect(root(page)).toContainText('Final edge IDs: 1 → 2 → 4 → 3')
  await button(page, 'Inspect edge 1: 0 — 0').click()
  await expect(page.getByRole('dialog')).toContainText('Consumed at current step: yes')
  await button(page, 'Close Eulerian dialog').click()
  await tab(page, 'Visualization')
  await preset(page, 'splice')
  await tab(page, 'Experiments')
  await button(page, 'Jump to final trail').click()
  await expect(root(page)).toContainText('Final trail: 0 → 1 → 3 → 4 → 1 → 2 → 0')
  await expect(root(page)).toContainText('Final edge IDs: 1 → 4 → 5 → 6 → 2 → 3')
  await tab(page, 'Visualization')
  await button(page, 'Inspect worked Eulerian result').click()
  await expect(page.getByRole('dialog')).toContainText('reversing the popped vertices')
  await button(page, 'Replay the traversal').click()
  await expect(root(page).locator('.eu-trail-strip b')).toHaveText(['0'])
})

test('032 custom JSON validates bounds and supports empty-edge graphs', async ({ page }) => {
  await preset(page, 'custom')
  const editor = root(page).getByLabel('Eulerian graph JSON')
  for (const invalid of [
    'not JSON',
    '{"vertices":9,"start":null,"edges":[]}',
    '{"vertices":2,"start":null,"edges":[[0,2]]}',
    '{"vertices":2,"start":null,"edges":[],"directed":true}',
  ]) {
    await editor.fill(invalid)
    await button(page, 'Apply Eulerian graph').click()
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
  }
  await editor.fill(JSON.stringify({ vertices: 3, start: null, edges: [] }))
  await button(page, 'Apply Eulerian graph').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(root(page).locator('.eu-edge')).toHaveCount(0)
  await expect(root(page).locator('.eu-example-result')).toContainText('0')
  await tab(page, 'Experiments')
  await expect(root(page)).toContainText('zero-length trail')
  await root(page).getByLabel('Eulerian starting vertex').selectOption('2')
  await expect(root(page)).toContainText('Final trail: 2.')
})

test('032 learning, code, prediction and notes are usable and notes persist', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('every edge exactly once')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('used')
  await tab(page, 'Practice')
  await root(page).getByLabel('Eulerian start prediction').fill('1')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Eulerian start prediction').fill('2')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Eulerian trail notes').fill('Loops add two to degree.')
  await button(page, 'Mark section reviewed').click()
  await expect(button(page, 'Section reviewed')).toBeVisible()
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Eulerian trail notes')).toHaveValue('Loops add two to degree.')
})

test('032 maximum-size graphs and invalid status stay within narrow dark layouts', async ({ page }, info) => {
  await preset(page, 'custom')
  await root(page)
    .getByLabel('Eulerian graph JSON')
    .fill(JSON.stringify({ vertices: 8, start: null, edges: Array.from({ length: 20 }, () => [0, 0]) }))
  await button(page, 'Apply Eulerian graph').click()
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await button(page, 'Jump to final trail').click()
  await tab(page, 'Visualization')
  await expect(root(page).locator('.eu-used-edge')).toHaveCount(20)
  for (const width of [1280, 1024, 768, 393, 320]) {
    await page.setViewportSize({ width, height: 950 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/eulerian-032/${info.project.name}-dark.png` })
  await preset(page, 'disconnected')
  await expect(root(page).locator('.eu-degree-status')).toContainText('different connected components')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
