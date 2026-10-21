import { expect, test } from '@playwright/test'

test('algorithm pages open Visualization and fit narrow phones', async ({ page }) => {
  test.setTimeout(120000)
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      'sorting/bubble-sort',
      'searching/binary-search',
      'data-structures/stack',
      'graphs/bellman-ford',
      'graphs/bfs-traversal',
      'games/chess-minimax',
      'divide-and-conquer/strassen',
    ]) {
      await page.goto('/#/' + route)
      await expect(page.getByRole('button', { name: 'Visualization', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByText('Offline ready', { exact: true })).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} at ${width}`).toBe(true)
      const run = page.locator('.workbench-play').first()
      if (await run.count()) {
        await expect(run).toContainText(/Run|Play/)
        const box = await run.boundingBox()
        expect(box!.width).toBeGreaterThanOrEqual(110)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }
      if (width < 700) {
        const input = page.locator('details.workbench-input, details.daa-input-card').first()
        if (await input.count()) {
          await expect(input).toHaveAttribute('open', '')
          await input.locator(':scope > summary').click()
          await input.locator(':scope > summary').click()
          await expect(input).toHaveAttribute('open', '')
        }
      }
    }
  }
})

test('navigating to a different algorithm resets the selected tab', async ({ page }) => {
  await page.goto('/#/sorting/bubble-sort')
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.goto('/#/searching/binary-search')
  await expect(page.getByRole('button', { name: 'Visualization', exact: true })).toHaveAttribute('aria-pressed', 'true')
})
