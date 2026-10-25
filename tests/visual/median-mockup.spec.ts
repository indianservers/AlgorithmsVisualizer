import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})
test('017 opens the reference Learn dashboard with all teaching components', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/divide-and-conquer/deterministic-selection')
  const pageRoot = page.locator('.mom-page')
  await expect(pageRoot.getByRole('heading', { name: 'Median-of-Medians Selection', exact: true })).toBeVisible()
  await expect(pageRoot.getByRole('button', { name: 'Learn', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(pageRoot.locator('.mom-main-grid .mom-panel')).toHaveCount(6)
  await expect(pageRoot.locator('.mom-group-list>.mom-group')).toHaveCount(5)
  await expect(pageRoot.getByRole('heading', { name: 'Key Takeaways', exact: true })).toBeVisible()
  await expect(pageRoot.getByRole('heading', { name: 'Common Pitfalls', exact: true })).toBeVisible()
  await expect(pageRoot.locator('.mom-worked-example')).toContainText('7th smallest is 6')
  for (const selector of ['.mom-takeaways', '.mom-pitfalls', '.mom-pro-tip']) {
    const card = await pageRoot.locator(selector).boundingBox(),
      text = await pageRoot.locator(`${selector} p`).last().boundingBox()
    expect(text!.y + text!.height, `${selector} text fits its card`).toBeLessThanOrEqual(card!.y + card!.height)
  }
  if (info.project.name === 'desktop') {
    const hero = await pageRoot.locator('.mom-hero').boundingBox()
    expect(hero).not.toBeNull()
    // Layout evidence only; pixel fidelity still requires image comparison.
    for (const [key, value] of Object.entries({ x: 290, y: 65, width: 1366, height: 118 }))
      expect(Math.abs(hero![key as keyof typeof hero] - value), `Median hero ${key}`).toBeLessThanOrEqual(3)
    for (const [selector, expected] of [
      ['.mom-dashboard', { x: 290, y: 244, width: 1366 }],
      ['.mom-groups-panel', { x: 290, y: 244, width: 584, height: 208 }],
      ['.mom-sort-panel', { x: 884, y: 244, width: 418, height: 208 }],
      ['.mom-side-cards', { x: 1316, y: 244, width: 340 }],
    ] as const) {
      const box = await pageRoot.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected))
        expect(Math.abs(box![key as keyof typeof box] - value), `Median ${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  }
  await page.screenshot({ path: `artifacts/visual-qa/median-017/${info.project.name}-learn.png`, fullPage: false })
  if (process.env.MEDIAN_MEASURE === '1')
    console.log(
      JSON.stringify(
        await page.evaluate(() =>
          Object.fromEntries(
            [
              '.workspace',
              '.mom-page',
              '.mom-hero',
              '.mom-hero h1',
              '.mom-hero-icon',
              '.mom-groups-panel',
              '.mom-sort-panel',
              '.mom-workflow-panel',
              '.mom-recurrence-panel',
              '.mom-proof-tabs button',
              '.sidebar-category-toggle',
            ].map((selector) => {
              const el = document.querySelector(selector)!,
                r = el.getBoundingClientRect(),
                s = getComputedStyle(el)
              return [
                selector,
                { x: r.x, y: r.y, width: r.width, height: r.height, font: s.font, fontSize: s.fontSize, padding: s.padding, minHeight: s.minHeight },
              ]
            }),
          ),
        ),
        null,
        2,
      ),
    )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect(errors).toEqual([])
  await pageRoot.getByRole('button', { name: 'Assumptions & Constraints', exact: true }).click()
  await expect(pageRoot.locator('.mom-proof-content')).toContainText('one-based')
  await pageRoot.getByRole('button', { name: 'Formulas', exact: true }).click()
  await expect(pageRoot.locator('.mom-proof-content')).toContainText('k′')
})
test('017 worked example, editable inputs, predictions and real source work', async ({ page }) => {
  await page.goto('/divide-and-conquer/deterministic-selection')
  const root = page.locator('.mom-page')
  await root.getByRole('button', { name: 'Explore this worked example', exact: true }).click()
  await expect(root.getByLabel('Selection rank (k)')).toHaveValue('7')
  await root.getByLabel('Predicted partition branch').selectOption('right')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Not yet')
  await root.getByLabel('Predicted partition branch').selectOption('equal')
  await root.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
  await root.getByRole('button', { name: 'Reveal decision', exact: true }).click()
  await expect(root.locator('.mom-frame-reason')).toContainText('return pivot 6')
  await root.getByRole('button', { name: 'Show computed answer', exact: true }).click()
  await expect(root.locator('.mom-answer')).toHaveText('k = 7 → 6')
  await root.getByLabel('Median dataset').fill('9, -4, 9, 2, 0, 8, 3')
  await root.getByLabel('Selection rank (k)').fill('2')
  await root.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await root.getByRole('button', { name: 'Show computed answer', exact: true }).click()
  await expect(root.locator('.mom-answer')).toHaveText('k = 2 → 0')
  await root.getByLabel('Selection rank (k)').fill('99')
  await root.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('integer from 1')
  await expect(root.locator('.mom-answer')).toHaveText('k = 2 → 0')
  await root.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root.locator('pre')).toContainText('export function medianTrace')
  await root.getByRole('button', { name: 'Practice', exact: true }).click()
  await root.getByLabel('Worked example answer').fill('6')
  await root.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(root.getByRole('status')).toContainText('Correct')
})
test('017 notes, saved experiments, study status, playback and theme persist', async ({ page }) => {
  await page.goto('/divide-and-conquer/deterministic-selection')
  const root = page.locator('.mom-page')
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await root.getByLabel('Lesson notes').fill('Rank 7 lies in the equal block.')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Save current run', exact: true }).click()
  await root.getByRole('button', { name: 'Mark studied', exact: true }).click()
  await expect(root.locator('.mom-progress')).toContainText('100%')
  await page.reload()
  await root.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root.getByLabel('Lesson notes')).toHaveValue('Rank 7 lies in the equal block.')
  await root.getByRole('button', { name: 'Experiments', exact: true }).click()
  await root.getByRole('button', { name: 'Load experiment 1', exact: true }).click()
  await root.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(root.locator('.mom-playback')).toContainText('Step 2')
  await root.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(root.locator('.mom-playback')).toContainText('Step 1')
  await root.getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const download = page.waitForEvent('download')
  await root.getByRole('button', { name: 'Export trace', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('median-of-medians-trace.json')
})
