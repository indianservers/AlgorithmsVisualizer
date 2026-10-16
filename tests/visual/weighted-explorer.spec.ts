import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.removeItem('algodrishti-weighted-graph-view')
  })
})
for (const mode of ['dijkstra', 'prim', 'kruskal'])
  test(`${mode} preserves Graph and adds weighted penguin Icons`, async ({ page }) => {
    await page.goto('/#/graphs/' + mode)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.getByRole('region', { name: `${mode} penguin icons visualization` })).toBeVisible()
    await expect(page.locator('.explorer-node-label')).toHaveText(['0', '1', '2', '3', '4'])
    await expect(page.locator('.explorer-weight > text:first-of-type')).toHaveText(['2', '6', '1', '5', '2', '1'])
    await expect(page.locator('.weighted-bridge[marker-end]')).toHaveCount(mode === 'dijkstra' ? 6 : 0)
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    const description = await page.locator('.daa-step-description').textContent()
    await page.getByRole('button', { name: 'Graph', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.locator('.daa-step-description')).toHaveText(description!)
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.locator('.explorer-current')).toHaveText('Expedition complete')
    if (mode === 'dijkstra') await expect(page.locator('.weighted-node-detail')).toHaveText(['d = 0', 'd = 2', 'd = 3', 'd = 5', 'd = 6'])
    else await expect(page.locator('.weighted-decision')).toContainText('Minimum spanning tree · total weight 6')
    if (mode === 'kruskal') {
      await expect(page.locator('.weighted-edge-ticket.reject')).toHaveCount(2)
      await expect(page.locator('.weighted-groups > span')).toHaveCount(1)
    }
    await page.locator('.weighted-expedition').screenshot({ path: `test-results/weighted-${mode}-${test.info().project.name}.png`, animations: 'disabled' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
