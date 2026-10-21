import { expect, test } from '@playwright/test'

test('divide-and-conquer has a visible dataset panel with one-step execution and validation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#/divide-and-conquer')
  await expect(page.locator('.tuv-problem-input')).toBeVisible()
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('7, -40\n3.5, 98, 2')
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(page.locator('.tuv-summary')).toContainText('98')
  await expect(page.locator('.tuv-summary')).toContainText('-40')
  await page.getByRole('textbox', { name: 'Dataset', exact: true }).fill('3, nope, 7')
  await expect(page.getByRole('button', { name: 'Run algorithm', exact: true })).toBeDisabled()
  await expect(page.locator('.tuv-problem-input')).toContainText('Use numbers')
  await page.getByRole('button', { name: 'Reset input', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Run algorithm', exact: true })).toBeEnabled()
  await expect(page.getByRole('textbox', { name: 'Dataset', exact: true })).not.toHaveValue('3, nope, 7')
})

test('matrix inputs can be entered directly without JSON or a separate Apply button', async ({ page }) => {
  await page.goto('/#/divide-and-conquer/strassen')
  await page.getByRole('textbox', { name: 'Matrix A', exact: true }).fill('1, 0\n0, 1')
  await page.getByRole('textbox', { name: 'Matrix B', exact: true }).fill('2, 3\n4, 5')
  await page.getByRole('button', { name: 'Run algorithm', exact: true }).click()
  await expect(page.locator('.tuv-error')).toHaveCount(0)
  await expect(page.locator('.tuv-problem-input')).not.toContainText('Inputs edited.')
  await expect(page.getByRole('button', { name: /Apply / })).toHaveCount(0)
})

test('Edit input is reachable from other tabs and focuses the correct editor', async ({ page }) => {
  for (const route of [
    'divide-and-conquer',
    'sorting/selection-sort',
    'graphs/bellman-ford',
    'greedy/fractional-knapsack',
    'dynamic-programming/zero-one-knapsack',
    'backtracking/n-queens',
    'data-structures/binary-search-tree-operations',
  ]) {
    await page.goto('/#/' + route)
    const edit = page.getByRole('button', { name: 'Edit input', exact: true }).first()
    await expect(edit, route).toBeVisible()
    await page.getByRole('button', { name: 'Learn', exact: true }).first().click()
    await edit.click()
    await expect(page.getByRole('button', { name: 'Visualization', exact: true }).first()).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName), { message: route }).toMatch(/TEXTAREA|INPUT|SELECT/)
  }
})

test('phone inputs start open, can be collapsed and reopened from Edit input, and fit the page', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/divide-and-conquer')
    await expect(page.getByRole('textbox', { name: 'Dataset', exact: true })).toBeVisible()
    if (width < 701) {
      const panel = page.locator('details.tuv-problem-input')
      await expect(panel).toHaveAttribute('open', '')
      await panel.locator(':scope > summary').click()
      await expect(page.getByRole('textbox', { name: 'Dataset', exact: true })).toBeHidden()
      await page.getByRole('button', { name: 'Edit input', exact: true }).click()
      await expect(page.getByRole('textbox', { name: 'Dataset', exact: true })).toBeFocused()
      await expect(panel).toHaveAttribute('open', '')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
})

test('category workspaces expose their input through the shared shortcut', async ({ page }) => {
  test.setTimeout(90000)
  for (const route of [
    'analysis-correctness',
    'divide-and-conquer',
    'branch-and-bound',
    'complexity-theory',
    'daa-extensions',
    'sorting',
    'searching',
    'data-structures',
    'graphs',
    'dynamic-programming',
    'strings',
    'number-theory',
    'backtracking',
    'greedy',
    'matrix-grid',
    'games',
  ]) {
    await page.goto('/#/' + route)
    const edit = page.getByRole('button', { name: 'Edit input', exact: true }).first()
    await expect(edit, route).toBeVisible()
    await edit.click()
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName), { message: route }).toMatch(/TEXTAREA|INPUT|SELECT/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true)
  }
})
