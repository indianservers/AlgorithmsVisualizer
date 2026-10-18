import { expect, test } from '@playwright/test'
import { allModules } from '../../src/algorithms'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('algodrishti-onboarded', 'true'))
})
for (const module of allModules.filter((m) => m.category === 'Greedy' || m.id === 'greedy-exchange'))
  test(`greedy page: ${module.id}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    const category = module.id === 'greedy-exchange' ? 'analysis-and-correctness' : 'greedy'
    await page.goto(`/#/${category}/${module.id}`)
    const studio = page.locator('.greedy-studio')
    await expect(studio.getByRole('heading', { name: 'Theory in plain language' })).toBeVisible()
    await expect(studio.getByRole('heading', { name: 'Worked example', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    await studio.getByRole('button', { name: 'Next greedy step' }).click()
    await expect(studio.locator('.gr-decision h3')).toContainText('Step 2')
    await studio.getByRole('button', { name: 'Replay greedy trace' }).click()
    await expect(studio.locator('.gr-decision h3')).toContainText('Step 1')
    await expect(studio.getByLabel('Greedy prediction', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Code', exact: true }).click()
    await expect(studio.locator('.gr-code pre')).toContainText('export function')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await studio.getByRole('button', { name: 'Reveal reasoning', exact: true }).click()
    await expect(studio.locator('.gr-proof')).toContainText('Proof checklist')
    expect(errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })

test('activity inputs, predictions, inspection, playback and invalid edits', async ({ page }) => {
  await page.goto('/#/greedy/activity-selection')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const s = page.locator('.greedy-studio')
  await s.getByLabel('Greedy Activities: start, finish (one per line)').fill('0, 2\n2, 4\n1, 3')
  await s.getByRole('button', { name: 'Run greedy example', exact: true }).click()
  await s.getByLabel('Greedy prediction', { exact: true }).fill('reject')
  await s.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(s.getByRole('status')).toContainText('Not yet')
  await s.getByLabel('Greedy prediction', { exact: true }).fill('accept')
  await s.getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(s.getByRole('status')).toContainText('Correct')
  await s.getByRole('button', { name: 'Reveal next decision', exact: true }).click()
  await s.getByRole('button', { name: 'Inspect activity 0', exact: true }).click()
  await expect(s.locator('.ls-inspector')).toContainText('Accepted')
  await s.getByRole('button', { name: 'Jump to solution', exact: true }).click()
  await expect(s.locator('.gr-final')).toContainText('Maximum compatible count: 2')
  await s.getByLabel('Greedy Activities: start, finish (one per line)').fill('2, 1')
  await s.getByRole('button', { name: 'Run greedy example', exact: true }).click()
  await expect(s.getByRole('alert')).toContainText('start < finish')
  await expect(s.locator('.gr-final')).toContainText('Maximum compatible count: 2')
  await s.getByRole('button', { name: 'Reset default', exact: true }).click()
  await s.getByLabel('Greedy playback speed').selectOption('350')
  await s.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(s.locator('.gr-decision h3')).not.toContainText('Step 1 of')
  await s.getByRole('button', { name: 'Pause', exact: true }).click()
  await s.getByRole('button', { name: 'Replay greedy trace' }).click()
  await s.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(s.getByRole('heading', { name: 'Final solution', exact: true })).toBeVisible()
  await s.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(s.locator('.gr-decision h3')).toContainText('Step 1 of')
  await s.getByRole('button', { name: 'Pause', exact: true }).click()
})

test('fractional final fill, job rejection and single-symbol code are truthful', async ({ page }) => {
  for (const [id, preset, expected] of [
    ['fractional-knapsack', '0', '240'],
    ['fractional-knapsack', '1', '0'],
    ['job-sequencing', '1', '0'],
    ['huffman-coding', '1', '7'],
  ]) {
    await page.goto(`/#/greedy/${id}`)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    const s = page.locator('.greedy-studio')
    await s.getByLabel('Greedy example preset').selectOption(preset)
    await s.getByRole('button', { name: 'Jump to solution', exact: true }).click()
    await expect(s.locator('.gr-result strong')).toHaveText(expected)
    if (id === 'huffman-coding') await expect(s.locator('tbody')).toContainText('S0')
    if (id === 'fractional-knapsack' && preset === '0') await expect(s.locator('.gr-item-grid')).toContainText('66.6667% taken')
    if (id === 'job-sequencing') await expect(s.locator('.gr-final')).toContainText('no feasible slots')
  }
})

test('suite switches concepts, saves inputs across reload and exports real traces', async ({ page }) => {
  await page.goto('/#/greedy/greedy-suite')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  await page.getByLabel('Greedy suite concept').selectOption('huffman-coding')
  const s = page.locator('.greedy-studio')
  await s.getByLabel('Greedy Symbol frequencies').fill('2, 3, 4')
  await s.getByRole('button', { name: 'Run greedy example', exact: true }).click()
  await s.getByRole('button', { name: 'Save greedy example', exact: true }).click()
  await expect(s.getByRole('status')).toContainText('saved')
  await page.reload()
  await page.getByRole('button', { name: 'Experiments', exact: true }).click()
  await page.getByLabel('Greedy suite concept').selectOption('huffman-coding')
  await s.getByRole('button', { name: 'Load greedy example 1', exact: true }).click()
  await expect(s.getByLabel('Greedy Symbol frequencies')).toHaveValue('2, 3, 4')
  const download = page.waitForEvent('download')
  await s.getByRole('button', { name: 'Export greedy trace', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('huffman-coding-trace.json')
  await s.getByRole('button', { name: 'Jump to solution', exact: true }).click()
  await expect(s.locator('.gr-result strong')).toHaveText('14')
})

test('readable greedy layouts and dark narrow-width regression', async ({ page }, testInfo) => {
  for (const id of ['activity-selection', 'fractional-knapsack', 'job-sequencing', 'huffman-coding']) {
    await page.goto(`/#/greedy/${id}`)
    await page.getByRole('button', { name: 'Visualization', exact: true }).click()
    const s = page.locator('.greedy-studio')
    await s.getByRole('button', { name: 'Jump to solution', exact: true }).click()
    await page.screenshot({ path: `artifacts/greedy-learning/${testInfo.project.name}-${id}.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.addInitScript(() => localStorage.setItem('algodrishti-theme', 'dark'))
  await page.reload()
  for (const width of [320, 393, 768]) {
    await page.setViewportSize({ width, height: 900 })
    for (const id of ['activity-selection', 'fractional-knapsack', 'job-sequencing', 'huffman-coding']) {
      await page.goto(`/#/greedy/${id}`)
      await page.getByRole('button', { name: 'Visualization', exact: true }).click()
      await page.locator('.greedy-studio').getByRole('button', { name: 'Jump to solution', exact: true }).click()
      await expect(page.locator('[data-theme=dark]')).not.toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id} at ${width}px`).toBe(true)
    }
  }
  await page.locator('.gr-workbench').screenshot({ path: `artifacts/greedy-learning/${testInfo.project.name}-huffman-dark.png` })
})

test('large inputs remain readable and malformed Huffman edits preserve a valid codebook', async ({ page }) => {
  await page.goto('/#/greedy/huffman-coding')
  await page.getByRole('button', { name: 'Visualization', exact: true }).click()
  const s = page.locator('.greedy-studio'),
    frequencies = [1, 1]
  while (frequencies.length < 20) frequencies.push(frequencies.at(-1)! + frequencies.at(-2)!)
  await s.getByLabel('Greedy Symbol frequencies').fill(frequencies.join(', '))
  await s.getByRole('button', { name: 'Run greedy example', exact: true }).click()
  await s.getByRole('button', { name: 'Jump to solution', exact: true }).click()
  await expect(s.locator('tbody tr')).toHaveCount(20)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const svg = s.locator('.gr-tree svg')
  expect(await svg.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(1000)
  await s.getByLabel('Greedy Symbol frequencies').fill('0, 1')
  await s.getByRole('button', { name: 'Run greedy example', exact: true }).click()
  await expect(s.getByRole('alert')).toContainText('positive')
  await expect(s.locator('tbody tr')).toHaveCount(20)
})
