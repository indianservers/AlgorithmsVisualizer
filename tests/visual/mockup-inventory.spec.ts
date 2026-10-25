import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { targetProfiles } from '../../src/daa/targetProfiles'
import { allModules } from '../../src/algorithms'
import { algorithmPath } from '../../src/utils/routing'

// Captures current authoritative renders. These are NOT screenshot baselines or fidelity passes.
// Every target still requires explicit expected-versus-delivered inspection and interaction checks.
test.describe('full mockup inventory evidence', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
  })
  for (const [id, profile] of Object.entries(targetProfiles))
    test(`reference ${String(profile.number).padStart(3, '0')} ${id}`, async ({ page }) => {
      test.skip(test.info().project.name !== 'desktop', 'Reference-size evidence is captured once per target.')
      const module = allModules.find((m) => m.id === id)!
      expect(module, `Missing route for target ${profile.number}`).toBeTruthy()
      await page.setViewportSize(profile.number >= 31 && profile.number <= 40 ? { width: 1586, height: 992 } : { width: 1672, height: 941 })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(algorithmPath(module))
      await expect(page.getByRole('heading', { name: module.name, exact: true, level: 1 })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const directory = resolve('artifacts/visual-qa/current-inventory')
      mkdirSync(directory, { recursive: true })
      const stem = `${String(profile.number).padStart(3, '0')}--${id}`
      await page.screenshot({ path: resolve(directory, stem + '.png'), fullPage: false })
      const metadata = await page.evaluate(() => ({
        title: document.querySelector('h1')?.textContent,
        viewport: { width: innerWidth, height: innerHeight },
        scrollWidth: document.documentElement.scrollWidth,
        headings: [...document.querySelectorAll('h2,h3')].map((e) => e.textContent),
        buttons: [...document.querySelectorAll('button')]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => ({ label: e.getAttribute('aria-label') ?? e.textContent, pressed: e.getAttribute('aria-pressed') })),
      }))
      writeFileSync(
        resolve(directory, stem + '.json'),
        JSON.stringify({ reference: profile.number, id, route: algorithmPath(module), fidelity: 'not verified', runtimeErrors: errors, ...metadata }, null, 2),
      )
      expect(errors).toEqual([])
    })
})
