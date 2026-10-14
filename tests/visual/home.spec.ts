import { test, expect } from '@playwright/test'

test('root opens the home dashboard and preserves algorithm navigation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-last-algorithm', 'bubble-sort')
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-completed', '["bubble-sort"]')
  })
  await page.goto('/#/')
  await expect(page.getByRole('heading', { name: 'Big ideas. One step at a time.' })).toContainText('Big ideas.')
  await expect(page.getByText('Marked complete by you')).toBeVisible()
  await page.getByRole('textbox', { name: 'Search lessons' }).fill('bubble sort')
  await page
    .locator('.home-search-results')
    .getByRole('link', { name: /Bubble Sort/ })
    .click()
  await expect(page).toHaveURL(/sorting\/bubble-sort/)
  if (test.info().project.name === 'mobile') {
    await page.getByRole('button', { name: /Open.*menu|Open navigation/i }).click()
  }
  await page.getByRole('link', { name: 'Home dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Big ideas. One step at a time.' })).toContainText('Big ideas.')
})

test('dashboard fits narrow screens and supports dark theme', async ({ page }) => {
  await page.goto('/#/')
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  }
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.screenshot({ path: `test-results/home-${test.info().project.name}.png`, fullPage: true })
})
