import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.linear-programming-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close LP inspector').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/linear-programming')
  await expect(root(page)).toBeVisible()
})
test('046 all mockup panels show the true continuous and integer optimum with a zero gap', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    '2D Linear Programming Visualization',
    'Linear Program',
    'Vertex Evaluation (Simplex Idea)',
    'Linear Relaxation vs Integer Solution',
    'Key Takeaways',
    'Applications',
    'Correctness',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.lp-vertex-table tbody td:last-child')).toHaveText(['0', '6', '8', '10'])
  await expect(root(page).locator('.lp-optimal-row td').first()).toHaveText('(2, 2)')
  await expect(root(page).locator('.lp-relaxation-table tbody tr').nth(1).locator('td').nth(1)).toHaveText('10')
  await expect(root(page).locator('.lp-relaxation-table tbody tr').last().locator('td').nth(1)).toHaveText('0')
  await expect(root(page).locator('.lp-mini-svg .lp-integer-dot')).toHaveCount(12)
  const polygon = await root(page).locator('.lp-main-svg .lp-region').getAttribute('points')
  const maxX = Math.max(...polygon!.split(' ').map((p) => Number(p.split(',')[0])))
  expect(maxX).toBeLessThanOrEqual(199)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.lp-page-header', { x: 276, y: 12, width: 1386, height: 45 }],
      ['.mom-tabs', { x: 276, y: 67, width: 1386, height: 53 }],
      ['.lp-main', { x: 276, y: 131, width: 1386, height: 481 }],
      ['.lp-plot-card', { x: 290, y: 205, width: 623, height: 356 }],
      ['.lp-program', { x: 926, y: 205, width: 338, height: 344 }],
      ['.lp-evaluation', { x: 1277, y: 205, width: 372, height: 344 }],
      ['.lp-relaxation', { x: 276, y: 625, width: 849, height: 305 }],
      ['.lp-mini-card', { x: 839, y: 636, width: 276, height: 278 }],
      ['.lp-takeaways', { x: 1135, y: 560, width: 515, height: 141 }],
      ['.lp-applications', { x: 1135, y: 712, width: 515, height: 120 }],
      ['.lp-correctness', { x: 1135, y: 843, width: 255, height: 85 }],
      ['.lp-complexity', { x: 1397, y: 843, width: 253, height: 85 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    await expect(
      page.getByRole('navigation', { name: 'Algorithm navigation', exact: true }).getByRole('link', { name: 'Home dashboard', exact: true }),
    ).toBeInViewport()
    await expect(page.locator('.sidebar-algorithm.active')).toBeInViewport()
    expect(
      await root(page)
        .locator('#account-label')
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true)
    mkdirSync('artifacts/visual-qa/linear-programming-046', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/linear-programming-046/default.png' })
  }
})
test('046 editable constraints apply atomically and produce a genuine fractional gap', async ({ page }) => {
  await root(page).getByRole('switch', { name: 'Animate Vertices', exact: true }).click()
  await root(page).getByLabel('Constraint 1 right-hand side', { exact: true }).fill('3.5')
  await expect(root(page).getByRole('status')).toContainText('Changes are pending')
  await button(page, 'Solve Example').click()
  await expect(root(page).locator('.lp-relaxation-table tbody tr').first().locator('td').nth(1)).toHaveText('9')
  await expect(root(page).locator('.lp-relaxation-table tbody tr').nth(1).locator('td').nth(1)).toHaveText('8')
  await expect(root(page).locator('.lp-relaxation-table tbody tr').last().locator('td').nth(1)).toHaveText('1')
  await root(page).getByLabel('Constraint 1 expression', { exact: true }).fill('x*y')
  await button(page, 'Solve Example').click()
  await expect(root(page).getByRole('alert')).toContainText('linear expression')
  await expect(root(page).locator('.lp-relaxation-table tbody tr').first().locator('td').nth(1)).toHaveText('9')
  await button(page, 'Reset').click()
  await expect(root(page).getByLabel('Constraint 1 expression', { exact: true })).toHaveValue('x + y')
  await expect(root(page).getByRole('alert')).toHaveCount(0)
})
test('046 objective direction and coefficient edits preserve valid optimization bounds', async ({ page }) => {
  await root(page).getByRole('switch', { name: 'Animate Vertices', exact: true }).click()
  await root(page).getByLabel('Objective direction', { exact: true }).selectOption('min')
  await button(page, 'Solve Example').click()
  await expect(root(page).locator('.lp-optimum-banner')).toContainText('Minimum value: z = 0')
  await expect(root(page).locator('.lp-relaxation-table tbody tr').last()).toContainText('Integer − LP = 0')
  await root(page).getByLabel('Objective direction', { exact: true }).selectOption('max')
  await root(page).getByLabel('Objective expression', { exact: true }).fill('x + y')
  await button(page, 'Solve Example').click()
  await root(page).locator('.lp-optimum-banner').click()
  await expect(root(page).getByRole('dialog')).toContainText('Multiple optimal vertices')
  await close(page)
  await root(page).getByLabel('Objective expression', { exact: true }).fill('21x')
  await button(page, 'Solve Example').click()
  await expect(root(page).getByRole('alert')).toContainText('coefficients')
})
test('046 capacity-free editing adds and removes up to eight independently validated constraints', async ({ page }) => {
  for (let i = 0; i < 4; i++) await button(page, 'Add constraint').click()
  await expect(root(page).locator('.lp-constraint-row')).toHaveCount(8)
  await expect(button(page, 'Add constraint')).toBeDisabled()
  expect(
    await root(page)
      .locator('.lp-constraint-list')
      .evaluate((e) => e.scrollHeight > e.clientHeight),
  ).toBe(true)
  await button(page, 'Remove constraint 8').click()
  await expect(root(page).locator('.lp-constraint-row')).toHaveCount(7)
  await root(page).getByRole('switch', { name: 'Animate Vertices', exact: true }).click()
  await button(page, 'Solve Example').click()
  await expect(root(page).locator('.lp-optimum-banner')).toContainText('z = 10')
  await button(page, 'Reset to example').click()
  await expect(root(page).locator('.lp-constraint-row')).toHaveCount(4)
})
test('046 graph, constraint and dual inspectors expose true feasibility certificates', async ({ page }) => {
  await button(page, 'Inspect vertex (2, 2)').focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('Objective value: 10')
  await expect(root(page).getByRole('dialog')).toContainText('x + y = 4 ≤ 4')
  await close(page)
  await root(page).locator('.lp-optimum-banner').click()
  await expect(root(page).getByRole('dialog')).toContainText('2 × (x + y ≤ 4)')
  await expect(root(page).getByRole('dialog')).toContainText('1 × (x ≤ 2)')
  await expect(root(page).getByRole('dialog')).toContainText('Weighted bound: 10')
  await close(page)
  await button(page, 'Inspect constraint 2').focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('Slack at the optimum: 0')
  await page.keyboard.press('Escape')
  await expect(root(page).getByRole('dialog')).not.toBeVisible()
  await button(page, 'Inspect integer optimum').click()
  await expect(root(page).getByRole('dialog')).toContainText('Integer-point certificate (2, 2)')
  await close(page)
})
test('046 display switches and vertex animation synchronize revealed objective values', async ({ page }) => {
  await root(page).getByLabel('Show Feasible Region', { exact: true }).uncheck()
  await expect(root(page).locator('.lp-region')).toHaveCount(0)
  await root(page).getByLabel('Show Feasible Region', { exact: true }).check()
  await root(page).getByLabel('Show Objective Contours', { exact: true }).uncheck()
  await expect(root(page).locator('.lp-contour')).toHaveCount(0)
  await root(page).getByLabel('Show Objective Contours', { exact: true }).check()
  await expect(root(page).locator('.lp-contour')).toHaveCount(3)
  await button(page, 'Solve Example').click()
  await expect(root(page).locator('.lp-vertex-table tbody tr').last().locator('td').last()).toHaveText('·')
  await expect(root(page).locator('.lp-vertex-table tbody tr').last().locator('td').last()).toHaveText('10', { timeout: 5000 })
  await button(page, 'Evaluate vertex (2, 0)').click()
  await expect(root(page).locator('.lp-active-point')).toHaveCount(1)
})
test('046 infeasible and unbounded programs are distinct from finite optima on unbounded regions', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Infeasible').click()
  await expect(root(page).locator('.lp-optimum-banner')).toContainText('Infeasible program')
  await expect(root(page).locator('.lp-main-svg .lp-region')).toHaveCount(0)
  await tab(page, 'Experiments')
  await button(page, 'Unbounded objective').click()
  await expect(root(page).locator('.lp-optimum-banner')).toContainText('Unbounded objective')
  await root(page).locator('.lp-optimum-banner').click()
  await expect(root(page).getByRole('dialog')).toContainText('Improving direction:')
  await close(page)
  await tab(page, 'Experiments')
  await button(page, 'Bounded objective, unbounded region').click()
  await expect(root(page).locator('.lp-optimum-banner')).toContainText('Optimal point: (4, 0)')
  await expect(root(page).locator('.lp-vertex-table tbody tr')).toHaveCount(0)
  await expect(button(page, 'Inspect optimal point')).toBeVisible()
  await expect(root(page).locator('.lp-relaxation-table')).toContainText('not enumerated')
  await tab(page, 'Experiments')
  await button(page, 'No integer point').click()
  await expect(root(page).locator('.lp-relaxation-table')).toContainText('No integer solution')
})
test('046 infeasible intersections, negative coordinates and integer search limits stay explicit', async ({ page }) => {
  await tab(page, 'Experiments')
  await root(page).getByLabel('Include infeasible intersections', { exact: true }).check()
  await button(page, 'Inspect the current plot').click()
  await expect(root(page).locator('.lp-vertex-table tbody tr')).toHaveCount(5)
  await button(page, 'Evaluate vertex (4, 0)').click()
  await expect(root(page).getByLabel('Infeasible', { exact: true })).toBeVisible()
  await tab(page, 'Experiments')
  await button(page, 'Negative coordinates').click()
  await expect(root(page).locator('.lp-optimum-banner')).toContainText('z = 14')
  await expect(root(page).locator('.lp-main-svg .lp-bound-label')).toContainText(['x ≥ -3', 'x ≤ 2', 'y ≥ -2', 'y ≤ 4'])
  await tab(page, 'Experiments')
  await button(page, 'Large integer search').click()
  await expect(root(page).locator('.lp-relaxation-table')).toContainText('Grid exceeds search limit')
  await tab(page, 'Experiments')
  await button(page, 'Inspect integer enumeration').click()
  await expect(root(page).getByRole('dialog')).toContainText('40,000-candidate search limit')
  await close(page)
})
test('046 theory, worked examples, application details, code, prediction and notes remain usable', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('also integer feasible')
  await button(page, 'Try a fractional optimum').click()
  await expect(root(page).locator('.lp-relaxation-table tbody tr').last()).toContainText('LP − Integer = 1')
  await button(page, 'Resource allocation (production planning, workforce planning)').click()
  await expect(root(page).getByRole('dialog')).toContainText('production quantities')
  await close(page)
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('INFEASIBLE')
  await tab(page, 'Practice')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Choose a prediction')
  await button(page, '8').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await button(page, '10').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Notes')
  await root(page).getByLabel('Your linear-programming notes', { exact: true }).fill('Integer feasible optima have no relaxation gap.')
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Your linear-programming notes', { exact: true })).toHaveValue('Integer feasible optima have no relaxation gap.')
})
test('046 keyboard search and mobile dark mode preserve all editable components', async ({ page }, info) => {
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  mkdirSync('artifacts/visual-qa/linear-programming-046', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/linear-programming-046/${info.project.name}-dark.png`, fullPage: true })
  await page.keyboard.press('Control+k')
  await expect(root(page).getByLabel('Search algorithm topics', { exact: true })).toBeFocused()
  await root(page).getByLabel('Search algorithm topics', { exact: true }).fill('suffix array')
  await page.keyboard.press('Enter')
  await expect(page.locator('.suffix-array-page')).toBeVisible()
})
