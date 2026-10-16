import { expect, test } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
  })
})

test('every catalog algorithm has visible Learn content on a narrow phone', async ({ page }) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 360, height: 800 })
  for (const module of allModules.filter((m) => m.id !== 'syllabus-dashboard')) {
    await page.goto('/#' + algorithmPath(module))
    await page.getByRole('button', { name: 'Learn', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Learn', exact: true }), module.id).toHaveAttribute('aria-pressed', 'true')
    if (module.lessonId) await expect(page.getByRole('heading', { name: 'Concept and worked example' }), module.id).toBeVisible()
    else {
      await expect(page.getByRole('heading', { name: `Learn ${module.name}`, exact: true }), module.id).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Correctness and invariant', exact: true }), module.id).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Time and space analysis', exact: true }), module.id).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), module.id).toBe(true)
  }
})

test('legacy tabs separate theory, visualization, implementation and practice without resetting progress', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/#/sorting/bubble-sort')
  await expect(page.getByRole('heading', { name: 'Learn Bubble Sort', exact: true })).toBeVisible()
  await expect(page.locator('.visual-canvas')).toBeHidden()
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await expect(page.locator('.visual-canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Step forward', exact: true }).click()
  const index = await page.locator('.step-meter input').inputValue()
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await expect(page.locator('.visual-canvas')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Learn Bubble Sort', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Code', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Code Walkthrough' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Learn Bubble Sort', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'DAA reasoning practice' })).toBeVisible()
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  expect(await page.locator('.step-meter input').inputValue()).toBe(index)
})

test('all executable catalog pages fit phone width in Visualization', async ({ page }) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 360, height: 800 })
  for (const module of allModules.filter((m) => m.runner || m.typedRunner)) {
    await page.goto('/#' + algorithmPath(module))
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    if (module.typedRunner) await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), module.id).toBe(true)
  }
})

test('representative categories fit 320px phones and 768px tablets in Visualization', async ({ page }) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/sorting/bubble-sort',
      '/searching/binary-search',
      '/data-structures/stack',
      '/graphs/bfs-traversal',
      '/games/chess-minimax',
      '/matrix-grid/matrix-grid-suite',
      '/graphs/dijkstra',
      '/dynamic-programming/zero-one-knapsack',
    ]) {
      await page.goto('/#' + route)
      await page.getByRole('button', { name: 'Visualization', exact: true }).click()
      await expect(page.locator('.lesson-tabs')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}: ${route}`).toBe(true)
    }
  }
})

test('Learn phone layout visual review', async ({ page }) => {
  await page.goto('/#/sorting/bubble-sort')
  await expect(page.getByRole('heading', { name: 'Learn Bubble Sort', exact: true })).toBeVisible()
  await expect(page.locator('.right-panel')).toHaveScreenshot('bubble-learn.png')
})

test('dark theme and mobile menu remain usable with learning tabs', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.addInitScript(() => localStorage.setItem('algodrishti-theme', 'dark'))
  await page.goto('/#/sorting/bubble-sort')
  await expect(page.getByRole('heading', { name: 'Learn Bubble Sort', exact: true })).toBeVisible()
  await expect(page.locator('.mobile-drawer-shell')).toHaveAttribute('inert', '')
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  await expect(page.locator('.mobile-drawer-shell')).not.toHaveAttribute('inert')
  await page.locator('.category-list').getByRole('button', { name: 'Strings', exact: true }).click()
  await page.locator('.global-sidebar').getByRole('link', { name: 'String Pattern Matching Suite', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Learn String Pattern Matching Suite', exact: true })).toBeVisible()
  await expect(page.locator('.mobile-drawer-shell')).toHaveAttribute('inert', '')
  await page.goto('/#/graphs/dijkstra')
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Concept and worked example' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})
