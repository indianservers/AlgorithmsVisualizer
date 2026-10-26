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
  test.beforeEach(async ({ page }) => {
    // Analytics is unrelated to lesson rendering and can stall the page/font load event.
    await page.route('https://www.googletagmanager.com/**', (route) => route.abort())
  })
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
      if (target.number === 42) {
        await expect(visual.locator('.rd-copy-piece strong')).toHaveText(['2', '3', '2', '3'])
        await expect(visual.locator('.rd-final-reliability > strong')).toHaveText('0.8656')
        await captureReference()
        await visual.getByRole('button', { name: 'Inspect DP state R[4][10]', exact: true }).click()
        await expect(visual.getByRole('dialog')).toContainText('chosen copies for stage 4: 3')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 41) {
        await expect(visual.locator('.sa-array-banner .sa-pill')).toHaveText(['5', '3', '1', '0', '4', '2'])
        await expect(visual.locator('.sa-rank tbody tr')).toHaveCount(6)
        await captureReference()
        await visual.getByRole('button', { name: 'Compare suffix order 2', exact: true }).click()
        await expect(visual.locator('.sa-step-detail h3')).toHaveText('Step 2: Next suffix')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 40) {
        await expect(visual.locator('.bm-text-cell')).toHaveCount(24)
        await expect(visual.locator('.bm-state dd')).toHaveText(['11', 'I', '2', 'A', 'rightmost(I) = -1', '3', '12'])
        await captureReference()
        await visual.getByRole('button', { name: 'Reset', exact: true }).click()
        await expect(visual.locator('.bm-callout-title')).toHaveText('Compare from right to left')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 39) {
        await expect(visual.locator('.mt-city')).toHaveCount(7)
        await expect(visual.locator('.mt-mst-edge')).toHaveCount(6)
        await expect(visual.locator('.mt-tour-cost strong')).toHaveText('18.9')
        await captureReference()
        await visual.getByRole('button', { name: 'Reset', exact: true }).click()
        await expect(visual.locator('.mt-mst-edge')).toHaveCount(0)
        expect(errors).toEqual([])
        return
      }
      if (target.number === 38) {
        await expect(visual.locator('.vc-vertex')).toHaveCount(6)
        await expect(visual.locator('.vc-matching-edge')).toHaveCount(2)
        await expect(visual.locator('.vc-chosen')).toContainText('Cover size: 4')
        await captureReference()
        await visual.getByRole('button', { name: 'Reset', exact: true }).click()
        await expect(visual.locator('.vc-summary dd')).toHaveText(['6', '8', '0', '8', '0'])
        expect(errors).toEqual([])
        return
      }
      if (target.number === 37) {
        await expect(visual.locator('.rs-pivot-info dd')).toHaveText(['7', '6', '7', '6', '3'])
        await expect(visual.locator('.rs-cell')).toHaveCount(10)
        await captureReference()
        await visual.getByRole('button', { name: 'Start / Run', exact: true }).click()
        await expect(visual.locator('.rs-diagram h3')).toHaveText('Step 1: Choose random pivot 7')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 36) {
        await expect(visual.locator('.rq-pivot-tag')).toHaveText('Pivot (3)')
        await expect(visual.locator('.rq-cell')).toHaveCount(9)
        await captureReference()
        await visual.getByRole('button', { name: 'Step partition', exact: true }).click()
        await expect(visual.locator('.rq-group-0 .rq-group-values button')).toHaveText(['1', '2'])
        expect(errors).toEqual([])
        return
      }
      if (target.number === 35) {
        await expect(visual.locator('.kt-result')).toContainText('1234 × 5678 = 7006652')
        await expect(visual.locator('.kt-product')).toHaveCount(3)
        await captureReference()
        await visual.getByRole('button', { name: 'Step split', exact: true }).click()
        await expect(visual.locator('.kt-product strong')).toHaveText(['Pending', 'Pending', 'Pending'])
        expect(errors).toEqual([])
        return
      }
      if (target.number === 34) {
        await expect(visual.locator('.cp-point')).toHaveCount(20)
        await expect(visual.locator('.cp-nearest')).toContainText('5.83')
        await captureReference()
        await visual.getByLabel('Closest-pair example', { exact: true }).selectOption('duplicates')
        await expect(visual.locator('.cp-nearest')).toContainText('0.00')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 33) {
        await expect(visual.locator('.iv-count')).toHaveText('3')
        await expect(visual.locator('.iv-ledger tbody tr')).toHaveCount(3)
        await captureReference()
        await visual.getByRole('button', { name: 'Step merge', exact: true }).click()
        await expect(visual.locator('.iv-comparison')).toHaveText('3 ≤ 4')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 32) {
        await expect(visual.locator('.eu-vertex')).toHaveCount(4)
        await expect(visual.locator('.eu-edge')).toHaveCount(4)
        await expect(visual.locator('.eu-active-edge')).toHaveAttribute('data-euler-edge', '1')
        await captureReference()
        await visual.getByLabel('Eulerian graph example', { exact: true }).selectOption('open')
        await expect(visual.locator('.eu-degree-status')).toContainText('Open Eulerian trail exists')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 31) {
        await expect(visual.locator('.ap-vertex')).toHaveCount(7)
        await expect(visual.locator('.ap-cut-vertex')).toHaveAttribute('aria-label', 'Inspect articulation vertex 3')
        await captureReference()
        await visual.getByLabel('Articulation graph example', { exact: true }).selectOption('cycle')
        await expect(visual.locator('.ap-cut-vertex')).toHaveCount(0)
        expect(errors).toEqual([])
        return
      }
      if (target.number === 30) {
        await expect(visual.locator('.br-vertex')).toHaveCount(6)
        await expect(visual.locator('.br-bridge-edge')).toHaveAttribute('data-bridge-edge', '3')
        await expect(visual.locator('.br-values-table tbody tr')).toHaveCount(6)
        await captureReference()
        await visual.getByLabel('Bridge graph example', { exact: true }).selectOption('parallel')
        await expect(visual.locator('.br-bridge-edge')).toHaveAttribute('data-bridge-edge', '2')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 29) {
        await expect(visual.locator('.bp-before-diagram .bp-vertex')).toHaveCount(6)
        await expect(visual.locator('.bp-before-diagram .bp-matched-edge')).toHaveCount(2)
        await expect(visual.locator('.bp-after-diagram .bp-matched-edge')).toHaveCount(3)
        await captureReference()
        await visual.getByLabel('Bipartite graph example', { exact: true }).selectOption('reroute')
        await expect(visual.locator('.bp-before-diagram .bp-path-edge')).toHaveCount(3)
        expect(errors).toEqual([])
        return
      }
      if (target.number === 28) {
        await expect(visual.locator('.ef-flow-svg .ef-graph-vertex')).toHaveCount(6)
        await expect(visual.locator('.ef-flow-svg [data-flow-edge]')).toHaveCount(8)
        await expect(visual.locator('.ef-cut-grid output')).toHaveText('11')
        await captureReference()
        await visual.getByRole('button', { name: 'Next augmentation', exact: true }).click()
        await expect(visual.locator('.ef-path-card output')).toHaveText('5')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 27) {
        await expect(visual.locator('.cl-tableau tbody tr')).toHaveCount(6)
        await expect(visual.locator('.cl-constraint-card')).toHaveCount(4)
        await expect(visual.getByRole('status')).toContainText('SATISFIABLE')
        await captureReference()
        await visual.getByLabel('Cook-Levin example', { exact: true }).selectOption('short')
        await expect(visual.getByRole('status')).toContainText('T is too short')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 26) {
        await expect(visual.locator('.cv-graph-source [data-graph-edge]')).toHaveCount(11)
        await expect(visual.locator('.cv-graph-target [data-graph-edge]')).toHaveCount(4)
        await captureReference()
        await visual.getByRole('button', { name: 'Select clique vertex 3', exact: true }).click()
        await expect(visual.locator('.cv-validation')).toContainText('This does not prove the instance is NO')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 25) {
        await expect(visual.locator('.st-vertex')).toHaveCount(9)
        await expect(visual.locator('[data-graph-edge]')).toHaveCount(23)
        await captureReference()
        await visual.getByLabel('Show contradictory edges', { exact: true }).check()
        await expect(visual.locator('.st-forbidden-link')).toHaveCount(4)
        expect(errors).toEqual([])
        return
      }
      if (target.number === 24) {
        await expect(visual.locator('.rd-graph-source [role="button"]')).toHaveCount(6)
        await expect(visual.locator('.rd-certificate-status')).toContainText('Certificate is valid')
        await captureReference()
        await visual.getByRole('button', { name: 'Toggle source certificate vertex 3', exact: true }).click()
        await expect(visual.locator('.rd-certificate-status')).toContainText('Certificate rejected')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 23) {
        await expect(visual.locator('.cx-class-map [role="button"]')).toHaveCount(4)
        await expect(visual.getByRole('radio')).toHaveCount(6)
        await captureReference()
        await visual.getByRole('radio', { name: 'Graph Connectivity', exact: true }).click()
        await expect(visual.locator('.cx-details>header .cx-badge')).toHaveText('P')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 22) {
        await expect(visual.locator('.bm-tree-svg [role="button"]')).toHaveCount(7)
        await expect(visual.locator('.bm-rule-card')).toHaveCount(2)
        await captureReference()
        await visual.getByLabel('Branch and bound problem type', { exact: true }).selectOption('min')
        await expect(visual.locator('.bm-tree-svg')).toContainText('LB = 60')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 21) {
        await expect(visual.locator('.tp-city-graph [role="button"]')).toHaveCount(5)
        await expect(visual.locator('.tp-best-cost output')).toHaveText('40')
        await captureReference()
        await visual.getByLabel('Show edge weights', { exact: true }).uncheck()
        await expect(visual.locator('.tp-city-graph rect')).toHaveCount(0)
        expect(errors).toEqual([])
        return
      }
      if (target.number === 20) {
        await expect(visual.locator('.bk-stage')).toHaveCount(4)
        await expect(visual.locator('.bk-solution-stats output')).toHaveText('11')
        await captureReference()
        await visual.getByLabel('Show tree bounds', { exact: true }).uncheck()
        await expect(visual.locator('.bk-tree')).not.toContainText('b=')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 19) {
        await expect(visual.locator('.fk-tree [role="button"]')).toHaveCount(7)
        await expect(visual.locator('.fk-incumbent output')).toHaveText('7')
        await captureReference()
        await visual.getByRole('button', { name: 'Step Forward', exact: true }).click()
        await expect(visual.locator('.fk-count b')).toHaveText('2')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 18) {
        await expect(visual.locator('.dm-stage')).toHaveCount(3)
        await expect(visual.locator('.dm-example')).toHaveCount(4)
        await captureReference()
        await visual.getByLabel('Divide and combine cost', { exact: true }).selectOption('square')
        await expect(visual.locator('.dm-recurrence-result output')).toContainText('Θ(n2)')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 3) {
        await expect(visual.locator('.an-function-legend input')).toHaveCount(6)
        await expect(visual.locator('.an-definitions>button')).toHaveCount(5)
        await captureReference()
        await visual.getByRole('button', { name: 'Linear', exact: true }).click()
        await expect(visual.locator('.an-plot')).toHaveAttribute('aria-label', 'Linear asymptotic growth chart')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 4) {
        await expect(visual.locator('.cs-case-card')).toHaveCount(3)
        await expect(visual.locator('.cs-bit-length')).toHaveText('11 bits')
        await captureReference()
        await visual.getByLabel('Integer value', { exact: true }).fill('1023')
        await expect(visual.locator('.cs-bit-length')).toHaveText('10 bits')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 5) {
        await expect(visual.locator('.lr-heat-grid button')).toHaveCount(36)
        await expect(visual.locator('.lr-stack-table ol>li')).toHaveCount(5)
        await captureReference()
        await visual.getByLabel('Loop size n', { exact: true }).fill('3')
        await expect(visual.locator('.lr-loop-result output')).toHaveText('n × n = 9')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 6) {
        await expect(visual.locator('.sb-proof-steps>li')).toHaveCount(5)
        await expect(visual.locator('.sb-conclusion')).toContainText('O(n log n)')
        await captureReference()
        await visual.getByLabel('Your guess for T(n):', { exact: true }).selectOption('linear')
        await expect(visual.locator('.sb-conclusion')).toContainText('not certified')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 7) {
        await expect(visual.locator('.rt-diagram .rt-node')).toHaveCount(13)
        await expect(visual.locator('.rt-overall')).toHaveAttribute('data-bound', 'Θ(n^2)')
        await captureReference()
        await visual.getByLabel('Branch factor a', { exact: true }).fill('2')
        await expect(visual.locator('.rt-overall')).toContainText('Θ(n log n)')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 8) {
        await expect(visual.locator('.mt-classification h3')).toHaveText('Identified case: Case 2')
        await expect(visual.locator('.mt-result')).toContainText('Θ(n log n)')
        await captureReference()
        await visual.getByRole('button', { name: 'Use combine work n²', exact: true }).click()
        await expect(visual.locator('.mt-classification h3')).toContainText('Case 3')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 9) {
        await expect(visual.locator('.iv-induction-card')).toHaveCount(3)
        await expect(visual.locator('.iv-array .midpoint')).toHaveText('37')
        await captureReference()
        await visual.getByRole('button', { name: 'Next binary search step', exact: true }).click()
        await expect(visual.locator('.iv-search-explanation')).toContainText('Found target 37 at index 8')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 10) {
        await expect(visual.locator('.ge-selected-summary')).toContainText('{A1, A4, A6}')
        await expect(visual.locator('.ge-knapsack-result output')).toHaveText('240')
        await captureReference()
        await visual.getByRole('button', { name: 'Earliest Start', exact: true }).click()
        await expect(visual.locator('.ge-comparison-count')).toHaveText('2')
        expect(errors).toEqual([])
        return
      }
      if (target.number === 11) {
        await expect(visual.locator('.am-total')).toHaveText('12')
        await expect(visual.locator('.am-phi')).toHaveText('Φ = 2')
        await captureReference()
        await visual.getByRole('button', { name: 'Push (Append)', exact: true }).click()
        await expect(visual.locator('.am-total')).toHaveText('13')
        expect(errors).toEqual([])
        return
      }
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
