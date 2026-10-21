import ts from 'typescript'
import { readFile } from 'node:fs/promises'
import { files, cleanJsx } from './audit.mjs'
const findings = []
for (const file of (await files('src')).filter(
  (f) => f.endsWith('.tsx') && !f.includes('.test.') && !f.startsWith('src/i18n/') && !f.endsWith('/prerender.tsx'),
)) {
  const source = await readFile(file, 'utf8')
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  function visit(n, protect = false) {
    if (ts.isFunctionDeclaration(n) && n.name?.text === 'Syntax') protect = true
    if (ts.isJsxElement(n) && ['pre', 'code', 'script', 'style', 'textarea'].includes(n.openingElement.tagName.getText(tree))) protect = true
    if (!protect && ts.isJsxText(n) && /[A-Za-z]/.test(cleanJsx(n.text)))
      findings.push({ file, line: tree.getLineAndCharacterOfPosition(n.getStart(tree)).line + 1, text: cleanJsx(n.text) })
    if (
      !protect &&
      ts.isJsxAttribute(n) &&
      ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'].includes(n.name.getText(tree)) &&
      n.initializer &&
      ts.isStringLiteral(n.initializer) &&
      /[A-Za-z]/.test(n.initializer.text)
    )
      findings.push({ file, line: tree.getLineAndCharacterOfPosition(n.getStart(tree)).line + 1, text: n.initializer.text })
    if (ts.isCallExpression(n) && /^(?:window\.)?(?:confirm|alert)$/.test(n.expression.getText(tree)) && n.arguments[0] && ts.isStringLiteral(n.arguments[0]))
      findings.push({ file, line: tree.getLineAndCharacterOfPosition(n.getStart(tree)).line + 1, text: n.arguments[0].text })
    ts.forEachChild(n, (child) => visit(child, protect))
  }
  visit(tree)
}
if (findings.length) {
  console.error('Unbound presentation strings:', JSON.stringify(findings, null, 2))
  process.exitCode = 1
} else console.log('No unbound JSX text or translatable literal attributes outside explicit exclusions.')
