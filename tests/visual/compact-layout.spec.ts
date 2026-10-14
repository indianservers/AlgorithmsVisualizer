import { test, expect } from '@playwright/test'

test('page introductions fit their text rather than the sidebar height', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
  await page.setViewportSize({ width: 1920, height: 1080 })
  for (const route of ['sorting/bubble-sort', 'graphs/graph-representation-suite', 'graphs/bfs-traversal']) {
    await page.goto('/#/' + route)
    const hero = page.locator('.category-hero')
    if (await hero.isVisible()) {
      const bounds = await hero.boundingBox()
      expect(bounds!.height, route).toBeLessThan(320)
      for (const card of await page.locator('.learning-paths article').all()) {
        expect((await card.boundingBox())!.height, route).toBeLessThan(180)
        const title = await card.locator('strong').boundingBox()
        const text = await card.locator('span').boundingBox()
        expect(text!.y - title!.y - title!.height, route).toBeLessThan(14)
      }
    }
    await expect(page.getByRole('button', { name: 'Learn', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Code', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Code', exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.goto('/#/graphs/graph-representation-suite')
  await page.screenshot({ path: `test-results/compact-introduction-${test.info().project.name}.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const card of await page.locator('.learning-paths article').all()) {
    if (await card.isVisible()) expect((await card.boundingBox())!.height).toBeLessThan(180)
  }
})
