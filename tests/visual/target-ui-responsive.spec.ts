import { expect, test } from '@playwright/test'
const routes = [
  '/#/analysis-correctness/asymptotic-notation',
  '/#/divide-and-conquer/maximum-subarray',
  '/#/branch-and-bound/tsp-branch-and-bound',
  '/#/complexity-theory/p-np-classes',
  '/#/daa-extensions/fft',
]
test.describe('target workspace responsive layout', () => {
  test.use({ viewport: { width: 393, height: 851 } })
  for (const route of routes)
    test(route, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('.target-visual')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Step forward' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
    })
})
