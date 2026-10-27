import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
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
    for (const [key, value] of Object.entries({ x: 291, y: 65, width: 1365, height: 119 }))
      expect(Math.abs(hero![key as keyof typeof hero] - value), `Median hero ${key}`).toBeLessThanOrEqual(3)
    for (const [selector, expected] of [
      ['.mom-dashboard', { x: 291, y: 245, width: 1365 }],
      ['.mom-groups-panel', { x: 291, y: 245, width: 584, height: 208 }],
      ['.mom-sort-panel', { x: 884, y: 245, width: 418, height: 208 }],
      ['.mom-side-cards', { x: 1316, y: 245, width: 340 }],
      ['.mom-pivot-panel', { x: 291, y: 463, width: 561, height: 145 }],
      ['.mom-guarantee-panel', { x: 861, y: 463, width: 441, height: 145 }],
      ['.mom-workflow-panel', { x: 291, y: 618, width: 636, height: 180 }],
      ['.mom-recurrence-panel', { x: 936, y: 618, width: 366, height: 180 }],
      ['.mom-bottom-grid', { x: 291, y: 808, width: 1365 }],
    ] as const) {
      const box = await pageRoot.locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected))
        expect(Math.abs(box![key as keyof typeof box] - value), `Median ${selector} ${key}`).toBeLessThanOrEqual(3)
    }
  }
  mkdirSync('artifacts/visual-qa/median-017', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/median-017/${info.project.name}-learn.png`, fullPage: false })
  const layout = await pageRoot
    .locator('.mom-hero,.mom-tabs,.mom-main-grid>.mom-panel,.mom-last-row>.mom-panel,.mom-side-cards>article,.mom-bottom-grid>.mom-panel')
    .evaluateAll((elements) => elements.map((e) => ({ className: e.className, ...e.getBoundingClientRect().toJSON() })))
  writeFileSync(`artifacts/visual-qa/median-017/${info.project.name}-layout.json`, JSON.stringify(layout, null, 2))
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

test('017 groups, split proof and workflow branches support inspection and keyboard access', async ({ page }) => {
  await page.goto('/divide-and-conquer/deterministic-selection')
  const root = page.locator('.median-reference-page'),
    close = () => root.getByRole('button', { name: 'Close median inspector', exact: true }).click()
  await root.getByRole('button', { name: 'Inspect group 1', exact: true }).click()
  await expect(root.getByRole('dialog')).toContainText('Sorted order: [2, 4, 5, 7, 9]')
  await close()
  await root.getByRole('button', { name: 'Inspect sorted group 5', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root.getByRole('dialog')).toContainText('median 19')
  await page.keyboard.press('Escape')
  await root.getByRole('button', { name: 'Explain Recursively Select Pivot (Median of Medians)', exact: true }).click()
  await expect(root.getByRole('dialog')).toContainText('Their median is 11')
  await close()
  await root.getByRole('button', { name: 'Explain Guaranteed Split (≈ 3n/10 on each side)', exact: true }).click()
  await expect(root.getByRole('dialog')).toContainText('constant adjustment')
  await close()
  for (const [name, expected] of [
    ['k ≤ |L|', 'same rank k'],
    ['|L| < k ≤ |L| + |E|', 'including duplicates'],
    ['k > |L| + |E|', 'k′ = k − |L| − |E|'],
  ]) {
    await root.getByRole('button', { name: `Explain workflow branch ${name}`, exact: true }).click()
    await expect(root.getByRole('dialog')).toContainText(expected)
    await close()
  }
  await root.getByRole('button', { name: 'Explain Recurrence & Linear-Time Guarantee', exact: true }).click()
  await expect(root.getByRole('dialog')).toContainText('9/10 < 1')
  await close()
})

test('017 worked-example stage links seek actual root frames', async ({ page }) => {
  await page.goto('/divide-and-conquer/deterministic-selection')
  const root = page.locator('.median-reference-page')
  await root.getByRole('button', { name: 'Explore worked example step 3', exact: true }).click()
  await expect(root.locator('.mom-frame-reason')).toContainText('|L|=6, |E|=1, |R|=8')
  await expect(root.getByLabel('Selection rank (k)')).toHaveValue('7')
  await root.getByRole('button', { name: 'Learn', exact: true }).click()
  await root.getByRole('button', { name: 'Explore worked example step 5', exact: true }).click()
  await expect(root.locator('.mom-frame-reason')).toHaveText('The 7th smallest value is 6.')
})

test('017 maximum duplicate inputs and extreme ranks preserve equal-block selection', async ({ page }) => {
  await page.goto('/divide-and-conquer/deterministic-selection')
  const root = page.locator('.median-reference-page')
  await root.getByRole('button', { name: 'Visualization', exact: true }).click()
  await root.getByLabel('Median dataset').fill(Array(60).fill('7').join(','))
  await root.getByLabel('Selection rank (k)').fill('60')
  await root.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await root.getByRole('button', { name: 'Show computed answer', exact: true }).click()
  await expect(root.locator('.mom-answer')).toHaveText('k = 60 → 7')
  await root.getByLabel('Median dataset').fill(Array(61).fill('7').join(','))
  await root.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(root.getByRole('alert')).toContainText('1–60')
  await expect(root.locator('.mom-answer')).toHaveText('k = 60 → 7')
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
