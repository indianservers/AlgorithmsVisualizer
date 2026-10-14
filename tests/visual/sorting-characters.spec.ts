import { test, expect } from '@playwright/test'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.setItem('algodrishti-input', '12,3,0,7')
    localStorage.removeItem('algodrishti-sorting-character')
    localStorage.removeItem('algodrishti-bubble-view')
  })
})

test('all sorting pages have characters and exact small counts', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 360, height: 800 })
  for (const module of allModules.filter((item) => item.category === 'Sorting')) {
    await page.goto('/#' + algorithmPath(module))
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(page.getByRole('combobox', { name: 'Sorting character' }), module.id).toBeVisible()
    await page.getByRole('combobox', { name: 'Sorting character' }).selectOption('bananas')
    await expect(page.locator('.penguin-viewport')).toHaveAttribute('aria-label', 'Bananas array visualization')
    if (!module.id.includes('suite')) await expect(page.locator('.penguin-slot[data-value="12"] .count-icon-grid span')).toHaveCount(12)
    if (!module.id.includes('suite')) {
      await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
      expect(await page.locator('.penguin-slot').evaluateAll((slots) => slots.map((slot) => Number(slot.getAttribute('data-value')))), module.id).toEqual([
        0, 3, 7, 12,
      ])
      await expect(page.locator('.penguin-slot.sorted')).toHaveCount(4)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), module.id).toBe(true)
  }
})

test('character changes preserve timeline and signed counts stay exact', async ({ page }) => {
  await page.goto('/#/sorting/bubble-sort')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const picker = page.getByRole('combobox', { name: 'Sorting character' })
  await expect(picker.locator('option')).toHaveCount(10)
  await picker.selectOption('bananas')
  await expect(page.locator('.penguin-slot[data-value="12"] .count-icon-grid span')).toHaveCount(12)
  await expect(page.locator('.penguin-slot[data-value="0"] .count-icon-grid span')).toHaveCount(0)
  await page.getByRole('button', { name: 'Step forward', exact: true }).click()
  const values = await page.locator('.penguin-slot').evaluateAll((slots) => slots.map((slot) => slot.getAttribute('data-value')))
  for (const id of ['apples', 'stars', 'rockets', 'butterflies', 'fish', 'flowers', 'gems', 'cookies', 'penguins']) {
    await picker.selectOption(id)
    expect(await page.locator('.penguin-slot').evaluateAll((slots) => slots.map((slot) => slot.getAttribute('data-value')))).toEqual(values)
  }
  await page.getByRole('button', { name: 'Jump to last step', exact: true }).click()
  expect(await page.locator('.penguin-slot').evaluateAll((slots) => slots.map((slot) => Number(slot.getAttribute('data-value'))))).toEqual([0, 3, 7, 12])
  await picker.selectOption('bananas')
  await page.getByRole('textbox', { name: 'Array (comma separated)' }).fill('-3,0,12,1000')
  await expect(page.locator('.penguin-slot[data-value="-3"] .count-icon-grid span')).toHaveCount(3)
  await expect(page.locator('.penguin-slot[data-value="1000"] .count-overflow')).toBeVisible()
  await page.screenshot({ path: `test-results/count-characters-${test.info().project.name}.png`, fullPage: true })
})

test('randomized quicksort retains the full array and supports characters', async ({ page }) => {
  await page.goto('/#/daa-extensions/randomized-quicksort')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByRole('combobox', { name: 'Sorting character' }).selectOption('bananas')
  await expect(page.locator('.penguin-slot')).toHaveCount(5)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.penguin-slot')).toHaveCount(5)
  await page.getByRole('button', { name: 'Last', exact: true }).click()
  expect(await page.locator('.penguin-slot').evaluateAll((slots) => slots.map((slot) => Number(slot.getAttribute('data-value'))))).toEqual([2, 2, 4, 7, 9])
  await expect(page.locator('.penguin-slot.sorted')).toHaveCount(5)
})
