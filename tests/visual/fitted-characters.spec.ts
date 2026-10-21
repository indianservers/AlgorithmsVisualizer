import { test, expect } from '@playwright/test'
test('character panes fit without nested scrollbars', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
  })
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    for (const route of ['sorting/selection-sort', 'sorting/merge-sort', 'searching/linear-search']) {
      await page.goto('/#/' + route)
      await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('79, 18, 67, 9, 31, 73, 54, 26, 88, 12')
      await page.getByRole('combobox', { name: 'Bar icons', exact: true }).selectOption('penguins')
      const pane = page.locator('.studio-chart-scroll')
      expect(await pane.evaluate((e) => e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1)).toBe(true)
      const bounds = await pane.boundingBox()
      for (const item of await page.locator('.studio-column').all()) {
        const b = await item.boundingBox()
        expect(b!.x).toBeGreaterThanOrEqual(bounds!.x - 1)
        expect(b!.x + b!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    }
    await page.locator('.studio-visual').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `artifacts/fitted-characters-${width}.png`, fullPage: true })
  }
})
