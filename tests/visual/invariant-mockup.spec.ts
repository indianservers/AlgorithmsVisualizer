import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/correctness-proofs')
})

test('009 reference dashboard contains all proof components and measured anchors', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.invariant-page')
  for (const title of [
    'Induction Workflow',
    'Loop Invariant Checker',
    'Binary Search Interval Visualizer',
    'Worked Example: Insertion Sort Invariant',
    'Common Mistakes',
    'Proof Vocabulary',
    'Pro Tip',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.iv-tabs button')).toHaveCount(5)
  await expect(root.locator('.iv-induction-card')).toHaveCount(3)
  await expect(root.locator('.iv-checker tbody tr')).toHaveCount(3)
  await expect(root.locator('.iv-checker button.verified')).toHaveCount(1)
  await expect(root.locator('.iv-vocab-grid button')).toHaveCount(6)
  await expect(root.locator('.iv-array button')).toHaveCount(16)
  await expect(root.locator('.iv-array .midpoint')).toHaveText('37')
  await expect(root.locator('.iv-pointer.mid')).toContainText('(8)')
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.mom-hero', { x: 311, y: 61, width: 1347, height: 148 }],
      ['.iv-tabs', { x: 311, y: 220, width: 677, height: 42 }],
      ['.iv-workflow', { x: 311, y: 273, width: 766, height: 266 }],
      ['.iv-checker', { x: 1086, y: 273, width: 572, height: 266 }],
      ['.iv-binary', { x: 311, y: 550, width: 766, height: 250 }],
      ['.iv-worked', { x: 1086, y: 550, width: 572, height: 250 }],
      ['.iv-mistakes', { x: 311, y: 813, width: 436, height: 128 }],
      ['.iv-vocabulary', { x: 760, y: 813, width: 592, height: 128 }],
      ['.iv-pro-tip', { x: 1365, y: 813, width: 293, height: 128 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  for (const [panelSelector, lastSelector] of [
    ['.iv-binary', '.iv-binary-footer'],
    ['.iv-worked', '.iv-correct'],
    ['.iv-vocabulary', '.iv-vocab-grid button:last-child'],
    ['.iv-checker', 'tbody tr:last-child'],
  ] as const) {
    const panel = await root.locator(panelSelector).boundingBox(),
      last = await root.locator(panelSelector).locator(lastSelector).boundingBox()
    expect(last!.y + last!.height, `${panelSelector} content fits`).toBeLessThanOrEqual(panel!.y + panel!.height)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/invariant-009/${info.project.name}-learn.png` })
})

test('009 induction steps show a general proof and editable numerical illustrations', async ({ page }) => {
  const root = page.locator('.invariant-page'),
    dialog = page.getByRole('dialog', { name: 'Proof detail', exact: true })
  await root.getByRole('button', { name: 'Verify P(n₀).', exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.iv-algebra')).toContainText('0 = 0(0 + 1)/2 = 0')
  await dialog.getByRole('button', { name: 'Induction Hypothesis', exact: true }).click()
  await expect(dialog).toContainText('arbitrary k')
  await dialog.getByLabel('Induction example k', { exact: true }).fill('5')
  await expect(dialog.locator('.iv-induction-numeric')).toContainText('S(5) = 15; S(6) = 15 + 6 = 21')
  await dialog.getByRole('button', { name: 'Inductive Step', exact: true }).click()
  await expect(dialog.locator('.iv-algebra')).toContainText('(k + 1)(k + 2)/2')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(root.locator('.mom-progress-details')).toContainText('3 of 6 activities')
})

test('009 proof checker reviews initialization, preservation, exit and termination', async ({ page }) => {
  const root = page.locator('.invariant-page'),
    dialog = page.getByRole('dialog', { name: 'Proof detail', exact: true })
  await root.getByRole('button', { name: 'Review maintenance obligation', exact: true }).click()
  await expect(dialog.locator('.iv-obligation-proof')).toContainText('Retaining [mid + 1, high] cannot discard every match')
  await dialog.getByRole('button', { name: 'Verify this obligation', exact: true }).click()
  await expect(root.locator('.iv-checker button.verified')).toHaveCount(2)
  await root.getByRole('button', { name: 'Review termination obligation', exact: true }).click()
  await expect(dialog.locator('.iv-obligation-proof')).toContainText('strictly decreases')
  await expect(dialog.locator('.iv-obligation-proof')).toContainText('returns a matching index')
  await dialog.getByRole('button', { name: 'Verify this obligation', exact: true }).click()
  await expect(root.locator('.iv-checker button.verified')).toHaveCount(3)
  await expect(root.locator('.mom-progress-details')).toContainText('1 of 6 activities')
  await root.getByRole('button', { name: 'Review initialization obligation', exact: true }).click()
  await expect(dialog.locator('.iv-obligation-proof')).toContainText('vacuously true')
  await dialog.getByRole('button', { name: 'Close proof detail', exact: true }).click()
})

test('009 binary playback reports found and absent targets with truthful bounds', async ({ page }) => {
  const root = page.locator('.invariant-page')
  await root.getByLabel('Binary search target', { exact: true }).fill('91')
  await root.getByRole('button', { name: 'Next binary search step', exact: true }).click()
  await expect(root.locator('.iv-pointer.low')).toContainText('(9)')
  await root.getByRole('button', { name: 'Previous binary search step', exact: true }).click()
  await expect(root.locator('.iv-pointer.low')).toContainText('(0)')
  await root.getByLabel('Binary search playback speed', { exact: true }).selectOption('2')
  await root.getByRole('button', { name: 'Play binary search', exact: true }).click()
  await expect(root.locator('.iv-search-explanation')).toContainText('Found target 91 at index 15', { timeout: 10000 })
  await expect(root.getByRole('button', { name: 'Next binary search step', exact: true })).toBeDisabled()
  await root.getByLabel('Binary search target', { exact: true }).fill('38')
  await root.getByRole('button', { name: 'Play binary search', exact: true }).click()
  await expect(root.locator('.iv-search-explanation')).toContainText('target does not occur', { timeout: 10000 })
  await root.getByLabel('Binary search array size', { exact: true }).selectOption('0')
  await expect(root.locator('.iv-empty')).toContainText('low = 0, high = −1')
  await expect(root.getByRole('button', { name: 'Next binary search step', exact: true })).toBeDisabled()
})

test('009 editable search arrays reject unsorted values and support duplicates and empty inputs', async ({ page }) => {
  const root = page.locator('.invariant-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByLabel('Binary search array', { exact: true }).fill('1, 3, 2')
  await root.getByRole('button', { name: 'Apply sorted array', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('sorted nondecreasing')
  await expect(root.locator('.iv-array button')).toHaveCount(16)
  await root.getByLabel('Binary search array', { exact: true }).fill('2, 2, 2, 2')
  await root.getByRole('button', { name: 'Apply sorted array', exact: true }).click()
  await root.getByLabel('Binary search target', { exact: true }).fill('2')
  await expect(root.locator('.iv-pointer.mid')).toContainText('(2)')
  await root.getByRole('button', { name: 'Next binary search step', exact: true }).click()
  await expect(root.locator('.iv-trace-status')).toContainText('comparisons completed: 1')
  await expect(root.locator('.iv-lab')).toContainText('Result: index 2')
  await root.getByRole('button', { name: 'Inspect array index 0, value 2', exact: true }).click()
  await expect(root.locator('.iv-search-explanation')).toContainText('A[0] = 2')
  await root.getByLabel('Binary search array', { exact: true }).fill('[]')
  await root.getByRole('button', { name: 'Apply sorted array', exact: true }).click()
  await expect(root.locator('.iv-lab')).toContainText('Result: not found')
  await expect(root.locator('.iv-trace-status')).toContainText('candidate count: 0')
})

test('009 insertion solution tracks sorted prefixes, shifts, permutations and termination', async ({ page }) => {
  const root = page.locator('.invariant-page'),
    dialog = page.getByRole('dialog', { name: 'Proof detail', exact: true })
  await root.getByRole('button', { name: 'View full solution', exact: true }).click()
  await expect(dialog.locator('.iv-insertion-status')).toContainText('i = 0/6')
  await dialog.getByRole('button', { name: 'Next insertion step', exact: true }).click()
  await dialog.getByRole('button', { name: 'Next insertion step', exact: true }).click()
  await expect(dialog.locator('.iv-insertion-array span')).toHaveText(['2', '5', '4', '6', '1', '3'])
  await expect(dialog.locator('.iv-insertion-moves')).toContainText('Shift 5 from index 0 to 1')
  await dialog.getByLabel('Insertion sort input', { exact: true }).fill('3, 2, 2, -1')
  await dialog.getByRole('button', { name: 'Apply insertion array', exact: true }).click()
  await dialog.getByRole('button', { name: 'Play insertion sort', exact: true }).click()
  await expect(dialog.locator('.iv-insertion-result')).toContainText('sorted permutation', { timeout: 10000 })
  await expect(dialog.locator('.iv-insertion-array span')).toHaveText(['-1', '2', '2', '3'])
  await expect(dialog.locator('.iv-insertion-status')).toContainText('variant n − i = 0')
  await dialog.getByLabel('Insertion sort input', { exact: true }).fill('[1, "2"]')
  await dialog.getByRole('button', { name: 'Apply insertion array', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('finite numbers')
  await expect(dialog.locator('.iv-insertion-array span')).toHaveText(['-1', '2', '2', '3'])
  await dialog.getByLabel('Insertion sort input', { exact: true }).fill('[]')
  await dialog.getByRole('button', { name: 'Apply insertion array', exact: true }).click()
  await expect(dialog.locator('.iv-insertion-status')).toContainText('i = 0/0')
  await expect(dialog.locator('.iv-insertion-result')).toContainText('sorted permutation')
})

test('009 predictions, quiz, vocabulary, counterexamples and saved notes are interactive', async ({ page }) => {
  const root = page.locator('.invariant-page'),
    dialog = page.getByRole('dialog', { name: 'Proof detail', exact: true })
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted binary search decision', { exact: true }).selectOption('left')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.iv-prediction-feedback')).toContainText('Not yet')
  await root.getByLabel('Predicted binary search decision', { exact: true }).selectOption('found')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.locator('.iv-prediction-feedback')).toContainText('return this midpoint')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByLabel('The output is a sorted permutation of the input.', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.locator('.iv-quiz-feedback')).toContainText('Correct')
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  await root.locator('.iv-vocab-grid button').filter({ hasText: 'Postcondition' }).click()
  await expect(dialog).toContainText('Sortedness alone permits losing or duplicating values')
  await page.keyboard.press('Escape')
  await root.locator('.iv-mistakes button').first().click()
  await expect(dialog).toContainText('arbitrary k')
  await page.keyboard.press('Escape')
  await root.getByRole('button', { name: 'See more examples', exact: true }).click()
  await dialog.getByRole('button', { name: 'Binary search: prove absence', exact: true }).click()
  await expect(root.getByLabel('Binary search target', { exact: true })).toHaveValue('38')
  await expect(root.getByRole('button', { name: 'Visualize', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Induction and invariant notes', { exact: true }).fill('Invariant + exit condition implies the postcondition.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Induction and invariant notes', { exact: true })).toHaveValue('Invariant + exit condition implies the postcondition.')
})

test('009 dark, narrow and maximum-size arrays retain readable controls', async ({ page }, info) => {
  const root = page.locator('.invariant-page')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({ path: `artifacts/visual-qa/invariant-009/${info.project.name}-dark.png` })
  await root.getByLabel('Binary search array size', { exact: true }).selectOption('32')
  await expect(root.locator('.iv-array button')).toHaveCount(32)
  expect(await root.locator('.iv-array-scroll').evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await root.getByRole('button', { name: 'View full solution', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Proof detail', exact: true })
  const box = await dialog.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(292)
  await dialog.getByLabel('Insertion sort input', { exact: true }).fill('1, -1000000, 1000000')
  await dialog.getByRole('button', { name: 'Apply insertion array', exact: true }).click()
  expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})
