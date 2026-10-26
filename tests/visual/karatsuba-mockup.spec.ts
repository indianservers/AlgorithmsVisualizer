import { test, expect, type Page } from '@playwright/test'
const root = (p: Page) => p.locator('.karatsuba-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close Karatsuba dialog').click()
async function input(p: Page, x: string, y: string) {
  await root(p).getByLabel('Karatsuba first integer').fill(x)
  await root(p).getByLabel('Karatsuba second integer').fill(y)
  await button(p, 'Compute').click()
}
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/karatsuba')
  await expect(root(page)).toBeVisible()
})
test('035 reference panels, exact arithmetic and desktop anchors match the example', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1586, height: 992 })
  for (const name of ['Interactive Visualization', 'How it works', 'Formula', 'Intermediate products', 'Complexity', 'Recursion tree (first level)'])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.mom-tabs button')).toHaveCount(5)
  await expect(root(page).locator('.kt-product')).toHaveCount(3)
  await expect(root(page).locator('.kt-product strong')).toHaveText(['= 2652', '= 6164', '= 672'])
  await expect(root(page).locator('.kt-result')).toContainText('1234 × 5678 = 7006652')
  await expect(root(page).locator('.kt-table-scroll tbody tr')).toHaveCount(3)
  await expect(root(page).locator('.kt-table-scroll tbody tr').nth(1).locator('td')).toHaveText(['z1', '(34 + 12) × (78 + 56)', '6164'])
  await expect(button(page, 'Inspect Karatsuba call P1')).toContainText('(n = 3)')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.kt-topbar', { x: 284, y: 14, width: 1289, height: 43 }],
      ['.mom-tabs', { x: 284, y: 66, width: 1289, height: 49 }],
      ['.kt-visualization', { x: 284, y: 126, width: 842, height: 644 }],
      ['.kt-input-panel', { x: 297, y: 199, width: 816, height: 94 }],
      ['.kt-diagram-scroll', { x: 297, y: 300, width: 816, height: 458 }],
      ['.kt-recursion', { x: 284, y: 781, width: 842, height: 150 }],
      ['.kt-how', { x: 1137, y: 126, width: 436, height: 277 }],
      ['.kt-formula', { x: 1137, y: 414, width: 436, height: 190 }],
      ['.kt-intermediate', { x: 1137, y: 615, width: 436, height: 172 }],
      ['.kt-complexity', { x: 1137, y: 798, width: 436, height: 132 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key])).toBeLessThanOrEqual(2)
    }
    expect((await page.locator('.aimer-site-footer').boundingBox())!.y).toBe(941)
  }
})
test('035 step playback reveals returned products before the final combination', async ({ page }) => {
  await button(page, 'Step split').click()
  await expect(root(page).locator('.kt-product strong')).toHaveText(['Pending', 'Pending', 'Pending'])
  await expect(root(page).locator('.kt-result')).toContainText('Waiting for all three products')
  await expect(root(page).locator('.kt-trace-status')).toContainText('Split 1234 and 5678')
  for (const i of [0, 1, 2]) {
    await button(page, `Inspect Karatsuba product z${i}`).click()
    await button(page, 'Show product return').click()
    await expect(root(page).locator('.kt-product strong').nth(i)).toHaveText(`= ${[2652, 6164, 672][i]}`)
  }
  await expect(root(page).locator('.kt-result')).toContainText('Waiting')
  await button(page, 'Step split').click()
  await expect(root(page).locator('.kt-result')).toContainText('7006652')
  await button(page, 'Reset').click()
  await expect(root(page).locator('.kt-trace-status')).toHaveCount(0)
})
test('035 editable exact inputs and spinner controls compute real products', async ({ page }) => {
  await button(page, 'Increase first number').click()
  await expect(root(page).getByLabel('Karatsuba first integer')).toHaveValue('1235')
  await expect(root(page).getByRole('status')).toContainText('Inputs changed')
  await button(page, 'Compute').click()
  await expect(root(page).locator('.kt-result')).toContainText(String(1235n * 5678n))
  await button(page, 'Decrease first number').click()
  await button(page, 'Increase second number').click()
  await button(page, 'Compute').click()
  await expect(root(page).locator('.kt-result')).toContainText(String(1234n * 5679n))
  await input(page, '-123', '45678')
  await expect(root(page).locator('.kt-result')).toContainText('-5618394')
  await expect(root(page).locator('.kt-split-x h3')).toContainText('|x|')
  await button(page, 'Inspect Karatsuba result').click()
  await expect(page.getByRole('dialog')).toContainText('input signs differ')
  await close(page)
})
test('035 invalid decimal inputs preserve the last computed diagram', async ({ page }) => {
  for (const invalid of ['', '1.5', '1e3', 'NaN', '9'.repeat(25)]) {
    await root(page).getByLabel('Karatsuba first integer').fill(invalid)
    await button(page, 'Compute').click()
    await expect(root(page).getByRole('alert')).toBeVisible()
    await expect(root(page).locator('.kt-result')).toContainText('7006652')
  }
  await button(page, 'Reset').click()
  await expect(root(page).getByRole('alert')).toHaveCount(0)
  await input(page, '000012', '+000034')
  await expect(root(page).getByLabel('Karatsuba first integer')).toHaveValue('12')
  await expect(root(page).locator('.kt-result')).toContainText('408')
})
test('035 recursive calls and product inspectors retain exact splits and cross terms', async ({ page }) => {
  await button(page, 'Inspect Karatsuba call P1').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('46 × 134 = 6164')
  await expect(page.getByRole('dialog')).toContainText('Low-part digits m = 1')
  await button(page, 'Open call P11').click()
  await expect(page.getByRole('dialog')).toContainText('10 × 17 = 170')
  await button(page, 'Inspect parent call').click()
  await expect(page.getByRole('dialog')).toContainText('Recursive Call P1')
  await button(page, 'Show this recursive event').click()
  await expect(root(page).locator('.kt-trace-status')).toContainText('46 × 134')
  await button(page, 'Inspect intermediate product z1').click()
  await expect(page.getByRole('dialog')).toContainText('recover the cross coefficient')
  await close(page)
  await button(page, 'Inspect Karatsuba recombination').click()
  await expect(page.getByRole('dialog')).toContainText('6164 − 672 − 2652 = 2840')
  await close(page)
})
test('035 automatic recursion reaches the final exact result', async ({ page }) => {
  await tab(page, 'Experiments')
  await button(page, 'Jump to first split').click()
  await root(page).getByLabel('Karatsuba playback speed').selectOption('100')
  await button(page, 'Auto multiply').click()
  await expect(button(page, 'Pause playback')).toBeVisible()
  await expect(button(page, 'Auto multiply')).toBeVisible({ timeout: 15000 })
  await expect(root(page).locator('.kt-run-summary')).toContainText('7006652')
  await button(page, 'Previous recursive event').click()
  await expect(root(page).locator('.kt-run-summary')).toContainText('high product')
  await button(page, 'Jump to final product').click()
  await button(page, 'Return to multiplication diagram').click()
  await expect(root(page).locator('.kt-result')).toContainText('7006652')
})
test('035 one-digit and zero operands use truthful base cases', async ({ page }) => {
  await input(page, '7', '98765')
  await expect(root(page).locator('.kt-base-case')).toContainText('691355')
  await expect(root(page).locator('.kt-product')).toHaveCount(0)
  await expect(button(page, 'Step split')).toBeDisabled()
  await expect(root(page).locator('.kt-tree-node')).toHaveCount(1)
  await input(page, '0', '5678')
  await expect(root(page).locator('.kt-result')).toContainText('0 × 5678 = 0')
  await expect(root(page).locator('.kt-table-scroll tbody tr').first()).toContainText('—')
})
test('035 theory, pseudocode, predictions and saved notes teach three products', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('2840·100 + 2652 = 7006652')
  await expect(root(page)).toContainText('extra digit')
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('z1 - z2 - z0')
  await tab(page, 'Practice')
  await root(page).getByLabel('Predicted Karatsuba product').fill('672')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Predicted Karatsuba product').fill('6164')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Karatsuba notes').fill('Subtract low and high products from the sum product.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Karatsuba notes')).toHaveValue('Subtract low and high products from the sum product.')
})
test('035 twenty-four digit products retain precision in dark narrow layouts', async ({ page }, info) => {
  const value = '999999999999999999999999',
    expected = String(BigInt(value) ** 2n)
  await input(page, value, value)
  await button(page, 'Inspect Karatsuba result').click()
  await expect(page.getByRole('dialog')).toContainText(expected)
  await close(page)
  await tab(page, 'Practice')
  await root(page)
    .getByLabel('Predicted Karatsuba product')
    .fill(String(1999999999998n ** 2n))
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await button(page, 'Return to multiplication diagram').click()
  const treeLabelsFit = await root(page)
    .locator('.kt-tree-node')
    .evaluateAll((nodes) =>
      nodes.every((node) => {
        const width = Number(node.querySelector('rect')!.getAttribute('width'))
        return [...node.querySelectorAll('text')].every((text) => text.getComputedTextLength() <= width - 6)
      }),
    )
  expect(treeLabelsFit).toBe(true)
  for (const width of [1280, 1024, 768, 393, 320]) {
    await page.setViewportSize({ width, height: 950 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  expect(
    await root(page)
      .locator('.kt-diagram-scroll')
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true)
  await page.screenshot({ path: `artifacts/visual-qa/karatsuba-035/${info.project.name}-dark.png` })
})
