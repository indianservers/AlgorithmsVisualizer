import { test, expect } from '@playwright/test'
const cycle = {
  vertices: 4,
  source: 0,
  directed: true,
  edges: [
    { from: 0, to: 1, weight: 2 },
    { from: 1, to: 2, weight: -3 },
    { from: 2, to: 1, weight: 1 },
  ],
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.removeItem('algodrishti-weighted-graph-view')
  })
})
for (const mode of ['bellman-ford', 'floyd-warshall']) {
  test(`${mode} offers Icons with original weighted graph and labelled route states`, async ({ page }) => {
    await page.goto('/#/graphs/' + mode)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.getByRole('region', { name: `${mode} penguin icons visualization` })).toBeVisible()
    await expect(page.locator('.explorer-node-label')).toHaveText(['0', '1', '2', '3', '4'])
    await expect(page.locator('.explorer-weight > text:first-of-type')).toHaveText(['2', '6', '1', '5', '2', '1'])
    await expect(page.locator('.weighted-bridge[marker-end]')).toHaveCount(6)
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.locator('.route-formula')).toBeVisible()
    const description = await page.locator('.daa-step-description').textContent()
    await page.getByRole('button', { name: 'Graph', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.locator('.daa-step-description')).toHaveText(description!)
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.locator('.explorer-current')).toHaveText('Expedition complete')
    if (mode === 'bellman-ford') await expect(page.locator('.weighted-node-detail')).toHaveText(['d = 0', 'd = 2', 'd = 3', 'd = 5', 'd = 6'])
    else await expect(page.locator('.route-matrix td[data-from="0"][data-to="4"]')).toHaveText('6')
    await page.locator('.weighted-expedition').screenshot({ path: `test-results/route-${mode}-${test.info().project.name}.png`, animations: 'disabled' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
  test(`${mode} warns about cycle-affected distances`, async ({ page }) => {
    await page.goto('/#/graphs/' + mode)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await page.getByText('Advanced: edit full JSON input', { exact: true }).click()
    await page.getByRole('textbox', { name: 'Problem input (JSON)', exact: true }).fill(JSON.stringify(cycle))
    await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.locator('.explorer-current')).toHaveText('Negative cycle detected')
    await expect(page.locator('.route-cycle-warning')).toContainText('no finite shortest distance')
    if (mode === 'bellman-ford') await expect(page.locator('.weighted-node-detail')).toHaveText(['d = 0', 'd = −∞', 'd = −∞', 'd = ∞'])
    else await expect(page.locator('.route-matrix td[data-from="0"][data-to="2"]')).toHaveText('−∞')
  })
}
