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
    test(`${String(target.number).padStart(3, '0')} ${target.id}`, async ({ page }, testInfo) => {
      await page.setViewportSize(target.number >= 31 && target.number <= 40 ? { width: 1586, height: 992 } : { width: 1672, height: 941 })
      const captureReference = async () => {
        if (testInfo.project.name !== 'desktop') return
        const directory = resolve('artifacts/visual-qa/final')
        mkdirSync(directory, { recursive: true })
        const png = await page.screenshot({ path: resolve(directory, `${String(target.number).padStart(3, '0')}--${target.id}.png`), fullPage: false })
        const viewport = page.viewportSize()!
        expect(png.readUInt32BE(16)).toBe(viewport.width)
        expect(png.readUInt32BE(20)).toBe(viewport.height)
      }
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`/#/${target.category}/${target.id}`)
      const visual = page.locator(`.target-visual[data-target="${target.number}"]`)
      await expect(visual).toBeVisible()
      if (target.number === 12) {
        await expect(visual.locator('.pc-checklist input')).toHaveCount(10)
        await expect(visual.locator('.pc-binary-table tbody tr')).toHaveCount(3)
        await captureReference()
        await visual.getByRole('button', { name: 'Run', exact: true }).click()
        await expect(visual.locator('.pc-run-result')).toContainText('Output: 3')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 13) {
        await expect(visual.locator('.mm-comparison-count')).toHaveText('10')
        await expect(visual.locator('.mm-global-result')).toContainText('min(3, 2) = 2')
        await captureReference()
        await visual.getByRole('button', { name: 'Next Step', exact: true }).click()
        await expect(visual.locator('.mm-worked-stage')).toContainText('Step 2:')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 14) {
        await expect(visual.locator('.mx-candidate')).toHaveCount(3)
        await expect(visual.locator('.mx-answer')).toContainText('Maximum subarray sum: 6')
        await captureReference()
        await visual.getByRole('button', { name: 'Run Step by Step', exact: true }).click()
        await expect(visual.locator('.mx-frame-message')).toContainText('Step 1/')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 15) {
        await expect(visual.locator('.sm-products .sm-product')).toHaveCount(7)
        await expect(visual.locator('.sm-final')).toContainText('18')
        await captureReference()
        await visual.getByRole('button', { name: 'Inspect product M4', exact: true }).click()
        await expect(visual.locator('.sm-inspection')).toContainText('-10')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 16) {
        await expect(visual.locator('.qs-trace-node')).toHaveCount(4)
        await expect(visual.locator('.qs-worked-answer')).toContainText('3rd smallest element is 7')
        await captureReference()
        await visual.getByRole('button', { name: 'Run Step', exact: true }).click()
        await expect(visual.locator('.qs-partition h3')).toContainText('pivot = 3')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 17) {
        await expect(visual.locator('.mom-main-grid .mom-panel')).toHaveCount(6)
        await expect(visual.locator('.mom-worked-example')).toContainText('7th smallest is 6')
        await captureReference()
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
      await captureReference()
    })
})
