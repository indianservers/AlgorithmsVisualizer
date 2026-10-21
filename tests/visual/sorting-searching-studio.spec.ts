import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { isStudioId } from '../../src/studio/engine'
import { algorithmPath } from '../../src/utils/routing'

const modules = allModules.filter((m) => ['Sorting', 'Searching'].includes(m.category) && isStudioId(m.id))
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-input', '1, 2, 3, 4, 5')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.setItem('algodrishti-onboarded', 'true')
  })
})

test('all sorting and searching routes share the execution studio on desktop and mobile', async ({ page }) => {
  test.setTimeout(180000)
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const module of modules) {
      await page.goto('/#' + algorithmPath(module))
      await expect(page.locator('.algorithm-studio'), module.id).toBeVisible()
      await expect(page.getByRole('button', { name: 'Visualization', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('button', { name: /Run (sort|search|algorithm)/ })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${module.id}/${width}`).toBe(true)
      await page.getByRole('button', { name: 'Jump to last step' }).click()
      await expect(page.locator('.studio-explanation')).toContainText(/Complete|Found|boundary|peak|not found|No two/)
      if (width > 700) {
        await expect(page.locator('.studio-source-line.executing'), module.id).not.toHaveCount(0)
        if (module.category === 'Sorting') await expect(page.getByRole('spinbutton', { name: 'Target', exact: true })).toHaveCount(0)
      } else await expect(page.locator('details.studio-code')).not.toHaveAttribute('open', '')
    }
  }
})

test('code languages, timeline, input edits and playback share one historical state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#/sorting/bubble-sort')
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('3, 1, 2')
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(page.locator('.studio-source-line.executing')).toHaveAttribute('data-line-id', 'compare')
  const step = await page.getByRole('slider', { name: 'Timeline step', exact: true }).inputValue()
  for (const name of ['Python', 'C++', 'Java', 'Pseudocode', 'JavaScript']) {
    await page.getByRole('button', { name, exact: true }).click()
    expect(await page.getByRole('slider', { name: 'Timeline step', exact: true }).inputValue()).toBe(step)
    await expect(page.locator('.studio-source-line.executing').first()).toHaveAttribute('data-line-id', 'compare')
  }
  await page.getByRole('button', { name: 'Python', exact: true }).focus()
  await page.getByRole('button', { name: 'Python', exact: true }).press('Space')
  await expect(page.getByRole('button', { name: 'Python', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Run sort', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Step forward', exact: true }).click()
  expect(await page.locator('.studio-column').evaluateAll((items) => items.map((e) => e.getAttribute('data-value')))).toEqual(['1', '3', '2'])
  await page.getByRole('button', { name: 'Step backward', exact: true }).click()
  expect(await page.locator('.studio-column').evaluateAll((items) => items.map((e) => e.getAttribute('data-value')))).toEqual(['3', '1', '2'])
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Run sort', exact: true }).click()
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
  }
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('9\n-3, 2.5, 2.5, 0')
  await expect(page.getByRole('slider', { name: 'Timeline step', exact: true })).toHaveValue('0')
  await expect(page.getByRole('button', { name: 'Run sort', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  expect(await page.locator('.studio-column').evaluateAll((items) => items.map((e) => e.getAttribute('data-value')))).toEqual(['-3', '0', '2.5', '2.5', '9'])
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('')
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  await expect(page.locator('.studio-explanation')).toContainText('Complete')
})

test('selection studio matches reference hierarchy and remains focused on phones', async ({ page }) => {
  for (const width of [1672, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/#/sorting/selection-sort')
    const input = page.getByRole('textbox', { name: 'Dataset', exact: true })
    if (width <= 700) await expect(page.locator('details.studio-input')).toHaveAttribute('open', '')
    await input.fill('7, 3, 9, 1, 6, 4, 8, 2, 5, 3')
    if (width > 700) {
      const bounds = await input.boundingBox()
      expect(bounds!.height).toBeGreaterThanOrEqual(115)
      if (width >= 1180) expect(bounds!.width).toBeGreaterThanOrEqual(330)
    } else await page.locator('details.studio-input > summary').click()
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Step forward', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.screenshot({ path: `artifacts/studio-selection-${width}.png`, fullPage: true })
  }
})
