import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-reduced-motion', 'true')
    localStorage.setItem('algodrishti-input', '42, 18, 67, 9, 31, 73, 54, 26, 88, 12')
    localStorage.setItem('algodrishti-target', '31')
  })
})

test('visualizer shell matches screenshot', async ({ page }) => {
  await page.goto('/sorting/bubble-sort')
  await expect(page.getByRole('heading', { name: 'Bubble Sort' }).first()).toBeVisible()
  await expect(page).toHaveScreenshot('visualizer-shell.png', { fullPage: true })
})

test('compare page matches screenshot', async ({ page }) => {
  await page.goto('/sorting/bubble-sort')
  await page.getByRole('button', { name: 'Compare', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Compare Searching and Sorting' })).toBeVisible()
  await expect(page).toHaveScreenshot('compare-page.png', { fullPage: true })
})
