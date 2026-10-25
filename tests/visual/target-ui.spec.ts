import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { targetProfiles } from '../../src/daa/targetProfiles'

const category = (n: number) =>
  n <= 12 ? 'analysis-correctness' : n <= 18 ? 'divide-and-conquer' : n <= 22 ? 'branch-and-bound' : n <= 27 ? 'complexity-theory' : 'daa-extensions'
const targets = Object.entries(targetProfiles)
  .map(([id, profile]) => ({ id, ...profile, category: category(profile.number) }))
  .sort((a, b) => a.number - b.number)

test.describe('numbered target UI inventory', () => {
  for (const target of targets)
    test(`${String(target.number).padStart(3, '0')} ${target.id}`, async ({ page }) => {
      await page.setViewportSize(target.number >= 31 && target.number <= 40 ? { width: 1586, height: 992 } : { width: 1672, height: 941 })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`/#/${target.category}/${target.id}`)
      const visual = page.locator(`.target-visual[data-target="${target.number}"]`)
      await expect(visual).toBeVisible()
      if (target.number === 17) {
        await expect(visual.locator('.mom-main-grid .mom-panel')).toHaveCount(6)
        await expect(visual.locator('.mom-worked-example')).toContainText('7th smallest is 6')
        await page.screenshot({ path: resolve('artifacts/visual-qa/final/017--deterministic-selection.png'), fullPage: false })
        await visual.getByRole('button', { name: 'Visualization', exact: true }).click()
        await visual.getByRole('button', { name: 'Step forward', exact: true }).click()
        await expect(visual.locator('.mom-playback')).toContainText('Step 2')
        expect(errors).toEqual([])
        return
      }
      await expect(visual.locator('.tuv-learning-deck')).toContainText('Theory in plain language')
      await expect(visual.locator('.tuv-learning-deck')).toContainText('Worked example')
      const before = await visual.locator('.tuv-card-head span').innerText()
      await page.getByRole('button', { name: 'Step forward' }).click()
      await expect(visual.locator('.tuv-card-head span')).not.toHaveText(before)
      await page.getByRole('button', { name: 'Reset' }).click()
      expect(errors).toEqual([])
      const directory = resolve('artifacts/visual-qa/final')
      mkdirSync(directory, { recursive: true })
      await page.screenshot({ path: resolve(directory, `${String(target.number).padStart(3, '0')}--${target.id}.png`), fullPage: false })
    })
})
