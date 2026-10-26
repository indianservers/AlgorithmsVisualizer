import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.reliability-design-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close reliability dialog').click()
async function apply(p: Page, n: string, b: string, probabilities: string) {
  await root(p).getByLabel('Number of reliability stages', { exact: true }).fill(n)
  await root(p).getByLabel('Total copy budget', { exact: true }).fill(b)
  await root(p).getByLabel('Stage probabilities', { exact: true }).fill(probabilities)
  await button(p, 'Run DP').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/reliability-design')
  await expect(root(page)).toBeVisible()
})
test('042 default panels synchronize the recurrence, chart and optimal copy allocation', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    'Problem Visualization',
    'Reliability vs Budget',
    'DP Table (Best Reliability R[i][b])',
    'Step-by-Step DP Recurrence',
    'Best Allocation (Optimal Solution)',
    'Correctness',
    'Complexity',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(6)
  await expect(root(page).locator('.rd-copy-piece strong')).toHaveText(['2', '3', '2', '3'])
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('0.8656')
  await expect(root(page).locator('.rd-chart-tooltip')).toContainText('Reliability = 0.8656')
  await expect(button(page, 'Inspect DP state R[4][10]')).toHaveText('0.866')
  await expect(button(page, 'Inspect DP state R[4][3]')).toHaveText('–')
  await expect(root(page).locator('.rd-component-letter')).toHaveCount(10)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.rd-toolbar', { x: 278, y: 11, width: 1380, height: 37 }],
      ['.rd-hero', { x: 265, y: 56, width: 1407, height: 72 }],
      ['.mom-tabs', { x: 274, y: 129, width: 1384, height: 52 }],
      ['.rd-problem', { x: 274, y: 191, width: 868, height: 345 }],
      ['.rd-chart', { x: 1151, y: 191, width: 507, height: 345 }],
      ['.rd-table-panel', { x: 274, y: 547, width: 769, height: 248 }],
      ['.rd-recurrence', { x: 1052, y: 547, width: 606, height: 250 }],
      ['.rd-allocation', { x: 274, y: 805, width: 769, height: 136 }],
      ['.rd-correctness', { x: 1052, y: 807, width: 316, height: 134 }],
      ['.rd-complexity', { x: 1377, y: 807, width: 281, height: 134 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    for (const category of ['Sorting', 'Searching', 'Data Structures', 'Graphs', 'Dynamic Programming', 'Strings'])
      await expect(
        page.getByRole('navigation', { name: 'Algorithm navigation', exact: true }).getByRole('button', { name: category, exact: true }),
      ).toBeInViewport()
    const proof = await root(page).locator('.rd-correctness p').boundingBox(),
      proofPanel = await root(page).locator('.rd-correctness').boundingBox()
    expect(proof!.y + proof!.height).toBeLessThanOrEqual(proofPanel!.y + proofPanel!.height)
    mkdirSync('artifacts/visual-qa/reliability-042', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/reliability-042/default.png' })
  }
})
test('042 editable input validates atomically and stage-count edits resize the probability list', async ({ page }) => {
  await root(page).getByLabel('Number of reliability stages', { exact: true }).fill('3')
  await expect(root(page).getByLabel('Stage probabilities', { exact: true })).toHaveValue('0.8, 0.7, 0.9')
  await root(page).getByLabel('Stage probabilities', { exact: true }).fill('0.8,1.2,0.9')
  await button(page, 'Run DP').click()
  await expect(root(page).getByRole('alert')).toContainText('between 0 and 1')
  await expect(root(page).locator('.rd-copy-piece strong')).toHaveText(['2', '3', '2', '3'])
  await apply(page, '2', '3', '0.8,0.5')
  await expect(root(page).locator('.rd-copy-piece strong')).toHaveText(['1', '2'])
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('0.6000')
  await root(page).getByLabel('Total copy budget', { exact: true }).fill('25')
  await button(page, 'Run DP').click()
  await expect(root(page).getByRole('alert')).toContainText('0 to 24')
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('0.6000')
  await button(page, 'Reset').click()
  await expect(root(page).getByLabel('Total copy budget', { exact: true })).toHaveValue('3')
})
test('042 DP and stage inspectors retain the actual transition certificate', async ({ page }) => {
  await button(page, 'Inspect DP state R[4][10]').click()
  await expect(root(page).getByRole('dialog')).toContainText('Best reliability 0.86555589; chosen copies for stage 4: 3')
  await expect(root(page).locator('.rd-candidate-scroll tbody tr')).toHaveCount(7)
  await expect(root(page).locator('.rd-best-candidate td').first()).toHaveText('3')
  await close(page)
  await button(page, 'Inspect DP state R[4][3]').click()
  await expect(root(page).getByRole('dialog')).toContainText('Infeasible')
  await close(page)
  await button(page, 'Inspect optimal copies for stage 2').click()
  await expect(root(page).getByRole('dialog')).toContainText('Parallel reliability 1 − (1 − p)ᵏ = 0.97300000')
  await close(page)
  await root(page).locator('.rd-stage').first().focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('Per-copy reliability p = 0.8')
  await close(page)
})
test('042 budget inspection distinguishes infeasibility and can apply a chart budget', async ({ page }) => {
  await button(page, 'Inspect reliability at budget 2').click()
  await expect(root(page).getByRole('dialog')).toContainText('Infeasible: 4 stages need at least 4 copies')
  await close(page)
  await tab(page, 'Experiments')
  await button(page, 'Budget 4: 0.3024').click()
  await expect(root(page).getByRole('dialog')).toContainText('Optimal copies [1, 1, 1, 1]')
  await button(page, 'Use this budget').click()
  await button(page, 'Return to reliability workspace').click()
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('0.3024')
  await expect(root(page).locator('.rd-copy-piece strong')).toHaveText(['1', '1', '1', '1'])
  await button(page, 'Explain the reliability budget chart').click()
  await expect(root(page).getByRole('dialog')).toContainText('Gray chart markers and table dashes denote infeasible budgets')
  await close(page)
})
test('042 initialization, manual fill and pause/resume never reveal stale results', async ({ page }) => {
  await button(page, 'Show Initialize phase').click()
  await expect(button(page, 'Inspect DP state R[0][10]')).toHaveText('1.000')
  await expect(button(page, 'Inspect DP state R[1][1]')).toBeDisabled()
  await expect(root(page).locator('.rd-allocation-pending')).toBeVisible()
  await tab(page, 'Experiments')
  await root(page).getByLabel('DP fill speed', { exact: true }).selectOption('700')
  await button(page, 'Restart table fill').click()
  await button(page, 'Next DP state').click()
  await expect(root(page).locator('.rd-fill-status')).toContainText('revealed cells: 11/55')
  await button(page, 'Return to reliability workspace').click()
  await button(page, 'Resume Fill').click()
  await button(page, 'Pause').click()
  await tab(page, 'Experiments')
  await root(page).getByLabel('DP fill speed', { exact: true }).selectOption('30')
  await button(page, 'Return to reliability workspace').click()
  await button(page, 'Resume Fill').click()
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('0.8656', { timeout: 10000 })
  await tab(page, 'Experiments')
  await root(page).getByLabel('Reliability fill event', { exact: true }).fill('2')
  await button(page, 'Return to reliability workspace').click()
  await expect(button(page, 'Inspect DP state R[1][0]')).toHaveText('–')
  await expect(button(page, 'Inspect DP state R[1][1]')).toBeDisabled()
})
test('042 zero reliability, perfect stages and insufficient budgets remain distinct', async ({ page }) => {
  await apply(page, '4', '3', '0.8,0.7,0.9,0.6')
  await expect(root(page).locator('.rd-allocation-pending')).toContainText('Infeasible')
  await tab(page, 'Experiments')
  await button(page, 'Zero reliability stage').click()
  await expect(root(page).locator('.rd-optimum-summary')).toContainText('reliability 0.0000; used 2, unused 2')
  await button(page, 'Perfect stages').click()
  await expect(root(page).locator('.rd-optimum-summary')).toContainText('reliability 1.0000; used 2, unused 8')
  await button(page, 'Return to reliability workspace').click()
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('1.0000')
})
test('042 theory, prediction and six-section navigation persist notes and progress', async ({ page }) => {
  await expect(root(page).locator('.rd-section-progress > span')).toHaveText('4 of 6 sections')
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('unused copies are permitted')
  await button(page, 'Explore the two-stage example').click()
  await expect(root(page).locator('.rd-final-reliability > strong')).toHaveText('0.6000')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('R[0].fill(1)')
  await button(page, 'Continue Learning').click()
  await expect(root(page).getByRole('heading', { name: 'Predict where one extra copy helps most' })).toBeVisible()
  await root(page).getByLabel('Your prediction').selectOption('first')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Your prediction').selectOption('second')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await tab(page, 'Notes')
  await root(page).getByLabel('Reliability design notes', { exact: true }).fill('Every stage needs one copy; failures must be independent.')
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Reliability design notes', { exact: true })).toHaveValue('Every stage needs one copy; failures must be independent.')
})
test('042 topic search and keyboard shortcut navigate to a matching lesson', async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(root(page).getByLabel('Search algorithm topics', { exact: true })).toBeFocused()
  await root(page).getByLabel('Search algorithm topics', { exact: true }).fill('suffix array')
  await root(page).locator('.rd-topic-results').getByRole('button', { name: 'Suffix Array', exact: true }).click()
  await expect(page.locator('.suffix-array-page')).toBeVisible()
})
test('042 maximum dimensions remain local to scrolling regions in dark mode', async ({ page }, info) => {
  await apply(page, '6', '24', '0.2,0.4,0.6,0.8,0.9,0.99')
  await expect(root(page).locator('.rd-stage')).toHaveCount(6)
  await expect(root(page).locator('.rd-table-scroll tbody tr')).toHaveCount(7)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await tab(page, 'Experiments')
  await button(page, 'Switch to dark theme').click()
  await button(page, 'Return to reliability workspace').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  mkdirSync('artifacts/visual-qa/reliability-042', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/reliability-042/${info.project.name}-dark.png`, fullPage: true })
})
