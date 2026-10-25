import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/divide-and-conquer/divide-conquer-method')
})
test('018 reference dashboard includes every framework, design and example component', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.divide-method-page')
  for (const name of [
    'The Divide and Conquer Framework',
    'When to Use Divide and Conquer?',
    'Key Principles & Assumptions',
    'Recurrence Template Builder',
    'Canonical Examples',
    'Concept and Intuition',
    'General Steps Checklist',
  ])
    await expect(root.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root.locator('.dm-tabs button')).toHaveCount(5)
  await expect(root.locator('.dm-stage')).toHaveCount(3)
  await expect(root.locator('.dm-principles li')).toHaveCount(8)
  await expect(root.locator('.dm-example')).toHaveCount(4)
  await expect(root.locator('.dm-recurrence-result output')).toContainText('Θ(n log n)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 284, y: 66, width: 1374, height: 129 }],
      ['.dm-tabs', { x: 284, y: 206, height: 39 }],
      ['.dm-framework', { x: 284, y: 256, width: 653, height: 386 }],
      ['.dm-flow', { x: 946, y: 256, width: 359, height: 386 }],
      ['.dm-principles', { x: 1315, y: 256, width: 343, height: 386 }],
      ['.dm-builder', { x: 284, y: 650, width: 549, height: 224 }],
      ['.dm-examples', { x: 841, y: 650, width: 817, height: 214 }],
      ['.dm-bottom-grid', { x: 284, y: 874, width: 1374, height: 66 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    for (const stage of await root.locator('.dm-stage').all()) {
      const box = await stage.boundingBox(),
        tip = await stage.locator('.dm-stage-tip').boundingBox()
      expect(tip!.y + tip!.height).toBeLessThanOrEqual(box!.y + box!.height)
    }
    const bottom = await root.locator('.dm-bottom-grid').boundingBox(),
      paragraph = await root.locator('.dm-intuition>p').boundingBox()
    expect(paragraph!.y + paragraph!.height).toBeLessThanOrEqual(bottom!.y + bottom!.height)
    expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(941)
  }
  await page.screenshot({ path: `artifacts/visual-qa/divide-method-018/${info.project.name}-learn.png` })
})
test('018 recurrence controls recompute branches, combine costs and valid boundaries', async ({ page }) => {
  const root = page.locator('.divide-method-page')
  await root.getByRole('button', { name: 'Decrease a', exact: true }).click()
  await expect(root.getByLabel('Number of subproblems a', { exact: true })).toHaveValue('1')
  await root.getByLabel('Divide and combine cost', { exact: true }).selectOption('constant')
  await expect(root.locator('.dm-recurrence-result output')).toContainText('Θ(log n)')
  await root.getByLabel('Size factor b', { exact: true }).fill('1')
  await expect(root.getByRole('alert')).toContainText('integer b from 2 to 16')
  await expect(root.getByLabel('Size factor b', { exact: true })).toHaveValue('2')
  await root.getByLabel('Number of subproblems a', { exact: true }).fill('7')
  await root.getByLabel('Divide and combine cost', { exact: true }).selectOption('square')
  await expect(root.locator('.dm-recurrence-result output sup')).toContainText('log2 7')
  await expect(root.locator('.dm-framework-svg').first()).toHaveAttribute('aria-label', /7 subproblems/)
})
test('018 design-choice branches provide honest advice and can be restored', async ({ page }) => {
  const root = page.locator('.divide-method-page')
  await root.getByRole('button', { name: 'Answer no to design question 2', exact: true }).click()
  await expect(root.locator('.dm-flow-result')).toContainText('Consider Dynamic Programming')
  await expect(root.getByRole('button', { name: 'Answer yes to design question 3', exact: true })).toBeDisabled()
  await root.getByRole('button', { name: 'Answer yes to design question 2', exact: true }).click()
  await root.getByRole('button', { name: 'Answer no to design question 3', exact: true }).click()
  await expect(root.locator('.dm-flow-result')).toContainText('Redesign')
  await root.getByRole('button', { name: 'Answer yes to design question 3', exact: true }).click()
  await expect(root.locator('.dm-flow-result')).toContainText('appropriate')
})
test('018 stage, principle and example dialogs explain the contract and load example parameters', async ({ page }) => {
  const root = page.locator('.divide-method-page'),
    dialog = page.getByRole('dialog', { name: 'Divide and conquer design details', exact: true })
  await root.getByRole('button', { name: 'Explore Combine stage', exact: true }).click()
  await expect(dialog).toContainText('crossing candidate')
  await page.keyboard.press('Escape')
  await root.locator('.dm-principles li').nth(1).getByRole('button').click()
  await expect(dialog).toContainText('Empty and one-element arrays')
  await dialog.getByRole('button', { name: 'Close design details', exact: true }).click()
  await root.getByRole('button', { name: 'Explore Binary Search design', exact: true }).click()
  await expect(dialog).toContainText('decrease and conquer')
  await dialog.getByRole('button', { name: 'Close design details', exact: true }).click()
  await expect(root.getByLabel('Number of subproblems a', { exact: true })).toHaveValue('1')
  await expect(root.locator('.dm-recurrence-result output')).toContainText('Θ(log n)')
})
test('018 editable merge trace steps through real values and handles empty base input', async ({ page }) => {
  const root = page.locator('.divide-method-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.dm-trace-tree rect')).toHaveCount(15)
  await root.getByRole('button', { name: 'Inspect subproblem indices 0 to 0', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.dm-trace-message')).toContainText('One value is already sorted')
  await root.getByLabel('Array to divide and conquer', { exact: true }).fill('4, 1, 3')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await root.getByLabel('Merge trace playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Play trace', exact: true }).click()
  await expect(root.locator('.dm-trace-message')).toContainText('Finished', { timeout: 6000 })
  await expect(root.locator('.dm-current-output')).toHaveText('1, 3, 4')
  await expect(root.locator('.dm-comparisons')).toHaveText('3')
  await root.getByLabel('Array to divide and conquer', { exact: true }).fill('')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await expect(root.locator('.dm-trace-message')).toContainText('Empty input is already sorted')
  await expect(root.locator('.dm-comparisons')).toHaveText('0')
  await root.getByLabel('Array to divide and conquer', { exact: true }).fill('oops')
  await root.getByRole('button', { name: 'Apply array', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('up to 12 integers')
})
test('018 modeled work responds to depth without confusing it with actual merge comparisons', async ({ page }) => {
  const root = page.locator('.divide-method-page')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.dm-modeled-total')).toContainText('32')
  await root.getByLabel('Modeled recursion depth', { exact: true }).fill('0')
  await expect(root.locator('.dm-modeled-cost tbody tr')).toHaveCount(1)
  await expect(root.locator('.dm-modeled-total')).toContainText('1')
  await root.getByLabel('Modeled recursion depth', { exact: true }).fill('4')
  await expect(root.locator('.dm-modeled-cost tbody tr')).toHaveCount(5)
  await expect(root.locator('.dm-modeled-total')).toContainText('80')
  await expect(root.locator('.dm-comparisons')).toHaveText('0')
})
test('018 checklist, prediction, quiz, notes and canonical routes are usable', async ({ page }) => {
  const root = page.locator('.divide-method-page')
  await root.locator('.dm-checklist>div button').first().click()
  await expect(root.locator('.dm-checklist>div button').first()).toHaveAttribute('aria-pressed', 'true')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted merge comparisons', { exact: true }).fill('3')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByRole('button', { name: 'Compare the left, right, and best crossing subarray candidates.', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root
    .getByLabel('Record the split, base cases, recursive contract, combine proof, and cost recurrence.', { exact: true })
    .fill('Prove that the combine rule covers every case.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.locator('textarea')).toHaveValue('Prove that the combine rule covers every case.')
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  await root.getByRole('button', { name: 'View all examples', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Open Find Min and Max', exact: true }).click()
  await expect(page).toHaveURL(/divide-min-max/)
  await expect(page.locator('.minmax-page')).toBeVisible()
})
test('018 dark theme remains contained and the header controls stay reachable', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/divide-method-018/${info.project.name}-dark.png` })
})
