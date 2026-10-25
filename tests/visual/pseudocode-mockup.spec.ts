import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})
test('012 reference dashboard contains every learning component and measured layout anchors', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  for (const title of [
    'Pseudocode Editor',
    'Flowchart Visualizer',
    'Natural Language → Pseudocode',
    'Generated Pseudocode',
    'Worked Example: Binary Search',
    'Algorithm Quality Checklist',
    'Key Takeaways',
    'Common Pitfalls',
    'Pro Tip',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.pc-tabs button')).toHaveCount(5)
  await expect(root.locator('.pc-flow-node')).toHaveCount(7)
  await expect(root.locator('.pc-checklist input')).toHaveCount(10)
  await expect(root.locator('.pc-binary-table tbody tr')).toHaveCount(3)
  await expect(root.locator('.pc-example-cards')).toContainText('Returns index 3')
  for (const selector of ['.pc-takeaways', '.pc-pitfalls', '.pc-pro-tip']) {
    const card = await root.locator(selector).boundingBox(),
      text = await root.locator(`${selector} p`).last().boundingBox()
    expect(text!.y + text!.height, `${selector} text remains visible`).toBeLessThanOrEqual(card!.y + card!.height)
  }
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.mom-hero', { x: 280, y: 65, width: 1377, height: 127 }],
      ['.pc-editor', { x: 280, y: 259, width: 448, height: 364 }],
      ['.pc-flow-panel', { x: 738, y: 259, width: 245, height: 364 }],
      ['.pc-natural', { x: 993, y: 259, width: 328, height: 364 }],
      ['.pc-worked', { x: 280, y: 634, width: 673 }],
      ['.pc-checklist', { x: 963, y: 634, width: 358 }],
      ['.pc-takeaways', { x: 1332, y: 259, width: 325, height: 283 }],
      ['.pc-pitfalls', { x: 1332, y: 554, width: 325, height: 212 }],
      ['.pc-pro-tip', { x: 1332, y: 777, width: 325, height: 106 }],
    ] as const) {
      // Structural evidence only; image comparison still determines remaining visual differences.
      const box = await root.locator(selector).boundingBox()
      expect(box).not.toBeNull()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  await page.screenshot({ path: `artifacts/visual-qa/pseudocode-012/${info.project.name}-learn.png`, fullPage: false })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
test('012 editable pseudocode executes changed statements and reports errors truthfully', async ({ page }) => {
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: 3')
  await expect(root.locator('.pc-code-line.current')).toContainText('return i')
  await root.getByLabel('Pseudocode editor', { exact: true }).fill('ALGORITHM Custom(A, n, x)\nanswer ← x + 30\nreturn answer')
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: 42')
  await expect(root.locator('.pc-executed-path button')).toHaveCount(2)
  await root.getByLabel('Pseudocode editor', { exact: true }).fill('ALGORITHM Bad(A, n, x)\nreturn missing')
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('not defined')
  await expect(root.locator('.pc-run-result')).toContainText('Last successful output: 42')
  await root.getByLabel('Pseudocode editor', { exact: true }).fill('ALGORITHM Loop(A, n, x)\nwhile true do\n  x ← x + 1\nreturn x')
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('1000-step limit')
})
test('012 flow nodes, variable snapshots, stepping and automatic playback use actual execution', async ({ page }) => {
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByRole('button', { name: 'Inspect flow A[i] = x?', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.pc-code-line.current')).toContainText('if A[i] = x then')
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await expect(root.locator('.pc-variable-list')).toContainText('i = 0')
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.pc-variable-list')).toContainText('i = 1')
  await root.getByRole('button', { name: 'Step back', exact: true }).click()
  await expect(root.locator('.pc-variable-list')).toContainText('i = 0')
  await root.getByRole('button', { name: 'Auto Run', exact: true }).click()
  await expect(root.getByRole('button', { name: 'Step forward', exact: true })).toBeDisabled({ timeout: 10000 })
  await expect(root.locator('.pc-run-result')).toContainText('Output: 3')
  await root.getByRole('button', { name: 'Inspect flow Return −1', exact: true }).click()
  await expect(root.locator('.pc-notice')).toContainText('not executed')
})
test('012 editable inputs handle not-found, empty and unsorted binary-search examples', async ({ page }) => {
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByRole('button', { name: 'Example Input', exact: true }).click()
  await root.getByRole('button', { name: 'Not found', exact: true }).click()
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: -1')
  await expect(root.locator('.pc-flow-node.missing')).toHaveClass(/active/)
  await root.getByRole('button', { name: 'Example Input', exact: true }).click()
  await root.getByRole('button', { name: 'Empty array', exact: true }).click()
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: -1')
  await expect(root.locator('.pc-binary-table')).toContainText('No candidates')
  await root.getByRole('button', { name: 'Example Input', exact: true }).click()
  await root.getByLabel('Pseudocode input array', { exact: true }).fill('9, 2, 4')
  await root.getByLabel('Pseudocode target x', { exact: true }).fill('4')
  await root.getByRole('button', { name: 'Apply input', exact: true }).click()
  await expect(root.locator('.pc-sorted-required')).toContainText('sorted array')
  await root.getByLabel('Pseudocode template', { exact: true }).selectOption('binary')
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('sorted array')
  await root.getByRole('button', { name: 'Use sorted copy', exact: true }).click()
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: 1')
  await root.getByRole('button', { name: 'Example Input', exact: true }).click()
  await root.getByRole('button', { name: 'Not found', exact: true }).click()
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: -1')
  await expect
    .poll(async () => {
      const text = await root.locator('.pc-editor .pc-code-line.current').boundingBox(),
        editor = await root.getByLabel('Pseudocode editor', { exact: true }).boundingBox()
      return text!.y >= editor!.y && text!.y + text!.height <= editor!.y + editor!.height
    })
    .toBe(true)
})
test('012 description templates, generated copying and unsupported tasks are explicit', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByLabel('Algorithm description', { exact: true }).fill('Find the largest element in an array.')
  await root.getByRole('button', { name: 'Generate Pseudocode', exact: true }).click()
  await expect(root.locator('.pc-generated')).toContainText('FindMaximum')
  await root.getByRole('button', { name: 'Copy generated pseudocode', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('ALGORITHM FindMaximum')
  await root.getByRole('button', { name: 'Open in editor', exact: true }).click()
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: 23')
  await root.getByLabel('Algorithm description', { exact: true }).fill('Design a flight simulator')
  await root.getByRole('button', { name: 'Generate Pseudocode', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('supports templates')
  await expect(root.locator('.pc-generated')).toContainText('FindMaximum')
})
test('012 worked binary-search tabs, trace rows and algorithm checklist work', async ({ page }) => {
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByRole('button', { name: 'Explanation', exact: true }).click()
  await expect(root.locator('.pc-worked-theory')).toContainText('strictly reduces')
  await root.getByRole('button', { name: 'Trace Example', exact: true }).click()
  await root.getByRole('button', { name: 'Inspect binary trace step 2', exact: true }).click()
  await expect(root.locator('.pc-binary-stepper')).toContainText('low = 3')
  await expect(root.locator('.pc-binary-stepper')).toContainText('high = 5')
  await root.getByRole('button', { name: 'Analysis', exact: true }).click()
  await expect(root.locator('.pc-worked-theory')).toContainText('O(log n)')
  await root.getByLabel('Clearly specify input and output.', { exact: true }).check()
  await page.reload()
  await expect(root.getByLabel('Clearly specify input and output.', { exact: true })).toBeChecked()
})
test('012 predictions, quiz answers and persistent notes are interactive', async ({ page }) => {
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted pseudocode output', { exact: true }).fill('2')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Predicted pseudocode output', { exact: true }).fill('3.0')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByLabel('A program that always runs unchanged in Python', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('A language-independent description of an algorithm', { exact: true }).check()
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Pseudocode notes', { exact: true }).fill('Binary search needs sorted input and a decreasing interval.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Pseudocode notes', { exact: true })).toHaveValue('Binary search needs sorted input and a decreasing interval.')
})
test('012 dark and narrow layouts retain controls without page overflow', async ({ page }, info) => {
  await page.goto('/analysis-correctness/algorithm-foundations')
  const root = page.locator('.pseudocode-page')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/pseudocode-012/${info.project.name}-dark.png`, fullPage: false })
  await root.getByRole('button', { name: 'Visualize', exact: true }).click()
  await root.getByRole('button', { name: 'Example Input', exact: true }).click()
  await root.getByLabel('Pseudocode input array', { exact: true }).fill(JSON.stringify(Array.from({ length: 30 }, (_, i) => i)))
  await root.getByLabel('Pseudocode target x', { exact: true }).fill('29')
  await root.getByRole('button', { name: 'Apply input', exact: true }).click()
  await root.getByRole('button', { name: 'Run', exact: true }).click()
  await expect(root.locator('.pc-run-result')).toContainText('Output: 29')
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})
