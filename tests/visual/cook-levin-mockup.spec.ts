import { test, expect, type Page } from '@playwright/test'
const root = (page: Page) => page.locator('.cook-levin-page')
const button = (page: Page, name: string) => root(page).getByRole('button', { name, exact: true })
const tab = (page: Page, name: string) => button(page, name).click()
const close = (page: Page) => button(page, 'Close Cook-Levin dialog').click()

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/complexity-theory/cook-levin')
  await expect(root(page)).toBeVisible()
})

test('027 contains reference panels at reference positions and a real accepting tableau', async ({ page }, info) => {
  await page.screenshot({ path: `artifacts/visual-qa/cook-levin-027/${info.project.name}-visualization.png`, fullPage: true })
  for (const heading of [
    'Interactive Visualization',
    'Nondeterministic Computation (TM Tableau)',
    'Local Constraints → Boolean Formula',
    'SAT Outcome',
    'Explore the Tableau',
    'Key Takeaways',
    'Worked Example',
    'Correctness & Proof Structure',
    'Concepts and Pitfalls',
  ])
    await expect(root(page).getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root(page).locator('.cl-tableau tbody tr')).toHaveCount(6)
  await expect(root(page).locator('.cl-head')).toHaveText(['q₀', 'q₁', 'q₁', 'q₂', 'q₂', 'qₐ'])
  await expect(root(page).locator('.cl-constraint-card')).toHaveCount(4)
  await expect(root(page).getByRole('status')).toContainText('The formula has a satisfying assignment')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.cl-lesson-header', { x: 282, y: 54, width: 1376, height: 80 }],
      ['.mom-tabs', { x: 284, y: 134, width: 1371, height: 55 }],
      ['.cl-visualization', { x: 284, y: 198, width: 1371, height: 471 }],
      ['.cl-tableau-panel', { x: 300, y: 269, width: 497, height: 398 }],
      ['.cl-constraints-panel', { x: 806, y: 269, width: 430, height: 398 }],
      ['.cl-outcome-panel', { x: 1255, y: 269, width: 392, height: 398 }],
      ['.cl-explore', { x: 284, y: 679, width: 1371, height: 107 }],
      ['.cl-footer-grid', { x: 284, y: 793, width: 1371, height: 155 }],
    ] as const) {
      const actual = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width'] as const) expect(Math.abs(actual![key] - expected[key])).toBeLessThanOrEqual(2)
      if (selector !== '.cl-footer-grid') expect(Math.abs(actual!.height - expected.height)).toBeLessThanOrEqual(2)
    }
})

test('027 row selection, constraint highlights, labels and bounded playback work', async ({ page }) => {
  await button(page, 'Show tableau time 3').click()
  await expect(button(page, 'Show tableau time 3')).toHaveAttribute('aria-pressed', 'true')
  await button(page, 'Next tableau step').click()
  await expect(button(page, 'Show tableau time 4')).toHaveAttribute('aria-pressed', 'true')
  await button(page, 'Previous tableau step').click()
  await root(page).getByLabel('Transition constraints (Ctrans)', { exact: true }).check()
  await expect(root(page).locator('.cl-transition-highlight').first()).toBeVisible()
  await root(page).getByLabel('Accepting state (Caccept)', { exact: true }).check()
  await expect(root(page).locator('.cl-accept-highlight')).toHaveCount(7)
  await root(page).getByLabel('Show constraint highlights', { exact: true }).uncheck()
  await expect(root(page).locator('.cl-transition-highlight,.cl-accept-highlight,.cl-initial-highlight')).toHaveCount(0)
  await root(page).getByLabel('Show variable names', { exact: true }).uncheck()
  await expect(root(page).locator('.cl-head').first()).toHaveText('●')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Tableau playback speed', { exact: true }).selectOption('100')
  await tab(page, 'Visualization')
  await button(page, 'Play steps').click()
  await expect(button(page, 'Next tableau step')).toBeDisabled()
  await expect(button(page, 'Play steps')).toBeVisible()
  await button(page, 'Reset').click()
  await expect(button(page, 'Previous tableau step')).toBeDisabled()
})

test('027 exposes real clause families, pagination, DIMACS and satisfying assignments', async ({ page }) => {
  await button(page, 'Inspect generated CNF formula').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('268 variables;')
  await expect(dialog.locator('.cl-clause-page article')).toHaveCount(12)
  await expect(dialog.locator('code').first()).toContainText('X[')
  await button(page, 'Next clauses').click()
  await expect(dialog.locator('.cl-clause-page article').first()).toContainText('Clause 13')
  await dialog.getByLabel('CNF clause filter').selectOption('failed')
  await expect(dialog).toContainText('No clauses match this filter')
  await dialog.getByLabel('CNF clause filter').selectOption('accept')
  await expect(dialog.locator('.cl-clause-page article')).toHaveCount(1)
  await expect(dialog.locator('code')).toContainText('Q[5,qa]')
  const cnfDownload = page.waitForEvent('download')
  await button(page, 'Download CNF').click()
  const download = await cnfDownload
  expect(download.suggestedFilename()).toBe('cook-levin.cnf')
  const stream = await download.createReadStream()
  const buffers: Buffer[] = []
  for await (const chunk of stream!) buffers.push(Buffer.from(chunk))
  const content = Buffer.concat(buffers).toString()
  const header = content.match(/^p cnf (\d+) (\d+)$/m)!
  expect(Number(header[1])).toBe(268)
  expect(content.split('\n').filter((line) => /^-?\d/.test(line))).toHaveLength(Number(header[2]))
  await close(page)
  await tab(page, 'Experiments')
  const assignmentDownload = page.waitForEvent('download')
  await button(page, 'Export satisfying assignment').click()
  expect((await assignmentDownload).suggestedFilename()).toBe('cook-levin-assignment.json')
})

test('027 edits candidate evidence and distinguishes failed candidates from UNSAT', async ({ page }) => {
  await button(page, 'Inspect tableau cell t=1, i=-2').click()
  await expect(page.getByRole('dialog')).toContainText('X[1,-2,σ]')
  await page.getByLabel('Candidate tape symbol', { exact: true }).selectOption('b')
  await button(page, 'Apply candidate configuration').click()
  await expect(root(page).locator('.cl-failed-cell').first()).toBeVisible()
  await expect(root(page).getByRole('status')).toContainText('An accepting branch exists')
  await tab(page, 'Experiments')
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('Candidate fails')
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('itself is SAT')
  await expect(button(page, 'Export satisfying assignment')).toBeDisabled()
  await button(page, 'Inspect failed clauses').click()
  await expect(page.getByRole('dialog').locator('.cl-clause-failed').first()).toContainText('Transition Constraints')
  await close(page)
  await button(page, 'Use accepting branch').click()
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('0 failed clauses')
  await button(page, 'Use rejecting branch').click()
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('1 failed clauses')
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('itself is SAT')
  await button(page, 'Inspect failed clauses').click()
  await expect(page.getByRole('dialog').locator('.cl-clause-failed')).toHaveCount(1)
  await expect(page.getByRole('dialog').locator('.cl-clause-failed')).toContainText('Accepting State')
})

test('027 validates unique-head constraints, resets candidates and diagnoses transition errors', async ({ page }) => {
  await button(page, 'Inspect tableau cell t=0, i=0').click()
  await page.getByLabel('Candidate head position', { exact: true }).selectOption('-1')
  await button(page, 'Apply candidate configuration').click()
  await tab(page, 'Experiments')
  await button(page, 'Inspect failed clauses').click()
  await expect(page.getByRole('dialog').locator('.cl-clause-failed').first()).toContainText('Cell Variables')
  await close(page)
  await button(page, 'Reset candidate tableau').click()
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('0 failed clauses')
  await button(page, 'Introduce a transition error').click()
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('Candidate fails')
  await button(page, 'Use accepting branch').click()
  await expect(root(page).locator('.cl-candidate-summary')).toContainText('0 failed clauses')
})

test('027 handles accepting, rejecting, too-short and zero-time bounded computations', async ({ page }) => {
  const example = root(page).getByLabel('Cook-Levin example', { exact: true })
  await example.selectOption('no')
  await expect(root(page).getByRole('status')).toContainText('UNSATISFIABLE')
  await example.selectOption('short')
  await expect(root(page).getByRole('status')).toContainText('T is too short')
  await expect(root(page).getByRole('status')).toContainText('does not show that M rejects')
  await example.selectOption('binary')
  await expect(root(page).getByRole('status')).toContainText('SATISFIABLE')
  await example.selectOption('branch')
  await expect(root(page).getByRole('status')).toContainText('An accepting branch exists')
  await example.selectOption('custom')
  await expect(page.getByLabel('Machine input word')).toBeFocused()
  await page.getByLabel('Machine time bound').fill('0')
  await button(page, 'Apply machine instance').click()
  await expect(root(page).locator('.cl-tableau tbody tr')).toHaveCount(1)
  await expect(button(page, 'Play steps')).toBeDisabled()
  await expect(button(page, 'Previous tableau step')).toBeDisabled()
  await expect(button(page, 'Next tableau step')).toBeDisabled()
  await expect(root(page).getByRole('status')).toContainText('UNSATISFIABLE')
})

test('027 custom editor validates alphabet and bounds and accepts empty input', async ({ page }) => {
  await button(page, 'Edit teaching machine input').click()
  await page.getByLabel('Machine input word').fill('abcdef')
  await button(page, 'Apply machine instance').click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Machine input word').fill('b')
  await page.getByLabel('Machine time bound').fill('9')
  await button(page, 'Apply machine instance').click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Machine time bound').fill('8')
  await page.getByLabel('Machine input word').fill('')
  await button(page, 'Apply machine instance').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(root(page).locator('.cl-tableau tbody tr')).toHaveCount(9)
  await expect(root(page).getByRole('status')).toContainText('UNSATISFIABLE')
  await button(page, 'Edit teaching machine input').click()
  await page.getByLabel('Machine alphabet').selectOption('binary')
  await page.getByLabel('Machine input word').fill('101')
  await button(page, 'Apply machine instance').click()
  await expect(root(page).getByRole('status')).toContainText('This assignment gives a valid tableau')
  await expect(root(page).getByLabel('Cook-Levin example', { exact: true })).toHaveValue('custom')
})

test('027 theory, worked example, prediction, notes and review progress work', async ({ page }) => {
  await button(page, 'Try It').click()
  await expect(page.getByRole('dialog')).toContainText('Input 101, T = 5, S = 7')
  await button(page, 'Play this computation').click()
  await expect(button(page, 'Pause steps')).toBeVisible()
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('polynomial')
  await expect(root(page).getByRole('link')).toHaveAttribute('href', 'https://www.cs.toronto.edu/~ashe/cook-levin-handout.pdf')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('Caccept')
  await tab(page, 'Practice')
  await button(page, 'Another branch may still satisfy the formula').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await root(page).getByLabel('Predicted accepting time').fill('5')
  await button(page, 'Check prediction').click()
  await expect(root(page)).toContainText('1 + 3 + 1 = 5')
  await tab(page, 'Notes')
  await root(page).getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await root(page).getByLabel('Cook-Levin proof notes').fill('Explain acceptance in both directions and enforce all four constraint groups.')
  await button(page, 'Mark section reviewed').click()
  await expect(root(page).locator('.cl-progress')).toContainText('1 of 6 sections')
  await page.reload()
  await tab(page, 'Notes')
  await expect(root(page).getByLabel('Cook-Levin proof notes')).toHaveValue('Explain acceptance in both directions and enforce all four constraint groups.')
  await expect(button(page, 'Section reviewed')).toHaveAttribute('aria-pressed', 'true')
})

test('027 remains within narrow viewports with maximum rows and dark mode', async ({ page }, info) => {
  await button(page, 'Edit teaching machine input').click()
  await page.getByLabel('Machine input word').fill('abbbb')
  await page.getByLabel('Machine time bound').fill('8')
  await button(page, 'Apply machine instance').click()
  await tab(page, 'Notes')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  for (const width of info.project.name === 'desktop' ? [1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 941 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    const scroll = root(page).locator('.cl-table-scroll')
    expect(await scroll.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/cook-levin-027/${info.project.name}-dark.png`, fullPage: true })
})
