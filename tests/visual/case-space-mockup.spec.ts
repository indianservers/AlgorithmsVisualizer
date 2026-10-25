import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/analysis-correctness/case-time-space-analysis')
})
test('004 reference dashboard includes all six activities and exact default values', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const root = page.locator('.case-space-page')
  for (const title of [
    '1. Best, Average and Worst Case Comparison',
    '2. Input Size Model Visualizer',
    '3. Auxiliary Space Explorer',
    '4. Runtime vs Playback Time',
    '5. Worked Example: Linear Search',
    'Key Takeaways',
    'Common Pitfalls',
  ])
    await expect(root.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(root.locator('.cs-tabs button')).toHaveCount(5)
  await expect(root.locator('.cs-case-card')).toHaveCount(3)
  await expect(root.locator('.cs-case-array>span')).toHaveCount(15)
  await expect(root.locator('.cs-average-value')).toHaveText('(n + 1) / 2 = 3')
  await expect(root.locator('.cs-bit-length')).toHaveText('11 bits')
  await expect(root.locator('.cs-frame-count')).toHaveText('1 frame')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.mom-hero', { x: 322, y: 57, width: 1337, height: 132 }],
      ['.cs-tabs', { x: 322, y: 198, width: 623, height: 41 }],
      ['.cs-cases', { x: 322, y: 249, width: 709, height: 255 }],
      ['.cs-input', { x: 1043, y: 249, width: 616, height: 257 }],
      ['.cs-memory', { x: 322, y: 514, width: 709, height: 270 }],
      ['.cs-runtime', { x: 1043, y: 516, width: 616, height: 268 }],
      ['.cs-footer-grid', { x: 322, y: 795, width: 1337 }],
    ] as const) {
      const box = await root.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    expect(
      await root.locator('.cs-case-card').evaluateAll((cards) =>
        cards.every((card) =>
          [...card.querySelectorAll(':scope>p')].every((p) => {
            const range = document.createRange()
            range.selectNodeContents(p)
            return range.getBoundingClientRect().right <= card.getBoundingClientRect().right - 3
          }),
        ),
      ),
    ).toBe(true)
  }
  await page.screenshot({ path: `artifacts/visual-qa/case-space-004/${info.project.name}-learn.png` })
})
test('004 algorithm selection recomputes the successful-target distribution and sorted examples', async ({ page }) => {
  const root = page.locator('.case-space-page')
  await root.getByLabel('Case comparison algorithm', { exact: true }).selectOption('binary')
  await expect(root.locator('.cs-case-array').first()).toHaveText('35789')
  await expect(root.locator('.cs-average-value')).toHaveText('2.2')
  await expect(root.locator('.cs-case-2>p').first()).toContainText('3')
  await expect(root.getByRole('heading', { name: '5. Worked Example: Binary Search', exact: true })).toBeVisible()
  await root.getByRole('button', { name: 'Explore Best Case', exact: true }).click()
  await expect(root.locator('.cs-trace-count')).toHaveText('1')
  await root.getByRole('button', { name: 'Next comparison', exact: true }).click()
  await expect(root.locator('.cs-search-message')).toContainText('Found target 7 at index 2')
})
test('004 bit-length model handles powers of two, zero and integers beyond floating-point precision', async ({ page }) => {
  const root = page.locator('.case-space-page'),
    field = root.getByLabel('Integer value', { exact: true })
  await field.fill('1023')
  await expect(root.locator('.cs-bit-length')).toHaveText('10 bits')
  await field.fill('0')
  await expect(root.locator('.cs-bit-length')).toHaveText('1 bit')
  await expect(root.locator('.cs-size-values')).toContainText('0 is written using one binary digit')
  await field.fill('18446744073709551616')
  await expect(root.locator('.cs-bit-length')).toHaveText('65 bits')
  await field.fill('-1')
  await expect(root.getByRole('alert')).toContainText('nonnegative')
  await expect(root.locator('.cs-bit-length')).toHaveText('65 bits')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
test('004 array and string input models state and recompute their size units', async ({ page }) => {
  const root = page.locator('.case-space-page')
  await root.getByRole('button', { name: 'Array Input', exact: true }).click()
  await root.getByLabel('Array input values', { exact: true }).fill('1, 4, 7')
  await root.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(root.locator('.cs-bit-length')).toHaveText('3 elements')
  await expect(root.locator('.cs-case-array>span')).toHaveCount(9)
  await expect(root.locator('.cs-average-value')).toHaveText('(n + 1) / 2 = 2')
  await root.getByLabel('Array input values', { exact: true }).fill('1,1')
  await root.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('distinct')
  await expect(root.locator('.cs-bit-length')).toHaveText('3 elements')
  await root.getByRole('button', { name: 'String Input', exact: true }).click()
  await root.getByLabel('String input text', { exact: true }).fill('A😀B')
  await expect(root.locator('.cs-bit-length')).toHaveText('3 code points')
  await root.getByLabel('String input text', { exact: true }).fill('')
  await expect(root.locator('.cs-bit-length')).toHaveText('0 code points')
})
test('004 memory modes count actual deepest frames and a single temporary buffer', async ({ page }) => {
  const root = page.locator('.case-space-page')
  await root.getByRole('button', { name: 'Recursive Example', exact: true }).click()
  await expect(root.locator('.cs-frame-count')).toHaveText('6 frames')
  await expect(root.locator('.cs-memory-algorithm>strong output')).toHaveText('Θ(n)')
  await root.getByLabel('Memory example algorithm', { exact: true }).selectOption('binary')
  await expect(root.locator('.cs-frame-count')).toHaveText('4 frames')
  await expect(root.locator('.cs-memory-algorithm>strong output')).toHaveText('Θ(log n)')
  await root.getByRole('button', { name: 'With Temporary Array', exact: true }).click()
  await expect(root.locator('.cs-frame-count')).toHaveText('1 frame')
  await expect(root.locator('.cs-buffer-count')).toHaveText('5 cells')
  await expect(root.locator('.cs-memory-empty')).toContainText('counted once')
  await expect(root.locator('.cs-temporary-cells>span')).toHaveCount(5)
})
test('004 playback delay changes animation duration without altering operation counts', async ({ page }) => {
  const root = page.locator('.case-space-page')
  await root.getByRole('button', { name: 'Explore playback timing', exact: true }).click()
  await expect(root.locator('.cs-trace-count')).toHaveText('3')
  await root.getByLabel('Playback delay', { exact: true }).fill('100')
  await root.getByRole('button', { name: 'Play search', exact: true }).click()
  await expect(root.locator('.cs-search-message')).toContainText('Found target 3 at index 2')
  await expect(root.locator('.cs-executed-count')).toHaveText('3')
  await root.getByLabel('Playback delay', { exact: true }).fill('1200')
  await expect(root.locator('.cs-trace-count')).toHaveText('3')
  await root.getByLabel('Search target', { exact: true }).fill('42')
  await root.getByRole('button', { name: 'Apply target', exact: true }).click()
  await expect(root.locator('.cs-trace-count')).toHaveText('5')
  await root.getByRole('button', { name: 'Next comparison', exact: true }).click()
  await expect(root.locator('.cs-executed-count')).toHaveText('1')
  await root.getByRole('button', { name: 'Previous comparison', exact: true }).click()
  await expect(root.locator('.cs-executed-count')).toHaveText('0')
})
test('004 worked views, prediction, quiz and saved notes support the theory', async ({ page }) => {
  const root = page.locator('.case-space-page')
  await root.getByLabel('Worked example view', { exact: true }).selectOption('space')
  await expect(root.locator('.cs-worked-rows>div')).toHaveCount(1)
  await expect(root.locator('.cs-worked-rows')).toContainText('A separate array-copy example')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Predicted expected comparisons', { exact: true }).fill('3')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Quiz', exact: true }).click()
  await root.getByRole('button', { name: '11 bits, because', exact: false }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root
    .getByLabel('Record the input-size model, counted operation, case distribution, and auxiliary memory.', { exact: true })
    .fill('Uniform successful targets: average 3. Exclude input storage.')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.locator('textarea')).toHaveValue('Uniform successful targets: average 3. Exclude input storage.')
})
test('004 dark theme remains usable without mobile header overlap', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/case-space-004/${info.project.name}-dark.png` })
})
test('004 a fractional average is labeled as approximate instead of a universal formula', async ({ page }) => {
  const root = page.locator('.case-space-page')
  await root.getByRole('button', { name: 'Array Input', exact: true }).click()
  await root.getByLabel('Array input values', { exact: true }).fill('1, 2, 3, 4, 5, 6')
  await root.getByRole('button', { name: 'Apply', exact: true }).click()
  await root.getByLabel('Case comparison algorithm', { exact: true }).selectOption('binary')
  await expect(root.locator('.cs-average-value')).toHaveText('≈ 2.3333')
})
