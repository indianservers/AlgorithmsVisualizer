import { test, expect } from '@playwright/test'
import { lessonById } from '../../src/daa/catalog'
import { executeLesson } from '../../src/daa/types'
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.removeItem('algodrishti-weighted-graph-view')
  })
})
for (const mode of ['kahn-topological-sort', 'kosaraju-scc'])
  test(`${mode} preserves Graph view, labels, weights, arrows and timeline`, async ({ page }) => {
    await page.goto('/#/graphs/' + mode)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.getByRole('region', { name: `${mode} penguin icons visualization` })).toBeVisible()
    await expect(page.locator('.explorer-node-label')).toHaveText(['0', '1', '2', '3', '4'])
    await expect(page.locator('.explorer-weight > text:first-of-type')).toHaveText(
      mode === 'kosaraju-scc' ? ['2', '6', '1', '5', '2', '1', '1'] : ['2', '6', '1', '5', '2', '1'],
    )
    await expect(page.locator('.weighted-bridge[marker-end]')).toHaveCount(mode === 'kosaraju-scc' ? 7 : 6)
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    const description = await page.locator('.daa-step-description').textContent()
    await page.getByRole('button', { name: 'Graph', exact: true }).click()
    await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
    await page.getByRole('button', { name: 'Icons', exact: true }).click()
    await expect(page.locator('.daa-step-description')).toHaveText(description!)
    await page.getByRole('button', { name: 'Last', exact: true }).click()
    await expect(page.locator('.explorer-current')).toHaveText('Expedition complete')
    if (mode === 'kosaraju-scc') {
      await expect(page.locator('.weighted-groups > span')).toHaveCount(4)
      await expect(page.locator('.network-map-caption')).toContainText('original arrow directions restored')
    } else await expect(page.locator('.network-output > div > span')).toHaveText(['10', '21', '32', '43', '54'])
    await page.locator('.weighted-expedition').screenshot({ path: `test-results/network-${mode}-${test.info().project.name}.png`, animations: 'disabled' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
test('SCC shows a clearly labelled transpose and preserves original graph view', async ({ page }) => {
  const lesson = lessonById.get('kosaraju-scc')!,
    run = executeLesson(lesson, lesson.defaultInput!)
  const transpose = run.steps.findIndex((s) => s.state?.networkStudy?.phase === 'transpose')
  await page.goto('/#/graphs/kosaraju-scc')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByRole('button', { name: 'Icons', exact: true }).click()
  for (let i = 0; i < transpose; i++) await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.network-map-caption')).toContainText('arrows reversed, weights unchanged')
  await expect(page.locator('.weighted-groups > span')).toHaveCount(0)
  await page.getByRole('button', { name: 'Graph', exact: true }).click()
  await expect(page.getByRole('img', { name: 'Weighted graph state' })).toBeVisible()
  await page.getByRole('button', { name: 'Icons', exact: true }).click()
  await expect(page.locator('.network-map-caption')).toContainText('arrows reversed')
})
test('topological Icons reports a cycle rather than claiming a complete order', async ({ page }) => {
  await page.goto('/#/graphs/kahn-topological-sort')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByText('Advanced: edit full JSON input', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Problem input (JSON)', exact: true }).fill(
    JSON.stringify({
      vertices: 3,
      source: 0,
      directed: true,
      edges: [
        { from: 0, to: 1, weight: 2 },
        { from: 1, to: 0, weight: 3 },
        { from: 1, to: 2, weight: 4 },
      ],
    }),
  )
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await page.getByRole('button', { name: 'Icons', exact: true }).click()
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  await expect(page.locator('.explorer-current')).toHaveText('Cycle blocks the dispatch')
  await expect(page.locator('.network-cycle-warning')).toContainText('downstream of a cycle')
  await expect(page.locator('.network-output > div > span')).toHaveCount(0)
})
