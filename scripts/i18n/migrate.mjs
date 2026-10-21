import ts from 'typescript'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { files, cleanJsx, decode, namespace } from './audit.mjs'
const migrated = []
for (const file of (await files('src')).filter(
  (f) =>
    f.endsWith('.tsx') &&
    !f.includes('.test.') &&
    !f.startsWith('src/i18n/') &&
    !f.endsWith('/main.tsx') &&
    !f.endsWith('/prerender.tsx') &&
    !f.endsWith('/CharacterArt.tsx'),
)) {
  const source = await readFile(file, 'utf8')
  if (source.includes('// @localized-render')) continue
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  let textCount = 0,
    hookCount = 0
  const ns = namespace(file)
  const edit = (start, end, text) => edits.push({ start, end, text })
  function visit(node, protect = false) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'Syntax') protect = true
    if (ts.isJsxElement(node) && ['pre', 'code', 'script', 'style', 'textarea'].includes(node.openingElement.tagName.getText(tree))) protect = true
    if (!protect && ts.isJsxText(node)) {
      const value = cleanJsx(node.text)
      if (/[A-Za-z]/.test(value)) {
        edit(node.getFullStart(), node.end, `{tx(${JSON.stringify(value)}, '${ns}')}`)
        textCount++
      }
    }
    if (
      !protect &&
      ts.isJsxAttribute(node) &&
      ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'].includes(node.name.getText(tree)) &&
      node.initializer
    ) {
      const init = node.initializer
      if (ts.isStringLiteral(init)) {
        edit(init.getStart(tree), init.end, `{tx(${JSON.stringify(decode(init.text))}, '${ns}')}`)
        textCount++
      } else if (ts.isJsxExpression(init) && init.expression) {
        const e = init.expression
        edit(e.getStart(tree), e.end, `tx(${e.getText(tree)}, '${ns}')`)
        textCount++
      }
      return
    }
    if (!protect && ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent) && !ts.isJsxSpreadAttribute(node.parent)) {
      const e = node.expression
      if (
        /^(?:text|pattern|inputText|inputJson|input|payload|data|gameSymbols|board|value|values|cell|left|right|x|y|currentValue|item\.value|node\.(?:value|key)|row\.value)$/.test(
          e.getText(tree),
        )
      )
        return
      edit(e.getStart(tree), e.getStart(tree), `tx(`)
      edit(e.end, e.end, `, '${ns}')`)
      textCount++
    }
    const component = ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text) && node.name.text !== 'Syntax' && node.body
    if (component) {
      edit(node.body.getStart(tree) + 1, node.body.getStart(tree) + 1, `\n  useLocaleRender()\n`)
      hookCount++
    }
    if (ts.isArrowFunction(node) && ts.isVariableDeclaration(node.parent) && /^[A-Z]/.test(node.parent.name.getText(tree))) {
      if (ts.isBlock(node.body)) {
        edit(node.body.getStart(tree) + 1, node.body.getStart(tree) + 1, '\n  useLocaleRender()\n')
        hookCount++
      } else if (ts.isJsxElement(node.body) || ts.isJsxSelfClosingElement(node.body) || ts.isParenthesizedExpression(node.body)) {
        edit(node.body.getStart(tree), node.body.getStart(tree), ' { useLocaleRender(); return ')
        edit(node.body.end, node.body.end, ' }')
        hookCount++
      }
    }
    ts.forEachChild(node, (child) => visit(child, protect))
  }
  visit(tree)
  if (!textCount && !hookCount) continue
  // Reverse edits preserve every original expression, event handler and data value.
  edits.sort((a, b) => b.start - a.start || b.end - a.end)
  let result = source
  for (const e of edits) result = result.slice(0, e.start) + e.text + result.slice(e.end)
  let relative = path.posix.relative(path.posix.dirname(file), 'src/i18n/render')
  if (!relative.startsWith('.')) relative = './' + relative
  const names = [...(textCount ? ['tx'] : []), ...(hookCount ? ['useLocaleRender'] : [])]
  result = `// @localized-render\nimport { ${names.join(', ')} } from '${relative}'\n` + result
  await writeFile(file, result)
  migrated.push({ file, namespace: ns, textBindings: textCount, componentSubscriptions: hookCount })
}
await writeFile('docs/localization/migration.json', JSON.stringify(migrated, null, 2) + '\n')
console.log(
  'Migrated',
  migrated.length,
  'React source files with',
  migrated.reduce((n, f) => n + f.textBindings, 0),
  'presentation bindings.',
)
