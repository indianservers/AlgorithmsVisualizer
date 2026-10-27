import ts from 'typescript'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { rolldown } from 'rolldown'
const namespaces = ['common', 'navigation', 'studios', 'algorithms', 'controls', 'messages']
export function key(text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return 's_' + (hash >>> 0).toString(16)
}
export function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip);/gi, (_, x) =>
    x[0] === '#'
      ? String.fromCodePoint(x[1].toLowerCase() === 'x' ? parseInt(x.slice(2), 16) : parseInt(x.slice(1), 10))
      : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', ndash: '–', mdash: '—', hellip: '…' }[x],
  )
}
export function cleanJsx(text) {
  const lines = text.split(/\r\n|\n|\r/)
  let last = 0
  lines.forEach((line, i) => {
    if (/\S/.test(line)) last = i
  })
  let value = ''
  lines.forEach((line, i) => {
    let str = line.replace(/\t/g, ' ')
    if (i !== 0) str = str.replace(/^ +/, '')
    if (i !== lines.length - 1) str = str.replace(/ +$/, '')
    if (str) {
      if (i !== last) str += ' '
      value += str
    }
  })
  return decode(value)
}
export function namespace(file) {
  if (/Sidebar|LessonTabs|routing|catalog|Navigation/.test(file)) return 'navigation'
  if (/Controls|Timeline|ViewportCanvas/.test(file)) return 'controls'
  if (/account|validation|Parsing|Error|Toast/.test(file)) return 'messages'
  if (/algorithms|guides|encyclopedia\/content|daa\/(catalog|legacyStudy|syllabi)|Profiles|Model|model|Trace|trace|profiles/.test(file)) return 'algorithms'
  if (/learning\/|studio\/|daa\/|StringSuite|Penguin|Detective|Explorer/.test(file)) return 'studios'
  return 'common'
}
export function human(text) {
  return (
    /[A-Za-z]/.test(text) &&
    text.length > 1 &&
    !/^(?:https?:|\/|\.\/|\.\.\/|#[\w-]+$)/.test(text) &&
    !/^[-\w]+\.(?:tsx?|jsx?|css|json|svg|png|mjs)$/.test(text) &&
    !/[{};=]/.test(text.replace(/\{\{\w+\}\}/g, '')) &&
    (!/^[-\w]+$/.test(text) || /^[A-Z][A-Za-z]+$/.test(text)) &&
    !/^O\(.+\)$/.test(text)
  )
}
export async function files(dir) {
  const result = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.posix.join(dir, item.name)
    if (item.isDirectory()) result.push(...(await files(full)))
    else result.push(full)
  }
  return result
}
export async function audit() {
  const dictionaries = Object.fromEntries(namespaces.map((ns) => [ns, {}]))
  const occurrences = []
  const sourceKeys = new Map()
  const templates = []
  const migration = []
  const excluded = []
  const paths = (await files('src')).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.') && !f.startsWith('src/i18n/'))
  const add = (text, file, kind, line) => {
    if (!text || !/[A-Za-z]/.test(text)) return
    const ns = namespace(file)
    const id = key(text)
    if (sourceKeys.has(id) && sourceKeys.get(id) !== text) throw Error('Cross-namespace source key collision')
    sourceKeys.set(id, text)
    if (dictionaries[ns][id] && dictionaries[ns][id] !== text) throw Error('Source key collision')
    dictionaries[ns][id] = text
    occurrences.push({ file, line, kind, namespace: ns, key: id, text })
  }
  for (const file of paths) {
    const source = await readFile(file, 'utf8')
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    function visit(node, protectedContent = false) {
      let protect = protectedContent
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'setProperty') return
      if (
        ts.isJsxAttribute(node) &&
        ![
          'title',
          'placeholder',
          'aria-label',
          'aria-description',
          'alt',
          'playLabel',
          'progressLabel',
          'labels',
          'description',
          'subtitle',
          'message',
          'helperText',
          'emptyText',
          'heading',
          'options',
        ].includes(node.name.getText(tree)) &&
        !/^on[A-Z]/.test(node.name.getText(tree))
      )
        return
      if (ts.isPropertyAssignment(node) && ['code', 'id', 'className', 'runner', 'expression'].includes(node.name.getText(tree))) return
      if (ts.isJsxElement(node) && ['pre', 'code', 'script', 'style', 'textarea'].includes(node.openingElement.tagName.getText(tree))) protect = true
      if (ts.isFunctionDeclaration(node) && node.name?.text === 'Syntax') protect = true
      const line = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1
      if (ts.isJsxText(node)) {
        const text = cleanJsx(node.text)
        if (!protect) add(text, file, 'jsx-text', line)
        else if (text.trim()) excluded.push({ file, line, reason: 'protected code/math/input content' })
      }
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const parent = node.parent
        const prop = ts.isPropertyAssignment(parent) ? parent.name.getText(tree) : ''
        const attr = ts.isJsxAttribute(parent) ? parent.name.getText(tree) : ''
        if (
          !protect &&
          (human(node.text) ||
            (/^(name|title|summary|subtitle|label|description|message|question|answer|reason|text|placeholder|helper|concept|idea|proof|analysis|example|limits)$/.test(
              prop,
            ) &&
              node.text.length > 1) ||
            ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'].includes(attr))
        )
          add(node.text, file, attr ? 'attribute' : 'literal', line)
      }
      if (ts.isTemplateExpression(node) && !protect) {
        const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)]
        const text = parts.map((part, i) => part + (i < parts.length - 1 ? `{{value${i}}}` : '')).join('')
        if (human(text)) {
          add(text, file, 'template', line)
          if (!templates.some((t) => t.text === text)) templates.push({ text, namespace: namespace(file), key: key(text), parts })
        }
      }
      ts.forEachChild(node, (child) => visit(child, protect))
    }
    visit(tree)
    if (source.includes('// @localized-render')) {
      let textBindings = 0,
        componentSubscriptions = 0
      function count(node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          if (node.expression.text === 'tx') textBindings++
          if (node.expression.text === 'useLocaleRender') componentSubscriptions++
        }
        ts.forEachChild(node, count)
      }
      count(tree)
      migration.push({ file, namespace: namespace(file), textBindings, componentSubscriptions })
    }
  }
  for (const file of ['src/account/shell.html', 'public/account/auth.js', 'public/account/onboarding-ui.js']) {
    const text = await readFile(file, 'utf8')
    if (file.endsWith('html')) {
      for (const m of text.matchAll(/>([^<>]+)</g)) {
        const value = cleanJsx(m[1])
        if (value.trim()) add(value, file, 'native-widget', 0)
      }
      for (const m of text.matchAll(/(?:title|placeholder|aria-label)="([^"]+)"/g)) add(decode(m[1]), file, 'native-widget', 0)
    } else {
      const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
      function visit(n) {
        if (ts.isStringLiteral(n) && human(n.text)) add(n.text, file, 'native-widget', tree.getLineAndCharacterOfPosition(n.getStart(tree)).line + 1)
        ts.forEachChild(n, visit)
      }
      visit(tree)
    }
  }
  // Public catalog summaries can be computed from runner metadata or contain
  // semicolons that the generic code-string heuristic deliberately excludes.
  // Register the actual sitemap text explicitly, in a homepage-loaded namespace.
  const catalogBundle = await rolldown({ input: 'src/sitemap/catalog.ts', platform: 'node', logLevel: 'silent' })
  try {
    const { output } = await catalogBundle.generate({ format: 'esm' })
    const catalog = await import('data:text/javascript;base64,' + Buffer.from(output.find((item) => item.type === 'chunk').code).toString('base64'))
    for (const text of Object.values(catalog.sitemapCopy)) add(text, 'src/sitemap/catalog.ts', 'sitemap-copy', 0)
    for (const group of catalog.sitemapGroups) {
      for (const text of [group.name, group.description, ...group.lessons.map((lesson) => lesson.description)])
        add(text, 'src/sitemap/catalog.ts', 'sitemap-description', 0)
    }
  } finally {
    await catalogBundle.close()
  }
  for (const text of JSON.parse(await readFile('src/i18n/selector-source.json', 'utf8'))) add(text, 'src/i18n/LanguageSelector.tsx', 'selector', 0)
  await mkdir('src/i18n/locales/en-IN', { recursive: true })
  for (const ns of namespaces)
    await writeFile(
      `src/i18n/locales/en-IN/${ns}.json`,
      JSON.stringify(Object.fromEntries(Object.entries(dictionaries[ns]).sort((a, b) => a[0].localeCompare(b[0]))), null, 2) + '\n',
    )
  await mkdir('docs/localization', { recursive: true })
  await writeFile('docs/localization/migration.json', JSON.stringify(migration, null, 2) + '\n')
  await writeFile('docs/localization/source-inventory.json', JSON.stringify({ sourceFiles: paths.length, occurrences, excluded }, null, 2) + '\n')
  await mkdir('public/locales', { recursive: true })
  await writeFile('public/locales/templates.json', JSON.stringify(templates) + '\n')
  return { dictionaries, occurrences, templates }
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/audit.mjs')) {
  const { dictionaries, occurrences } = await audit()
  console.log(
    'Audited',
    occurrences.length,
    'source occurrences;',
    Object.values(dictionaries).reduce((n, d) => n + Object.keys(d).length, 0),
    'namespace keys',
  )
}
