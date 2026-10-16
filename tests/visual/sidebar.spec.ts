import { expect, test } from '@playwright/test'
import { sidebarNavigation } from '../../src/data/sidebarNavigation'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
})

test('all routes share the sidebar and highlight their canonical entry', async ({ page }) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.global-sidebar a[aria-current=page]')).toHaveText('Home dashboard')
  await expect(page.locator('.sidebar-category-toggle')).toHaveCount(17)
  for (const module of allModules) {
    await page.goto('/#' + algorithmPath(module))
    const current = page.locator('.global-sidebar .sidebar-algorithm[aria-current=page]')
    await expect(current, module.id).toHaveCount(1)
    await expect(current, module.id).toHaveAttribute(
      'href',
      '#' + sidebarNavigation.flatMap((group) => group.items).find((item) => item.aliases.includes(module.id))!.path,
    )
    await expect(page.locator('.sidebar-category-toggle[aria-expanded=true]'), module.id).toHaveText(module.category)
  }
  expect(errors).toEqual([])
})

test('long accordions stay inside the viewport and preserve main-page position', async ({ page }) => {
  await page.goto('/#/graphs/dijkstra')
  for (const height of [600, 720, 768, 900, 1080]) {
    await page.setViewportSize({ width: 1440, height })
    await page.waitForTimeout(250)
    const before = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, y: scrollY }))
    for (const category of ['Data Structures', 'DAA Extensions', 'Graphs']) {
      await page.locator('.sidebar-category-toggle').getByText(category, { exact: true }).click()
      await page.waitForTimeout(230)
      const bounds = await page.locator('.global-sidebar').boundingBox()
      expect(bounds!.y).toBe(0)
      expect(bounds!.height).toBe(height)
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before.height)
      expect(await page.evaluate(() => scrollY)).toBe(before.y)
      expect(await page.locator('.sidebar-category-toggle[aria-expanded=true]').count()).toBeLessThanOrEqual(1)
    }
  }
  await page.locator('.sidebar-navigation').evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(page.locator('.sidebar-category-toggle').getByText('Games', { exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('route history, refresh, traversal aliases and keyboard navigation work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/graphs/daa-bfs')
  await expect(page.locator('.sidebar-algorithm[aria-current=page]')).toHaveText('Breadth-First Search')
  await expect(page.locator('.sidebar-algorithm').filter({ hasText: /^Breadth-First Search$/ })).toHaveCount(1)
  const dijkstra = page.locator('.global-sidebar').getByRole('link', { name: 'Dijkstra', exact: true })
  await dijkstra.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/graphs\/dijkstra$/)
  await page.goBack()
  await expect(page.locator('.sidebar-algorithm[aria-current=page]')).toHaveText('Breadth-First Search')
  await page.goForward()
  await page.reload()
  await expect(page.locator('.sidebar-algorithm[aria-current=page]')).toHaveText('Dijkstra')
  await expect(page.locator('.sidebar-category-toggle[aria-expanded=true]')).toHaveText('Graphs')
  await page.locator('.sidebar-category-toggle').getByText('Data Structures', { exact: true }).click()
  await page.locator('.global-sidebar').getByRole('link', { name: 'Stack', exact: true }).click()
  await expect(page.locator('.sidebar-algorithm[aria-current=page]')).toHaveText('Stack')
  await page.goBack()
  await expect(page.locator('.sidebar-category-toggle[aria-expanded=true]')).toHaveText('Graphs')
})

test('mobile drawer contains focus, closes on navigation, Escape and backdrop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const open = page.getByRole('button', { name: 'Open menu', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Algorithm navigation menu' })
  await expect(dialog).toBeVisible()
  await expect(page.locator('.mobile-drawer-close')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Games', exact: true })).toBeFocused()
  await dialog.getByRole('button', { name: 'Graphs', exact: true }).click()
  await dialog.getByRole('link', { name: 'Dijkstra', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dijkstra', exact: true })).toBeVisible()
  await expect(page.locator('.mobile-drawer-shell')).toHaveAttribute('aria-hidden', 'true')
  await open.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(open).toBeFocused()
  await open.click()
  await expect(dialog).toBeVisible()
  await page.locator('.mobile-menu-backdrop').click({ position: { x: 370, y: 300 } })
  await expect(page.locator('.mobile-drawer-shell')).toHaveAttribute('aria-hidden', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
