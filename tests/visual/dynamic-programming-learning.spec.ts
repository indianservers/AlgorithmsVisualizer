import { expect, test } from '@playwright/test'
import { allModules } from '../../src/algorithms'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
})
for (const module of allModules.filter((m) => m.category === 'Dynamic Programming'))
  test(`DP page: ${module.id}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/#/dynamic-programming/${module.id}`)
    const studio = page.locator('.dp-studio')
    await expect(studio).toBeVisible()
    await expect(studio.getByRole('heading', { name: 'Theory in plain language' })).toBeVisible()
    await expect(studio.getByRole('heading', { name: 'Worked example', exact: true })).toBeVisible()
    await expect(studio.locator('.dp-table')).toBeVisible()
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await expect(studio.getByRole('button', { name: 'Run DP example', exact: true })).toBeVisible()
    await studio.getByRole('button', { name: 'Next DP step', exact: true }).click()
    await expect(studio.locator('.dp-decision h3')).toContainText('Step 2')
    await expect(studio.locator('.dp-table [data-status=active]')).not.toHaveCount(0)
    await studio.getByRole('button', { name: 'Replay DP trace' }).click()
    await expect(studio.locator('.dp-decision h3')).toContainText('Step 1')
    await expect(studio.getByLabel('DP predicted value')).toBeVisible()
    expect(errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
test('LCS accepts editable strings, checks a prediction and reconstructs a subsequence', async ({ page }) => {
  await page.goto('/#/dynamic-programming/longest-common-subsequence')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.dp-studio')
  await studio.getByLabel('DP Source / left string').fill('ABC')
  await studio.getByLabel('DP Target / right string').fill('AC')
  await studio.getByRole('button', { name: 'Run DP example', exact: true }).click()
  await expect(studio.locator('[data-cell="1:1"] button')).toBeDisabled()
  await studio.getByLabel('DP predicted value').fill('0')
  await studio.getByRole('button', { name: 'Check prediction' }).click()
  await expect(studio.getByRole('status')).toContainText('Not yet')
  await studio.getByLabel('DP predicted value').fill('1')
  await studio.getByRole('button', { name: 'Check prediction' }).click()
  await expect(studio.getByRole('status')).toContainText('Correct')
  await studio.getByRole('button', { name: 'Reveal predicted state' }).click()
  await expect(studio.locator('[data-cell="1:1"]')).toHaveAttribute('data-status', 'active')
  await expect(studio.locator('.dp-expression')).toContainText("'A' = 'A'")
  await studio.getByRole('button', { name: 'Jump to solution' }).click()
  await expect(studio.locator('.dp-solution')).toContainText('AC')
  await expect(studio.locator('.dp-solution > div > strong')).toHaveText('2')
  await expect(studio.locator('[data-status=path]')).not.toHaveCount(0)
})
test('knapsack explains each capacity decision and keeps a good trace after invalid input', async ({ page }) => {
  await page.goto('/#/dynamic-programming/zero-one-knapsack')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.dp-studio')
  await studio.getByRole('button', { name: 'Jump to solution' }).click()
  await expect(studio.locator('.dp-solution')).toContainText('Chosen items: 0, 1')
  await studio.getByLabel('DP Item profits').fill('3')
  await studio.getByRole('button', { name: 'Run DP example', exact: true }).click()
  await expect(studio.getByRole('alert')).toContainText('match profits')
  await expect(studio.locator('.dp-solution')).toContainText('7')
  await studio.getByRole('button', { name: 'Reset default' }).click()
  await expect(studio.getByRole('alert')).toHaveCount(0)
  await studio.getByRole('button', { name: 'Next DP step' }).click()
  await expect(studio.locator('.dp-expression')).toContainText('exceeds capacity 0')
})
test('prefix suite computes all three models and saves the current example', async ({ page }) => {
  await page.goto('/#/dynamic-programming/prefix-sum-difference-suite')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const studio = page.locator('.dp-studio')
  await studio.getByRole('button', { name: 'Jump to solution' }).click()
  await expect(studio.locator('.dp-solution > div > strong')).toHaveText('6')
  await page.getByLabel('DP suite concept').selectOption('difference-array')
  await studio.getByRole('button', { name: 'Jump to solution' }).click()
  await expect(studio.locator('.dp-solution')).toContainText('2, 9, 11, 13, 10')
  await page.getByLabel('DP suite concept').selectOption('prefix-sum-2d')
  await studio.getByRole('button', { name: 'Jump to solution' }).click()
  await expect(studio.locator('.dp-solution > div > strong')).toHaveText('33')
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await studio.getByRole('button', { name: 'Save DP example' }).click()
  await expect(studio.getByRole('status')).toContainText('saved')
  await page.reload()
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByLabel('DP suite concept').selectOption('prefix-sum-2d')
  await studio.getByRole('button', { name: 'Load DP example 1', exact: true }).click()
  await studio.getByRole('button', { name: 'Jump to solution' }).click()
  await expect(studio.locator('.dp-solution > div > strong')).toHaveText('33')
})
test('DP presets handle empty prefixes, unreachable coins and missing tours', async ({ page }) => {
  for (const [id, preset, expected] of [
    ['edit-distance', '2', '3'],
    ['coin-change', '1', 'No feasible solution'],
    ['held-karp-tsp', '1', 'No feasible solution'],
  ]) {
    await page.goto(`/#/dynamic-programming/${id}`)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    const studio = page.locator('.dp-studio')
    await studio.getByLabel('DP example preset').selectOption(preset)
    await studio.getByRole('button', { name: 'Jump to solution' }).click()
    await expect(studio.locator('.dp-solution > div > strong')).toHaveText(expected)
  }
})
test('captures readable DP layouts at desktop and phone sizes', async ({ page }, testInfo) => {
  for (const [id, name] of [
    ['longest-common-subsequence', 'lcs'],
    ['zero-one-knapsack', 'knapsack'],
    ['optimal-bst', 'optimal-bst'],
    ['held-karp-tsp', 'subset'],
  ]) {
    await page.goto(`/#/dynamic-programming/${id}`)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await page.locator('.dp-studio').getByRole('button', { name: 'Next DP step' }).click()
    await page.screenshot({ path: `artifacts/dp-learning/${testInfo.project.name}-${name}.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})

test('DP remains usable in dark theme at narrow phone and tablet widths', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-theme', 'dark'))
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    for (const id of ['fibonacci-memoization', 'longest-common-subsequence', 'held-karp-tsp']) {
      await page.goto(`/#/dynamic-programming/${id}`)
      await page.getByRole('button', { name: 'Visualization', exact: true }).click()
      const studio = page.locator('.dp-studio')
      await studio.getByRole('button', { name: 'Next DP step' }).click()
      await expect(studio.locator('.dp-table')).toBeVisible()
      await expect(page.locator('[data-theme=dark]')).not.toHaveCount(0)
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('.dp-table-scroll'))
          .slice(0, 12)
          .map((el) => ({ tag: el.tagName, cls: el.className, right: el.getBoundingClientRect().right })),
      }))
      expect(overflow.scroll <= overflow.width + 1, `${width}: ${id} ${JSON.stringify(overflow)}`).toBe(true)
    }
  }
  await page.locator('.dp-workbench').screenshot({ path: `artifacts/dp-learning/${testInfo.project.name}-subset-dark.png` })
})
