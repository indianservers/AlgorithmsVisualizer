import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.setItem('algodrishti-input', '2,4,6,8,10')
  })
})

test('every searching page has a detective and readable values and indices', async ({ page }) => {
  test.setTimeout(120000)
  for (const module of allModules.filter((entry) => entry.category === 'Searching')) {
    await page.goto('/#' + algorithmPath(module))
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Detective penguin search visualization' }), module.id).toBeVisible()
    await expect(page.locator('.detective-agent')).toBeVisible()
    const cells = page.locator('.detective-cell')
    expect(await cells.count()).toBeGreaterThan(0)
    for (const cell of await cells.all()) {
      await expect(cell.locator('.detective-number')).toHaveText((await cell.getAttribute('data-value')) ?? '')
      await expect(cell.locator('.detective-index')).toHaveText('index ' + (await cell.getAttribute('data-index')))
    }
    await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
    await expect(page.locator('.detective-verdict')).toContainText(/Found|Position|Peak|No match|Exploration/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), module.id).toBe(true)
  }
})

test('binary search spotlight follows midpoint and range without hiding labels', async ({ page }) => {
  await page.goto('/#/searching/binary-search')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await expect(page.locator('.detective-cell.examining')).toHaveAttribute('data-index', '2')
  await page.getByText('Display options', { exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Show values', exact: true })).toBeDisabled()
  await expect(page.getByRole('checkbox', { name: 'Show indices', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Step forward', exact: true }).click()
  await expect(page.locator('.detective-cell.eliminated').first()).toBeVisible()
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  await expect(page.locator('.detective-verdict')).toContainText(/Found|No match/)
})

test('detective celebrates matches and distinguishes missing and insertion outcomes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-target', '8')
    localStorage.setItem('algodrishti-reduced-motion', 'false')
  })
  await page.goto('/#/searching/binary-search')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  await expect(page.locator('.detective-cell.result')).toHaveAttribute('data-index', '3')
  await expect(page.locator('.detective-verdict')).toContainText('Found at index 3')
  await expect(page.locator('.detective-character')).toHaveClass(/celebrating/)
  await page.locator('.detective-search').screenshot({ path: `test-results/detective-${test.info().project.name}.png`, animations: 'disabled' })
  await page.goto('/#/searching/search-insert-position')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Target', exact: true }).fill('99')
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  await expect(page.locator('.detective-end-position')).toContainText('index 5')
  await page.goto('/#/searching/sentinel-linear-search')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  await expect(page.locator('.detective-verdict')).toContainText('No match found')
  await expect(page.locator('.detective-cell.result')).toHaveCount(0)
})
