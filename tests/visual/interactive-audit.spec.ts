import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

test('every executable DAA lesson opens with a computed example and editable fields', async ({ page }) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 360, height: 800 })
  for (const module of allModules.filter((item) => item.typedRunner)) {
    await page.goto('/#' + algorithmPath(module))
    await page.getByRole('button', { name: 'Open visualization & edit data →' }).click()
    await expect(page.getByRole('heading', { name: 'Computed timeline' }), module.id).toBeVisible()
    await expect(page.locator('.daa-state'), module.id).toBeVisible()
    await expect(page.locator('.daa-field-editor'), module.id).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), module.id).toBe(true)
  }
})

test('BFS accepts a custom graph and Dijkstra reacts to edge edits', async ({ page }) => {
  for (const id of ['bfs-traversal', 'dijkstra']) {
    await page.goto('/#/graphs/' + id)
    await page.getByRole('button', { name: 'Open visualization & edit data →' }).click()
    await page.getByText('Advanced: edit full JSON input', { exact: true }).click()
    await page.getByLabel('Problem input (JSON)').fill(
      JSON.stringify({
        vertices: 3,
        directed: true,
        source: 0,
        edges: [
          { from: 0, to: 1, weight: 7 },
          { from: 1, to: 2, weight: 2 },
        ],
      }),
    )
    await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
    await expect(page.locator('.daa-graph circle')).toHaveCount(3)
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.locator('.daa-result')).toContainText(id === 'dijkstra' ? '9' : '2')
    await page.getByLabel('Edge 1 weight', { exact: true }).fill('4')
    await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    if (id === 'dijkstra') await expect(page.locator('.daa-result')).toContainText('6')
  }
})

test('maximum subarray highlights its answer and Strassen shows operands and products', async ({ page }) => {
  await page.goto('/#/divide-and-conquer/maximum-subarray')
  await page.getByRole('button', { name: 'Open visualization & edit data →' }).click()
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await expect(page.locator('.daa-value-chart .active').first()).toBeVisible()
  await page.getByLabel('values values', { exact: true }).fill('-4, 7, -1, 3, -9')
  await page.getByRole('button', { name: 'Apply values', exact: true }).click()
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await expect(page.locator('.daa-result')).toContainText('"sum": 9')
  await page.goto('/#/divide-and-conquer/strassen')
  await page.getByRole('button', { name: 'Open visualization & edit data →' }).click()
  await expect(page.locator('.daa-matrices')).toContainText('A')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.daa-step-description')).toContainText('Scalar multiplication')
  await page.getByLabel('a values', { exact: true }).fill('1, 0\n0, 1')
  await page.getByRole('button', { name: 'Apply a', exact: true }).click()
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await expect(page.locator('.daa-result')).toContainText('5')
  await page.screenshot({ path: `test-results/strassen-${test.info().project.name}.png`, fullPage: true })
})
