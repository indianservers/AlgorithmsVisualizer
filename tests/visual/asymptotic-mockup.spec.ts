import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/asymptotic-notation')
})
test('003 reference composition includes all panels, curves and notation controls', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.growth-page')
  for (const name of ['Growth Rate Visualization', 'Key Takeaways', 'Concept Summary', 'Worked Example', 'Common Mistakes', 'Key Definitions & Formulas'])
    await expect(root.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root.locator('.an-tabs button')).toHaveCount(5)
  await expect(root.locator('.an-function-legend input')).toHaveCount(6)
  await expect(root.locator('.an-plot path[data-function]')).toHaveCount(6)
  await expect(root.locator('.an-definitions>button')).toHaveCount(5)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 322, y: 64, width: 1336, height: 156 }],
      ['.an-tabs', { x: 322, y: 232, width: 664, height: 43 }],
      ['.an-chart', { x: 322, y: 288, width: 1027, height: 324 }],
      ['.an-takeaways', { x: 1360, y: 235, width: 298, height: 432 }],
      ['.an-concept', { x: 322, y: 627, width: 372, height: 242 }],
      ['.an-worked', { x: 704, y: 627, width: 373, height: 242 }],
      ['.an-mistakes', { x: 1087, y: 627, width: 571, height: 242 }],
      ['.an-definitions', { x: 322, y: 877, width: 1336, height: 56 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    const worked = await root.locator('.an-worked').boundingBox(),
      result = await root.locator('.an-worked-result').boundingBox(),
      footer = await root.locator('.an-definitions').boundingBox()
    expect(result!.y + result!.height).toBeLessThanOrEqual(worked!.y + worked!.height)
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(941)
    const siteFooter = await page.locator('.aimer-site-footer').boundingBox()
    expect(siteFooter!.y).toBeGreaterThanOrEqual(941)
  }
  await page.screenshot({ path: `artifacts/visual-qa/asymptotic-003/${info.project.name}-learn.png` })
})
test('003 scale, range and visibility controls change actual paths and handle no selected curves', async ({ page }) => {
  const root = page.locator('.growth-page'),
    path = root.locator('.an-plot path[data-function=quadratic]'),
    log = await path.getAttribute('d')
  await root.getByRole('button', { name: 'Linear', exact: true }).click()
  expect(await path.getAttribute('d')).not.toBe(log)
  await expect(root.locator('.an-plot')).toHaveAttribute('aria-label', 'Linear asymptotic growth chart')
  await root.getByLabel('Growth input range', { exact: true }).selectOption('20')
  expect(await path.getAttribute('d')).not.toBe(log)
  for (const checkbox of await root.locator('.an-function-legend input').all()) await checkbox.uncheck()
  await expect(root.locator('.an-plot path[data-function]')).toHaveCount(0)
  await expect(root.locator('.an-chart-domain-note')).toContainText('No curves selected')
  await root.getByRole('checkbox', { name: /O\(n²\)/ }).check()
  await expect(path).toHaveCount(1)
})
test('003 editable numeric inspection and vertical clipping retain exact representative values', async ({ page }) => {
  const root = page.locator('.growth-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Inspect input n', { exact: true }).fill('10')
  await expect(root.locator('.an-value-table tbody tr').first()).toContainText('1024')
  await root.getByLabel('Vertical chart ceiling', { exact: true }).selectOption('1000')
  await expect(root.locator('.an-chart-domain-note')).toContainText('1000')
  await root.getByLabel('Inspect input n', { exact: true }).fill('1000')
  await expect(root.locator('.an-value-table tbody tr').first()).toContainText('e301')
  await root.getByLabel('Growth input range', { exact: true }).selectOption('20')
  await expect(root.getByLabel('Inspect input n', { exact: true })).toHaveValue('20')
})
test('003 pairwise comparison distinguishes strict domination, tight order and reverse bounds', async ({ page }) => {
  const root = page.locator('.growth-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.an-limit')).toContainText('0')
  await expect(root.locator('.an-memberships button').nth(0)).toHaveAttribute('data-holds', 'true')
  await expect(root.locator('.an-memberships button').nth(2)).toHaveAttribute('data-holds', 'false')
  await expect(root.locator('.an-memberships button').nth(3)).toHaveAttribute('data-holds', 'true')
  await root.getByLabel('Comparison function f', { exact: true }).selectOption('quadratic')
  await expect(root.locator('.an-limit')).toContainText('1')
  await expect(root.locator('.an-memberships button').nth(2)).toHaveAttribute('data-holds', 'true')
  await expect(root.locator('.an-memberships button').nth(3)).toHaveAttribute('data-holds', 'false')
  await root.getByLabel('Comparison function g', { exact: true }).selectOption('linear')
  await expect(root.locator('.an-limit')).toContainText('∞')
  await expect(root.locator('.an-memberships button').nth(4)).toHaveAttribute('data-holds', 'true')
})
test('003 editable polynomial certificates verify thresholds and reject invalid leading constants', async ({ page }) => {
  const root = page.locator('.growth-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.an-certificate')).toContainText('c = 10, n₀ = 1')
  await root.getByLabel('Candidate bound constant c', { exact: true }).fill('5')
  await expect(root.locator('.an-certificate')).toContainText('c = 5, n₀ = 2')
  await root.getByLabel('Candidate bound constant c', { exact: true }).fill('3')
  await expect(root.locator('.an-certificate')).toHaveClass(/invalid/)
  await expect(root.locator('.an-certificate')).toContainText('strictly above')
  await root.getByLabel('Candidate bound constant c', { exact: true }).fill('3.0000000000000004')
  await expect(root.getByLabel('Candidate bound constant c', { exact: true })).toHaveValue('3')
  await root.getByLabel('Linear coefficient b', { exact: true }).fill('0')
  await root.getByLabel('Constant term d', { exact: true }).fill('0')
  await expect(root.locator('.an-certificate')).toContainText('c = 3, n₀ = 1')
  await root.getByLabel('Leading power p', { exact: true }).selectOption('5')
  await expect(root.locator('.an-bound-proof>h3')).toHaveText('f(n) = 3n⁵')
})
test('003 notation and worked-example dialogs support keyboard closing and formal quantifiers', async ({ page }) => {
  const root = page.locator('.growth-page')
  await root.getByRole('button', { name: 'Open o definition', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Asymptotic notation details', exact: true })
  await expect(dialog).toContainText('∀ c > 0, ∃ n₀')
  await expect(dialog).toContainText('order of the quantifiers matters')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await root.getByRole('button', { name: 'Open worked bound example', exact: true }).click()
  await expect(dialog).toContainText('c = 10, n₀ = 1')
  await dialog.getByLabel('Candidate bound constant c', { exact: true }).fill('5')
  await expect(dialog).toContainText('c = 5, n₀ = 2')
  await dialog.getByRole('button', { name: 'Close notation details', exact: true }).click()
  await root.getByRole('button', { name: 'See more examples', exact: true }).click()
  await expect(dialog).toContainText('matching Ω(n²) bound')
})
test('003 prediction, quiz and persistent notes explain the formal results', async ({ page }) => {
  const root = page.locator('.growth-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted threshold n₀', { exact: true }).fill('1')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByRole('button', { name: 'f ∈ O(g) and f ∈ o(g)', exact: false }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root
    .getByLabel('Record the functions, bound constants, threshold, and strict or tight relationship.', { exact: true })
    .fill('n is little-o of n²; c=10 and n₀=1 certify the cubic example.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.locator('textarea')).toHaveValue('n is little-o of n²; c=10 and n₀=1 certify the cubic example.')
})
test('003 dark theme remains usable on small screens', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/asymptotic-003/${info.project.name}-dark.png` })
})
