import { readFile, writeFile, mkdir, cp } from 'node:fs/promises'
import { rolldown } from 'rolldown'
const namespaces = ['common', 'navigation', 'studios', 'algorithms', 'controls', 'messages']
const placeholders = (value) => [...value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => m[1]).sort()
export function resourceErrors(source, target) {
  const errors = []
  if (!target || Array.isArray(target) || typeof target !== 'object') return ['Resource must be an object']
  for (const [key, value] of Object.entries(target)) {
    const base = key.replace(/_(?:zero|one|two|few|many|other)$/, '')
    if (!(base in source)) {
      errors.push('Obsolete key: ' + key)
      continue
    }
    if (typeof value !== 'string' || !value.trim()) {
      errors.push('Invalid value: ' + key)
      continue
    }
    for (const math of source[base].match(/[OΘΩ]\([^)]*\)/g) ?? []) if (!value.includes(math)) errors.push('Complexity notation mismatch: ' + key)
    if (JSON.stringify(placeholders(source[base])) !== JSON.stringify(placeholders(value))) errors.push('Interpolation mismatch: ' + key)
  }
  return errors
}
export async function validate() {
  const locales = JSON.parse(await readFile('src/i18n/languages.json', 'utf8'))
  if (
    !Array.isArray(locales) ||
    !locales.length ||
    locales.some(
      (l) =>
        !Array.isArray(l) ||
        l.length !== 4 ||
        l.some((v) => typeof v !== 'string' || !v.trim()) ||
        !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(l[0]) ||
        !['Default', 'India', 'International'].includes(l[3]),
    ) ||
    locales[0][0] !== 'en-IN' ||
    new Set(locales.map((l) => l[0])).size !== locales.length
  )
    throw Error('Invalid locale configuration')
  const source = Object.fromEntries(
    await Promise.all(namespaces.map(async (ns) => [ns, JSON.parse(await readFile(`src/i18n/locales/en-IN/${ns}.json`, 'utf8'))])),
  )
  const inventory = JSON.parse(await readFile('docs/localization/source-inventory.json', 'utf8'))
  const migration = JSON.parse(await readFile('docs/localization/migration.json', 'utf8'))
  const total = Object.values(source).reduce((n, values) => n + Object.keys(values).length, 0)
  const coverage = []
  const errors = []
  for (const [locale] of locales) {
    const row = { locale, total, translated: 0, fallback: 0, needsNativeReview: 0, namespaces: {} }
    for (const ns of namespaces) {
      let target
      try {
        target = JSON.parse(await readFile(`src/i18n/locales/${locale}/${ns}.json`, 'utf8'))
      } catch {
        throw Error('Invalid/missing JSON: ' + locale + '/' + ns)
      }
      errors.push(...resourceErrors(source[ns], target).map((error) => `${locale}/${ns}: ${error}`))
      const translated = Object.entries(source[ns]).filter(([key, value]) => key in target && (locale === 'en-IN' || target[key] !== value)).length
      const missing = Object.keys(source[ns]).filter((key) => !(key in target) || (locale !== 'en-IN' && target[key] === source[ns][key]))
      row.namespaces[ns] = { source: Object.keys(source[ns]).length, translated, missingKeys: missing }
      row.translated += translated
      row.fallback += missing.length
    }
    row.percent = Number(((row.translated / total) * 100).toFixed(2))
    row.needsNativeReview = locale === 'en-IN' ? 0 : row.translated
    coverage.push(row)
  }
  if (errors.length) throw Error(errors.join('\n'))
  // Inventory is generated from the actual catalog, never a manually maintained route count.
  const bundle = await rolldown({ input: 'scripts/i18n/catalog-entry.ts', platform: 'node', treeshake: true, logLevel: 'silent' })
  let routes = []
  try {
    const { output } = await bundle.generate({ format: 'esm' })
    const module = await import('data:text/javascript;base64,' + Buffer.from(output.find((item) => item.type === 'chunk').code).toString('base64'))
    routes = module.routes.map((path) => ({
      path,
      namespaces:
        path === '/' || path.endsWith('/learn') || path === '/encyclopedia' || path.startsWith('/sitemap')
          ? ['common', 'navigation', 'algorithms', 'messages']
          : namespaces,
      renderBindings: 'migrated',
      translationStatus: 'partial in non-English locales',
      englishStatus: 'source preserved',
      note: 'Namespace dependency inventory; untranslated technical copy uses exact English fallback.',
    }))
  } finally {
    await bundle.close()
  }

  for (const route of routes) {
    route.coverageScope = 'All keys in required namespaces; conservative dependency coverage, not a per-page sentence census.'
    route.coverageByLocale = Object.fromEntries(
      coverage.map((row) => {
        const required = route.namespaces.reduce((sum, ns) => sum + row.namespaces[ns].source, 0)
        const populated = route.namespaces.reduce((sum, ns) => sum + row.namespaces[ns].translated, 0)
        return [row.locale, { requiredKeys: required, populated, missing: required - populated, percent: Number(((populated / required) * 100).toFixed(2)) }]
      }),
    )
  }
  await mkdir('docs/localization', { recursive: true })
  await writeFile('docs/localization/coverage.json', JSON.stringify({ totalSourceKeys: total, routes, locales: coverage }, null, 2) + '\n')
  const rows = coverage.map((r) => `| ${r.locale} | ${r.translated} | ${r.percent}% | ${r.fallback} | ${r.needsNativeReview} |`).join('\n')
  await writeFile(
    'LOCALIZATION_STATUS.md',
    `# Localization status\n\nDefault: **English (India), en-IN**. No browser/IP language detection. Source English wording, algorithm code, numeric data and routes are preserved.\n\n## Inventory\n\n- Discovered routes: **${routes.length}** (home, directory, categories, visualizations, and Learn articles).\n- Routes with migrated presentation bindings: **${routes.length}**.\n- Routes fully translated in every target language: **0**.\n- Routes partially translated in non-English languages: **${routes.length}**.\n- Source namespace keys: **${total}**, from **${inventory.sourceFiles}** source files.\n- React render files migrated: **${migration.length}**, with **${migration.reduce((n, r) => n + r.textBindings, 0)}** presentation bindings.\n- English keys are extracted from actual source, including metadata and native account UI.\n\n## Translation coverage\n\nEnglish fallback is never counted as a completed translation. Target resources are sparse by design: absence means a safe source-English fallback, not fabricated translated coverage. Percentages below count populated non-English values, not native-speaker certification. All supplied target-language drafts require native review before they can be considered linguistically approved. Technical terms may intentionally remain English.\n\n| Locale | Populated translations | Source coverage | English fallbacks | Awaiting native review |\n| --- | ---: | ---: | ---: | ---: |\n${rows}\n\n## Missing keys and review queue\n\nSee [coverage.json](docs/localization/coverage.json) for every missing key by locale and namespace; [source-inventory.json](docs/localization/source-inventory.json) maps keys back to exact source text, file and line. [migration.json](docs/localization/migration.json) lists render bindings. Target dictionaries currently concentrate on shared controls/navigation, with broader Hindi, Telugu and Russian coverage. They do **not** represent complete Phase 1 translation of all descriptions, errors, tooltips or studio copy.\n\n## Remaining Phase 1 work\n\nComplete and linguistically review the missing short UI strings, algorithm descriptions, native authentication feedback, and dynamic templates for all target locales. Preserve placeholders. Review terminology in every target language, especially technical usage in languages with multiple conventions. Dynamic strings not represented by a reviewed template safely remain English. No missing key is displayed to the user.\n\n## Phase 2\n\nReviewed long-form encyclopedia articles, proofs, worked examples, detailed execution explanations and additional assessment material. Do not translate executable source, formulas, variable identifiers, user data or datasets. The explicit exclusion policy is in src/i18n/exclusions.json.\n\n## Verification\n\nRun npm run i18n:check for locale/schema/placeholder/obsolete-key validation and coverage generation. npm run i18n:generate re-extracts source English and synchronizes static resources. npm run i18n:scan finds unbound JSX text and translatable attributes. Functional and visual test results are recorded in docs/localization/TEST_RESULTS.md after execution.\n`,
  )
  await cp('src/i18n/locales', 'public/locales', { recursive: true })
  console.log(`Validated ${locales.length} locales, ${total} keys and ${routes.length} routes. English fallbacks are reported, not counted as translations.`)
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/validate.mjs')) await validate()
