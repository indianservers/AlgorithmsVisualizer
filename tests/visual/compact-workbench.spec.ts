import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

const sizes = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]

test('every category shares a compact header and immediately accessible learning tabs', async ({ page }) => {
  test.setTimeout(180000)
  await page.setViewportSize(sizes[1])
  const categories = [...new Set(allModules.map((m) => m.category))]
  for (const category of categories) {
    const module =
      allModules.find((m) => m.category === category && m.typedRunner) ??
      allModules.find((m) => m.category === category && m.runner && !m.id.includes('suite')) ??
      allModules.find((m) => m.category === category && m.id !== 'syllabus-dashboard')!
    if (!module) continue
    await page.goto('/#' + algorithmPath(module))
    await expect(page.getByRole('heading', { name: module.name, exact: true })).toBeVisible()
    await expect(page.locator('.compact-lesson-header'), category).toBeVisible()
    const header = await page.locator('.compact-lesson-header').boundingBox()
    const tabs = await page.locator('.lesson-tabs').boundingBox()
    expect(tabs!.y + tabs!.height - header!.y, category).toBeLessThanOrEqual(115)
    expect(tabs!.y - header!.y - header!.height, category).toBeLessThanOrEqual(20)
    expect(await page.locator('.daa-visual-entry,.algorithm-hero').count()).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), category).toBe(true)
  }
})

test('workbenches fit five viewport sizes and retain navigation, zoom, inputs and icons', async ({ page }) => {
  test.setTimeout(180000)
  for (const size of sizes) {
    await page.setViewportSize(size)
    for (const route of [
      'graphs/bellman-ford',
      'graphs/prim',
      'sorting/bubble-sort',
      'searching/binary-search',
      'data-structures/stack',
      'games/chess-minimax',
      'matrix-grid/matrix-grid-suite',
      'divide-and-conquer/strassen',
    ]) {
      await page.goto('/#/' + route)
      await expect(page.locator('.compact-lesson-header')).toBeVisible()
      await page.getByRole('button', { name: 'Visualization', exact: true }).click()
      const canvas = page.locator('.viewport-canvas')
      await expect(canvas).toBeVisible()
      const title = await page.locator('.compact-lesson-header h1').boundingBox()
      const menu = page.getByRole('button', { name: 'Open menu', exact: true })
      if (await menu.isVisible()) {
        const bounds = await menu.boundingBox()
        expect(bounds!.x + bounds!.width <= title!.x || bounds!.y + bounds!.height <= title!.y, route).toBe(true)
      }
      const box = await canvas.boundingBox()
      expect(box!.y, `${route} ${size.width}`).toBeLessThan(size.height - 150)
      expect(box!.height).toBeGreaterThanOrEqual(350)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} ${size.width}`).toBe(true)
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
      await expect(page.locator('.canvas-view-tools')).toContainText('110%')
      await page.getByRole('button', { name: 'Fit to view', exact: true }).click()
      await expect(page.locator('.canvas-view-tools')).toContainText('100%')
      if (route === 'graphs/prim') {
        await page.getByRole('button', { name: 'Next', exact: true }).click()
        const index = await page.getByRole('slider', { name: 'Timeline step', exact: true }).inputValue()
        await page.getByRole('button', { name: 'Icons', exact: true }).click()
        await expect(page.locator('.weighted-expedition')).toBeVisible()
        expect(await page.getByRole('slider', { name: 'Timeline step', exact: true }).inputValue()).toBe(index)
        await page.getByRole('button', { name: 'Graph', exact: true }).click()
      }
      if (['graphs/prim', 'sorting/bubble-sort'].includes(route)) await page.screenshot({ path: `artifacts/compact/${route.split('/')[1]}-${size.width}.png` })
    }
  }
})

test('graph edge editor scrolls independently and validation stays accessible', async ({ page }) => {
  await page.setViewportSize(sizes[0])
  await page.goto('/#/graphs/bellman-ford')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Add edge', exact: true }).click()
  const edges = page.locator('.daa-edge-list')
  expect(await edges.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true)
  await expect(page.getByRole('button', { name: 'Run algorithm', exact: true })).toBeVisible()
  await page.getByLabel('vertices', { exact: true }).fill('0')
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Reset input', exact: true }).click()
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(page.locator('.daa-graph')).toBeVisible()
})
