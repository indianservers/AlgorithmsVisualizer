import { test, expect, type Page } from '@playwright/test'
const root = (page: Page) => page.locator('.clique-cover-page')
test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.route('https://www.googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(() => {
    localStorage.setItem('algodrishti-onboarded', 'true')
    localStorage.setItem('algodrishti-login-invitation-dismissed', 'true')
  })
  await page.goto('/complexity-theory/clique-vertex-cover-reduction')
  await expect(root(page)).toBeVisible()
})
test('026 includes all reference components, precise panel positions and the actual complement', async ({ page }, info) => {
  await page.screenshot({ path: `artifacts/visual-qa/clique-cover-026/${info.project.name}-visualization.png` })
  for (const heading of [
    'Interactive Visualization',
    'Graph G (original)',
    'Reduction: Take Complement',
    'Graph H (complement)',
    'Build and Explore',
    'Size Mapping',
    'Reduction Steps',
    'Key Takeaways',
    'Worked Example',
    'Correctness & Complexity',
    'Common Pitfalls',
  ])
    await expect(root(page).getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(root(page).locator('.cv-graph-source [data-graph-edge]')).toHaveCount(11)
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(4)
  await expect(root(page).locator('.cv-clique-edge')).toHaveCount(3)
  await expect(root(page).locator('.cv-graph-target .cv-vertex[aria-pressed=true]')).toHaveCount(3)
  await expect(root(page).locator('.cv-step-track button')).toHaveCount(6)
  await expect(root(page).locator('.cv-validation')).toContainText('both certificates verify')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  if (info.project.name === 'desktop') {
    const centers = await root(page)
      .locator('.cv-graph-source .cv-vertex')
      .evaluateAll((vertices) =>
        vertices.map((vertex) => {
          const box = vertex.querySelector('circle:last-of-type')!.getBoundingClientRect()
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
        }),
      )
    for (const [i, [x, y]] of [
      [495, 364],
      [399, 432],
      [595, 432],
      [375, 525],
      [501, 545],
      [631, 510],
    ].entries()) {
      expect(Math.abs(centers[i].x - x)).toBeLessThanOrEqual(2)
      expect(Math.abs(centers[i].y - y)).toBeLessThanOrEqual(2)
    }
  }
  if (info.project.name === 'desktop')
    for (const [selector, expected] of [
      ['.cv-lesson-header', { x: 278, y: 55, width: 1394, height: 81 }],
      ['.mom-tabs', { x: 280, y: 136, width: 1378, height: 55 }],
      ['.cv-original-card', { x: 298, y: 279, width: 411, height: 367 }],
      ['.cv-complement-card', { x: 968, y: 279, width: 358, height: 367 }],
      ['.cv-controls', { x: 1340, y: 279, width: 304, height: 267 }],
      ['.cv-size-map', { x: 1340, y: 556, height: 98 }],
      ['.cv-reduction-steps', { x: 292, y: 665, width: 1352, height: 133 }],
      ['.cv-footer-grid', { x: 292, y: 809, width: 1352, height: 130 }],
    ] as const) {
      const box = await root(page).locator(selector).boundingBox()
      for (const [key, value] of Object.entries(expected)) expect(Math.abs(box![key as keyof typeof box] - value), `${selector} ${key}`).toBeLessThanOrEqual(2)
    }
  await page.screenshot({ path: `artifacts/visual-qa/clique-cover-026/${info.project.name}-visualization.png` })
})
test('026 selected vertices map to V minus S and rejected cliques expose uncovered edges', async ({ page }) => {
  await root(page).getByRole('button', { name: 'Select clique vertex 3', exact: true }).click()
  await expect(root(page).locator('.cv-validation')).toBeVisible()
  await expect(root(page).locator('.cv-validation')).toContainText('does not prove the instance is NO')
  await expect(root(page).locator('.cv-graph-target .cv-vertex[aria-pressed=true]')).toHaveCount(4)
  await root(page).getByRole('button', { name: 'Select clique vertex 6', exact: true }).click()
  await expect(root(page).locator('.cv-validation')).toContainText('2 uncovered edges')
  await expect(root(page).locator('.cv-uncovered-edge')).toHaveCount(2)
  await expect(root(page).locator('.cv-size-map')).toContainText('Candidate cover in H')
  await root(page).getByRole('button', { name: 'Reset', exact: true }).click()
  await root(page).getByRole('button', { name: 'Toggle clique vertex 3 in graph', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(root(page).locator('.cv-validation')).toContainText('Only 2 vertices selected')
})
test('026 pair inspectors edit G and H together and complement vertices explain membership', async ({ page }) => {
  await root(page).getByRole('button', { name: 'Inspect original edge 1, 2', exact: true }).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Edge in G: present. Edge in H: absent.')
  await dialog.getByRole('button', { name: 'Toggle this edge in G', exact: true }).click()
  await expect(dialog).toContainText('Edge in G: absent. Edge in H: present.')
  await dialog.getByRole('button', { name: 'Close clique cover dialog', exact: true }).click()
  await expect(root(page).locator('.cv-graph-source [data-graph-edge]')).toHaveCount(10)
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(5)
  await expect(root(page).locator('.cv-uncovered-edge')).toHaveCount(1)
  await root(page).getByRole('button', { name: 'Inspect complement edge 1, 2', exact: true }).focus()
  await page.keyboard.press('Enter')
  await dialog.getByRole('button', { name: 'Toggle this edge in G', exact: true }).click()
  await dialog.getByRole('button', { name: 'Close clique cover dialog', exact: true }).click()
  await expect(root(page).locator('.cv-validation')).toContainText('both certificates verify')
  await root(page).getByRole('button', { name: 'Inspect complement vertex 4', exact: true }).click()
  await expect(dialog).toContainText('the mapped cover C = V ∖ S')
  await expect(dialog).toContainText('Neighbors in H: {1, 6}')
})
test('026 worked triangle and editable zero thresholds handle empty covers and edgeless inputs', async ({ page }) => {
  await root(page).getByRole('button', { name: 'Try It', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('mapped cover has 0 vertices')
  await page.getByRole('button', { name: 'Close clique cover dialog', exact: true }).click()
  await expect(root(page).locator('.cv-graph-source .cv-vertex')).toHaveCount(3)
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(0)
  await expect(root(page).locator('.cv-green-badge')).toHaveText('n − k = 0')
  await root(page).getByLabel('Clique to cover example', { exact: true }).selectOption('custom')
  const d = page.getByRole('dialog')
  await expect(d.getByLabel('Reduction graph edges', { exact: true })).toBeFocused()
  await d.getByLabel('Reduction graph vertex count', { exact: true }).fill('4')
  await d.getByLabel('Reduction clique threshold', { exact: true }).fill('0')
  await d.getByLabel('Reduction graph edges', { exact: true }).fill('')
  await d.getByLabel('Selected clique candidate IDs', { exact: true }).fill('')
  await d.getByRole('button', { name: 'Apply graph and threshold', exact: true }).click()
  await expect(root(page).locator('.cv-graph-source [data-graph-edge]')).toHaveCount(0)
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(6)
  await expect(root(page).locator('.cv-graph-target .cv-vertex[aria-pressed=true]')).toHaveCount(4)
  await expect(root(page).locator('.cv-validation')).toContainText('both certificates verify')
})
test('026 graph editor rejects bad instances and preserves malformed certificates for verification', async ({ page }) => {
  await root(page).getByRole('button', { name: 'Edit graph and threshold', exact: true }).click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Reduction graph vertex count', { exact: true }).fill('4')
  await d.getByLabel('Reduction clique threshold', { exact: true }).fill('5')
  await d.getByLabel('Reduction graph edges', { exact: true }).fill('1-2')
  await d.getByRole('button', { name: 'Apply graph and threshold', exact: true }).click()
  await expect(d.getByRole('alert')).toContainText('0 to n')
  await d.getByLabel('Reduction clique threshold', { exact: true }).fill('2')
  await d.getByLabel('Reduction graph edges', { exact: true }).fill('1-9')
  await d.getByRole('button', { name: 'Apply graph and threshold', exact: true }).click()
  await expect(d.getByRole('alert')).toContainText('Edge endpoints')
  await d.getByLabel('Reduction graph edges', { exact: true }).fill('1-2')
  await d.getByLabel('Selected clique candidate IDs', { exact: true }).fill('1,1,99')
  await d.getByRole('button', { name: 'Apply graph and threshold', exact: true }).click()
  await expect(root(page).locator('.cv-validation')).toContainText('distinct, in-range vertex IDs')
  await expect(root(page).getByLabel('Clique to cover example', { exact: true })).toHaveValue('custom')
})
test('026 view switches, animation controls and all six replay stages reflect construction', async ({ page }) => {
  await root(page).getByLabel('Show complement edges', { exact: true }).uncheck()
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(0)
  await root(page).getByLabel('Show complement edges in H', { exact: true }).check()
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(4)
  await root(page).getByLabel('Show vertex labels', { exact: true }).uncheck()
  await expect(root(page).locator('.cv-vertex text')).toHaveCount(0)
  await root(page).getByLabel('Highlight vertex cover (V − S)', { exact: true }).uncheck()
  await expect(root(page).locator('.cv-graph-target circle[fill="#7df6a2"]')).toHaveCount(0)
  await root(page).getByRole('button', { name: 'Reset', exact: true }).click()
  await root(page).getByRole('button', { name: 'Animate Reduction Steps', exact: true }).click()
  await root(page).getByRole('button', { name: 'Pause reduction', exact: true }).click()
  await expect(root(page).locator('.cv-graph-target .cv-vertex')).toHaveCount(0)
  await root(page).getByRole('button', { name: 'Reduction step 3: Construct complement', exact: true }).click()
  await expect(root(page).locator('.cv-graph-target .cv-vertex')).toHaveCount(6)
  await root(page).getByRole('button', { name: 'Reduction step 4: Find independent set', exact: true }).click()
  await expect(root(page).locator('.cv-target-legend')).toContainText('S = {1, 2, 3}')
  await root(page).getByRole('button', { name: 'Next reduction step', exact: true }).click()
  await expect(root(page).locator('.cv-target-legend')).toContainText('Selected vertex cover (size n − k)')
  await root(page).getByLabel('Reduction playback speed', { exact: true }).selectOption('100')
  await root(page).getByRole('button', { name: 'Play reduction', exact: true }).click()
  await expect(root(page).locator('.cv-playback b')).toHaveText('6/6')
  await expect(root(page).getByRole('button', { name: 'Next reduction step', exact: true })).toBeDisabled()
})
test('026 reverse certificates and bounded searches preserve YES and NO answers', async ({ page }) => {
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Experiments', exact: true }).click()
  await expect(root(page).locator('.cv-pair-table tbody tr')).toHaveCount(15)
  await root(page).getByLabel('Target cover certificate IDs', { exact: true }).fill('4,4,6')
  await root(page).getByRole('button', { name: 'Verify target cover', exact: true }).click()
  await expect(root(page).getByRole('status')).toContainText('Rejected target certificate')
  await root(page).getByLabel('Target cover certificate IDs', { exact: true }).fill('4,5,6')
  await root(page).getByRole('button', { name: 'Verify target cover', exact: true }).click()
  await expect(root(page).getByRole('status')).toContainText('decoded source clique {1, 2, 3}')
  await root(page).getByRole('button', { name: 'Use decoded clique in G', exact: true }).click()
  await expect(root(page).locator('.cv-message')).toContainText('reverse implication')
  await root(page).getByLabel('Clique to cover example', { exact: true }).selectOption('path')
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Experiments', exact: true }).click()
  await root(page).getByRole('button', { name: 'Search both instances (bounded)', exact: true }).click()
  await expect(root(page).getByRole('status')).toContainText('Source NO ⇔ Target NO')
  await expect(root(page).getByRole('status')).toContainText('separate from the O(n²) construction')
})
test('026 theory, code, predictions, persistent notes and dark mode work', async ({ page }, info) => {
  await root(page).getByRole('button', { name: 'Start Learning', exact: true }).click()
  await expect(root(page).getByRole('heading', { name: 'Clique → Independent Set → Vertex Cover', exact: true })).toBeVisible()
  await root(page).getByRole('button', { name: 'Explore both proof directions', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Backward: a cover C of H')
  await page.getByRole('button', { name: 'Close clique cover dialog', exact: true }).click()
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Code', exact: true }).click()
  await expect(root(page).locator('pre')).toContainText('O(n²)')
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Practice', exact: true }).click()
  await root(page).getByLabel('Predicted cover threshold', { exact: true }).fill('6')
  await root(page).getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root(page).getByRole('status')).toContainText('Try again')
  await root(page).getByLabel('Predicted cover threshold', { exact: true }).fill('3')
  await root(page).getByRole('button', { name: 'Check prediction', exact: true }).click()
  await expect(root(page).getByRole('status')).toContainText('Correct')
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Notes', exact: true }).click()
  await root(page).getByRole('button', { name: 'Language: English (India)', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await root(page).getByLabel('Clique to cover proof notes', { exact: true }).fill('Complement every distinct pair; use n-k; prove both directions.')
  await root(page).locator('.cv-review').click()
  await root(page).getByRole('button', { name: 'Toggle color theme', exact: true }).click()
  await page.reload()
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(root(page).getByLabel('Clique to cover proof notes', { exact: true })).toHaveValue(
    'Complement every distinct pair; use n-k; prove both directions.',
  )
  await expect(root(page).locator('.cv-review')).toHaveAttribute('aria-pressed', 'true')
  await root(page).locator('.mom-tabs').getByRole('button', { name: 'Visualization', exact: true }).click()
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1672, height: 941 })
  await page.screenshot({ path: `artifacts/visual-qa/clique-cover-026/${info.project.name}-dark.png` })
})
test('026 eight-vertex custom graphs and responsive layouts do not overlap or overflow', async ({ page }, info) => {
  await root(page).getByRole('button', { name: 'Edit graph and threshold', exact: true }).click()
  await page.getByLabel('Reduction graph vertex count', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Apply graph and threshold', exact: true }).click()
  await expect(root(page).locator('.cv-graph-source .cv-vertex')).toHaveCount(8)
  await expect(root(page).locator('.cv-graph-target [data-graph-edge]')).toHaveCount(17)
  for (const width of info.project.name === 'desktop' ? [1280, 1024, 768] : [393, 320]) {
    await page.setViewportSize({ width, height: 941 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  const controls = await root(page).locator('.cv-controls').boundingBox(),
    steps = await root(page).locator('.cv-reduction-steps').boundingBox()
  expect(controls!.y + controls!.height).toBeLessThan(steps!.y)
})
