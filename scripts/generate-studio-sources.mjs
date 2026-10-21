// Extract the actual canonical kernels, removing only trace instrumentation.
// The checked-in source rows survive bundling/minification and retain semantic IDs.
import ts from 'typescript'
import fs from 'node:fs'
const path = 'src/studio/kernels.ts'
const source = ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
const definitions = {}
for (const node of source.statements.filter(ts.isFunctionDeclaration)) {
  const id = node.getFullText(source).match(/@algorithm ([\w-]+)/)?.[1]
  if (!id) continue
  const transformed = ts.transform(node, [
    (context) => {
      const visit = (n) => {
        if (ts.isExpressionStatement(n) && (/^t\./.test(n.expression.getText(source)) || n.expression.kind === ts.SyntaxKind.VoidExpression)) return undefined
        const start = n.getStart(source)
        const header = source.text.slice(start).match(/^[^\n]*(?:\n\s*\/\/ @line [\w-]+)?/)?.[0] ?? ''
        const ending = source.text.slice(n.end).split('\n')[0]
        const statementText =
          ts.isVariableStatement(n) || ts.isExpressionStatement(n) || ts.isReturnStatement(n) ? source.text.slice(start, n.end) + ending : header
        const sameStatementLine =
          n.parent &&
          ts.isStatement(n.parent) &&
          source.getLineAndCharacterOfPosition(n.parent.getStart(source)).line === source.getLineAndCharacterOfPosition(start).line
        const semantic = sameStatementLine ? undefined : statementText.match(/\/\/ @line ([\w-]+)/)?.[1]
        if (ts.isFunctionDeclaration(n) && n === node)
          return ts.factory.updateFunctionDeclaration(
            n,
            undefined,
            n.asteriskToken,
            n.name,
            n.typeParameters,
            n.parameters.filter((p) => p.name.getText(source) !== 't'),
            n.type,
            ts.visitNode(n.body, visit),
          )
        const updated = ts.visitEachChild(n, visit, context)
        if (semantic && ts.isStatement(n)) ts.addSyntheticLeadingComment(updated, ts.SyntaxKind.MultiLineCommentTrivia, `__stmt_${semantic}__`, true)
        return updated
      }
      return (n) => ts.visitNode(n, visit)
    },
  ])
  const printed = printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0], source)
  const js = ts.transpileModule(printed, { compilerOptions: { target: ts.ScriptTarget.ES2022, removeComments: false } }).outputText
  const rows = []
  let pending
  for (const line of js.split('\n')) {
    const marker = line.match(/\/\*__stmt_([\w-]+)__\*\//)
    if (marker) pending = marker[1]
    const text = line.replace(/\/\*__stmt_[\w-]+__\*\/\s*/g, '').replace(/\s*\/\/ @line [\w-]+/, '')
    if (!text.trim() || text.includes('@algorithm') || text.trim() === '"use strict";' || text.trim() === ';') continue
    rows.push({ ...(pending ? { id: pending } : {}), text })
    pending = undefined
  }
  definitions[id] = rows
  transformed.dispose()
}
definitions['search-insert-position'] = definitions['lower-bound']
definitions['divide-and-conquer-suite'] = definitions['merge-sort']
definitions['advanced-sorting-suite'] = definitions['quick-sort']
definitions['advanced-searching-suite'] = definitions['binary-search']
fs.writeFileSync('src/studio/sources.generated.json', JSON.stringify(definitions, null, 2) + '\n')
console.log(`Generated canonical source for ${Object.keys(definitions).length} studios.`)
