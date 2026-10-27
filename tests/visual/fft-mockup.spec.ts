import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const root = (p: Page) => p.locator('.fft-page'),
  button = (p: Page, name: string) => root(p).getByRole('button', { name, exact: true }),
  tab = (p: Page, name: string) => button(p, name).click(),
  close = (p: Page) => button(p, 'Close FFT inspector').click()
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/daa-extensions/fft')
  await expect(root(page)).toBeVisible()
})
test('043 default charts, network and all mockup panels use the displayed sine formula', async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  for (const name of [
    'Signal Input',
    'Time-Domain Signal',
    'Frequency Spectrum',
    'Signal Details',
    'Radix-2 Butterfly Network (N = 8)',
    'Twiddle Factors & Even-Odd Decomposition',
    'Step-by-Step FFT Computation',
    'Correctness',
    'Complexity',
    'Key Takeaways',
  ])
    await expect(root(page).getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(root(page).locator('.fft-chart-point')).toHaveCount(8)
  await expect(root(page).locator('.fft-bin')).toHaveCount(8)
  await expect(root(page).locator('.fft-node')).toHaveCount(40)
  await expect(root(page).locator('.fft-butterfly')).toHaveCount(12)
  await expect(root(page).locator('.fft-step-nav')).toContainText('Step 1 of 4')
  await expect(root(page).locator('.fft-detail-box')).toContainText('k = 2, 3')
  await expect(root(page).locator('.fft-detail-box')).toContainText('|X[2]| = 4')
  if (info.project.name === 'desktop') {
    for (const [selector, expected] of [
      ['.fft-toolbar', { x: 283, y: 12, width: 1375, height: 37 }],
      ['.fft-hero', { x: 283, y: 58, width: 1375, height: 75 }],
      ['.mom-tabs', { x: 283, y: 133, width: 1375, height: 52 }],
      ['.fft-input', { x: 283, y: 198, width: 1375, height: 112 }],
      ['.fft-time', { x: 283, y: 318, width: 534, height: 211 }],
      ['.fft-spectrum', { x: 825, y: 318, width: 500, height: 211 }],
      ['.fft-details', { x: 1333, y: 318, width: 325, height: 211 }],
      ['.fft-network', { x: 283, y: 537, width: 574, height: 289 }],
      ['.fft-twiddle', { x: 865, y: 537, width: 397, height: 289 }],
      ['.fft-steps', { x: 1270, y: 537, width: 388, height: 289 }],
      ['.fft-correctness', { x: 283, y: 834, width: 536, height: 98 }],
      ['.fft-complexity', { x: 827, y: 834, width: 436, height: 98 }],
      ['.fft-takeaways', { x: 1271, y: 834, width: 387, height: 98 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box![key] - expected[key]), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
    await expect(
      page.getByRole('navigation', { name: 'Algorithm navigation', exact: true }).getByRole('link', { name: 'Home dashboard', exact: true }),
    ).toBeInViewport()
    await expect(page.locator('.sidebar-algorithm.active')).toBeInViewport()
    mkdirSync('artifacts/visual-qa/fft-043', { recursive: true })
    await page.screenshot({ path: 'artifacts/visual-qa/fft-043/default.png' })
  }
})
test('043 sample and bin inspectors expose true values, conjugates and undefined zero phase', async ({ page }) => {
  await button(page, 'Inspect sample 0').click()
  await expect(root(page).getByRole('dialog')).toContainText('x[0] = 0')
  await close(page)
  await button(page, 'Inspect sample 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('1.3536')
  await close(page)
  await button(page, 'Inspect frequency bin 6').focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('X[6] = 4i')
  await expect(root(page).getByRole('dialog')).toContainText('Conjugate partner: 2')
  await close(page)
  await button(page, 'Inspect frequency bin 0').click()
  await expect(root(page).getByRole('dialog')).toContainText('Undefined for zero magnitude')
  await page.keyboard.press('Escape')
  await expect(root(page).getByRole('dialog')).not.toBeVisible()
})
test('043 butterfly and decomposition inspectors retain the actual transition values', async ({ page }) => {
  await button(page, 'Inspect butterfly stage 3, pair 1 5').focus()
  await page.keyboard.press('Enter')
  await expect(root(page).getByRole('dialog')).toContainText('W_8^1 = 0.70710678 − 0.70710678i')
  await button(page, 'Go to this FFT stage').click()
  await expect(root(page).locator('.fft-step-nav')).toContainText('Step 4 of 4')
  await button(page, 'Inspect network column 1, row 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('Bit-reversed input index: 4')
  await close(page)
  await root(page).locator('.fft-even-odd button').first().click()
  await expect(root(page).getByRole('dialog')).toContainText('Original indices: 0, 2, 4, 6')
  await close(page)
  await root(page).locator('.fft-twiddle-box').click()
  await expect(root(page).getByRole('dialog')).toContainText('Butterfly certificate')
  await close(page)
})
test('043 custom samples validate atomically and reset discards uncommitted drafts', async ({ page }) => {
  await root(page).getByLabel('Signal type', { exact: true }).selectOption('custom')
  await root(page).getByLabel('Custom sample values', { exact: true }).fill('1,2')
  await button(page, 'Apply samples').click()
  await expect(root(page).getByRole('alert')).toContainText('exactly 8')
  await expect(root(page).locator('.fft-detail-box')).toContainText('k = 2, 3')
  await root(page).getByLabel('Custom sample values', { exact: true }).fill('1 0 0 0 0 0 0 0')
  await button(page, 'Apply samples').click()
  await button(page, 'Inspect frequency bin 7').click()
  await expect(root(page).getByRole('dialog')).toContainText('X[7] = 1')
  await close(page)
  await root(page).getByLabel('Custom sample values', { exact: true }).fill('NaN 0 0 0 0 0 0 0')
  await button(page, 'Apply samples').click()
  await expect(root(page).getByRole('alert')).toContainText('finite')
  await button(page, 'Reset').click()
  await expect(root(page).getByLabel('Custom sample values', { exact: true })).toHaveValue('1, 0, 0, 0, 0, 0, 0, 0')
  await expect(root(page).getByRole('alert')).toHaveCount(0)
})
test('043 playback pauses, resumes, seeks and applies parameter edits coherently', async ({ page }) => {
  await button(page, 'Next FFT step').click()
  await expect(root(page).locator('.fft-step-nav')).toContainText('Step 2 of 4')
  await button(page, 'Resume FFT').click()
  await button(page, 'Pause FFT').click()
  const paused = await root(page).locator('.fft-step-nav').innerText()
  await page.waitForTimeout(1000)
  await expect(root(page).locator('.fft-step-nav')).toHaveText(paused)
  await root(page).getByLabel('First amplitude', { exact: true }).fill('2')
  await button(page, 'Resume FFT').click()
  await expect(root(page).locator('.fft-detail-box')).toContainText('|X[2]| = 8')
  await expect(root(page).locator('.fft-step-nav')).toContainText('Step 4 of 4', { timeout: 5000 })
  await expect(button(page, 'Next FFT step')).toBeDisabled()
  await button(page, 'Reset').click()
  await expect(button(page, 'Previous FFT step')).toBeDisabled()
  await root(page).getByLabel('First frequency', { exact: true }).fill('9')
  await button(page, 'Animate FFT').click()
  await expect(root(page).getByRole('alert')).toContainText('N/2')
})
test('043 spectrum switch, zero, DC and Nyquist examples update every view', async ({ page }) => {
  await root(page).getByRole('switch', { name: 'Show spectrum', exact: true }).click()
  await expect(root(page).locator('.fft-bin')).toHaveCount(0)
  await root(page).getByRole('switch', { name: 'Show spectrum', exact: true }).click()
  await expect(root(page).locator('.fft-bin')).toHaveCount(8)
  await tab(page, 'Experiments')
  await button(page, 'Zero signal').click()
  await expect(root(page).locator('.fft-detail-box')).toContainText('None (zero signal)')
  await tab(page, 'Experiments')
  await button(page, 'Constant / DC').click()
  await button(page, 'Inspect frequency bin 0').click()
  await expect(root(page).getByRole('dialog')).toContainText('X[0] = 16')
  await close(page)
  await tab(page, 'Experiments')
  await button(page, 'Nyquist alternating').click()
  await expect(root(page).locator('.fft-detail-box')).toContainText('k = 4')
})
test('043 two-sample transforms preserve precise fractional amplitudes and one-stage navigation', async ({ page }) => {
  await root(page).getByLabel('Signal type', { exact: true }).selectOption('impulse')
  await root(page).getByLabel('Sample size', { exact: true }).selectOption('2')
  await root(page).getByLabel('First amplitude', { exact: true }).fill('0.125')
  await button(page, 'Animate FFT').click()
  await expect(root(page).locator('.fft-step-nav')).toContainText('Step 2 of 2')
  await expect(root(page).getByLabel('First amplitude', { exact: true })).toHaveValue('0.125')
  await expect(root(page).locator('.fft-node')).toHaveCount(6)
  await button(page, 'Inspect frequency bin 1').click()
  await expect(root(page).getByRole('dialog')).toContainText('X[1] = 0.125')
  await close(page)
  await button(page, 'Reset').click()
  await root(page).locator('.fft-twiddle-box').click()
  await expect(root(page).getByRole('dialog')).toContainText('Stage 1, m = 2, j = 0')
  await close(page)
})
test('043 theory, worked example, code, prediction and persistent notes are usable', async ({ page }) => {
  await tab(page, 'Learn')
  await expect(root(page)).toContainText('complex conjugate')
  await button(page, 'Explore the worked example').click()
  await tab(page, 'Code')
  await expect(root(page).locator('pre')).toContainText('X[k + N / 2] = subtract')
  await tab(page, 'Practice')
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Choose a prediction')
  await button(page, '8').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await button(page, '1').click()
  await button(page, 'Check prediction').click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await button(page, 'Test the impulse example').click()
  await expect(root(page).getByLabel('Signal type', { exact: true })).toHaveValue('impulse')
  await tab(page, 'Experiments')
  await root(page).getByLabel('Your FFT notes', { exact: true }).fill('Conjugate pairs preserve real samples.')
  await page.reload()
  await tab(page, 'Experiments')
  await expect(root(page).getByLabel('Your FFT notes', { exact: true })).toHaveValue('Conjugate pairs preserve real samples.')
})
test('043 topic search supports its keyboard shortcut and matching lesson navigation', async ({ page }) => {
  await page.keyboard.press('Control+k')
  await expect(root(page).getByLabel('Search algorithm topics', { exact: true })).toBeFocused()
  await root(page).getByLabel('Search algorithm topics', { exact: true }).fill('suffix array')
  await page.keyboard.press('Enter')
  await expect(page.locator('.suffix-array-page')).toBeVisible()
})
test('043 thirty-two samples stay within local scroll regions and dark mode remains usable', async ({ page }, info) => {
  await root(page).getByLabel('Sample size', { exact: true }).selectOption('32')
  await button(page, 'Animate FFT').click()
  await button(page, 'Pause FFT').click()
  await expect(root(page).locator('.fft-node')).toHaveCount(224)
  await expect(root(page).locator('.fft-butterfly')).toHaveCount(80)
  const sizeBox = await root(page).getByLabel('Sample size', { exact: true }).boundingBox(),
    fieldsetBox = await root(page).locator('.fft-controls fieldset').boundingBox()
  expect(sizeBox!.x + sizeBox!.width).toBeLessThanOrEqual(fieldsetBox!.x + fieldsetBox!.width)
  expect(sizeBox!.y + sizeBox!.height).toBeLessThanOrEqual(fieldsetBox!.y + fieldsetBox!.height)
  await tab(page, 'Experiments')
  await button(page, 'Toggle color theme').click()
  await tab(page, 'Visualization')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const scroll = root(page).locator('.fft-network-scroll')
  expect(await scroll.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true)
  await scroll.evaluate((e) => {
    e.scrollTop = e.scrollHeight
    e.scrollLeft = e.scrollWidth
  })
  await button(page, 'Inspect network column 6, row 31').click()
  await expect(root(page).getByRole('dialog')).toContainText('After stage 5')
  await close(page)
  mkdirSync('artifacts/visual-qa/fft-043', { recursive: true })
  await page.screenshot({ path: `artifacts/visual-qa/fft-043/${info.project.name}-dark.png`, fullPage: true })
})
