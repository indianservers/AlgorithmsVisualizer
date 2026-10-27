import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const pairs = [
  {
    name: '008 / 039 Master Theorem and Metric TSP',
    prefix: 'mt',
    pages: [
      { root: '.master-page', route: '/analysis-correctness/master-theorem', category: 'Analysis & Correctness', width: 1672, height: 941 },
      { root: '.metric-tsp-page', route: '/daa-extensions/metric-tsp-approximation', category: 'DAA Extensions', width: 1586, height: 992 },
    ],
  },
  {
    name: '009 / 033 Correctness Proofs and Counting Inversions',
    prefix: 'iv',
    pages: [
      { root: '.invariant-page', route: '/analysis-correctness/correctness-proofs', category: 'Analysis & Correctness', width: 1672, height: 941 },
      { root: '.inversions-page', route: '/daa-extensions/counting-inversions', category: 'DAA Extensions', width: 1586, height: 992 },
    ],
  },
] as const

async function compareScreenshots(page: Page, before: Buffer, after: Buffer) {
  return page.evaluate(
    async ([beforePng, afterPng]) => {
      const decode = async (base64: string) => {
        const image = new Image()
        image.src = `data:image/png;base64,${base64}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')!
        context.drawImage(image, 0, 0)
        return context.getImageData(0, 0, canvas.width, canvas.height)
      }
      const [left, right] = await Promise.all([decode(beforePng), decode(afterPng)])
      if (left.width !== right.width || left.height !== right.height) throw new Error('Lesson dimensions changed after navigation.')
      let changedPixels = 0,
        pixelsOverTolerance = 0,
        maxChannelDifference = 0
      for (let i = 0; i < left.data.length; i += 4) {
        let difference = 0
        for (let channel = 0; channel < 4; channel++) difference = Math.max(difference, Math.abs(left.data[i + channel] - right.data[i + channel]))
        if (difference > 0) changedPixels++
        if (difference > 2) pixelsOverTolerance++
        maxChannelDifference = Math.max(maxChannelDifference, difference)
      }
      return { width: left.width, height: left.height, changedPixels, pixelsOverTolerance, maxChannelDifference, allowedChannelDifference: 2 }
    },
    [before.toString('base64'), after.toString('base64')],
  )
}

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
})

for (const pair of pairs)
  test(`${pair.name} keeps reference styles after SPA navigation in both directions`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'Reference-size navigation geometry is verified on desktop.')
    mkdirSync('artifacts/visual-qa/style-isolation', { recursive: true })
    const [a, b] = pair.pages
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const snapshot = async (target: typeof a | typeof b) => {
      await expect(page.locator(target.root)).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const invitationDue = await page.evaluate(() => {
        const visits = JSON.parse(sessionStorage.getItem('algodrishti-login-visits') || 'null')
        return visits && visits.count % 2 === 0 && visits.dismissed !== visits.count
      })
      if (invitationDue) {
        await page.getByRole('button', { name: 'Continue as guest', exact: true }).click()
        await expect(page.getByRole('region', { name: 'Optional login', exact: true })).toHaveCount(0)
      }
      return page
        .locator(
          `${target.root} .${pair.prefix}-panel, ${target.root} .${pair.prefix}-icon, ${target.root} .${pair.prefix}-controls, ${target.root} .${pair.prefix}-bottom-grid`,
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element)
            return {
              className: element.className,
              width: style.width,
              height: style.height,
              padding: style.padding,
              background: style.background,
              font: style.font,
              borderRadius: style.borderRadius,
              display: style.display,
              columns: style.gridTemplateColumns,
              gap: style.gap,
            }
          }),
        )
    }
    const navigate = async (target: typeof a | typeof b) => {
      await page.setViewportSize({ width: target.width, height: target.height })
      const link = page.locator(`.sidebar-algorithm[href="${target.route}"]`)
      const category = page.locator('.sidebar-category-toggle').filter({ hasText: target.category })
      if ((await category.getAttribute('aria-expanded')) !== 'true') await category.click()
      await expect(category).toHaveAttribute('aria-expanded', 'true')
      await link.click()
      await expect(page.locator(target.root)).toBeVisible()
    }
    await page.setViewportSize({ width: a.width, height: a.height })
    await page.goto(a.route)
    const beforeA = await snapshot(a)
    const beforeImageA = await page
      .locator(a.root)
      .screenshot({ path: `artifacts/visual-qa/style-isolation/${pair.prefix}-a-before.png`, animations: 'disabled' })
    expect(beforeA.length).toBeGreaterThan(0)
    await navigate(b)
    const beforeB = await snapshot(b)
    const beforeImageB = await page
      .locator(b.root)
      .screenshot({ path: `artifacts/visual-qa/style-isolation/${pair.prefix}-b-before.png`, animations: 'disabled' })
    expect(beforeB.length).toBeGreaterThan(0)
    await navigate(a)
    const afterA = await snapshot(a)
    const afterImageA = await page
      .locator(a.root)
      .screenshot({ path: `artifacts/visual-qa/style-isolation/${pair.prefix}-a-after.png`, animations: 'disabled' })
    await navigate(b)
    const afterB = await snapshot(b)
    const afterImageB = await page
      .locator(b.root)
      .screenshot({ path: `artifacts/visual-qa/style-isolation/${pair.prefix}-b-after.png`, animations: 'disabled' })
    const pixelDifference = { a: await compareScreenshots(page, beforeImageA, afterImageA), b: await compareScreenshots(page, beforeImageB, afterImageB) }
    writeFileSync(
      `artifacts/visual-qa/style-isolation/${pair.prefix}-navigation.json`,
      JSON.stringify(
        {
          routes: pair.pages,
          beforeA,
          afterA,
          beforeB,
          afterB,
          pixelDifference,
          runtimeErrors: errors,
        },
        null,
        2,
      ),
    )
    expect(afterA).toEqual(beforeA)
    expect(afterB).toEqual(beforeB)
    expect(pixelDifference.a.pixelsOverTolerance, 'First lesson remains visually stable after visiting the paired lesson.').toBe(0)
    expect(pixelDifference.b.pixelsOverTolerance, 'Second lesson remains visually stable after visiting the paired lesson.').toBe(0)
    expect(errors).toEqual([])
  })
