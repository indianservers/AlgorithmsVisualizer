// A deliberately small source translator for the canonical studio kernels.
// Unsupported syntax fails generation instead of displaying invented code.
import ts from 'typescript'
import fs from 'node:fs'
const definitions = JSON.parse(fs.readFileSync('src/studio/sources.generated.json', 'utf8'))
const output = {}
for (const [id, sourceRows] of Object.entries(definitions)) {
  const code = sourceRows.map((r) => r.text).join('\n')
  const sf = ts.createSourceFile('kernel.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const root = sf.statements.find(ts.isFunctionDeclaration)
  const sorting = id.endsWith('-sort') || ['divide-and-conquer-suite', 'advanced-sorting-suite', 'sliding-window-two-pointers-suite'].includes(id)
  const nested = root.body.statements.filter(ts.isFunctionDeclaration)
  for (const lang of ['Python', 'C++', 'Java']) {
    const python = lang === 'Python',
      java = lang === 'Java',
      cpp = lang === 'C++'
    const rows = [],
      types = { a: 'array', target: 'double' }
    const row = (text, level, lineId) => rows.push({ text: '    '.repeat(level) + text, ...(lineId ? { id: lineId } : {}) })
    const lineId = (n) => sourceRows[sf.getLineAndCharacterOfPosition(n.getStart(sf)).line]?.id
    const type = (n) => {
      if (!n) return 'int'
      if (ts.isIdentifier(n)) return types[n.text] ?? 'int'
      if ([ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(n.kind)) return 'bool'
      if (ts.isElementAccessExpression(n)) return 'double'
      if (
        ts.isBinaryExpression(n) &&
        [
          ts.SyntaxKind.GreaterThanToken,
          ts.SyntaxKind.GreaterThanEqualsToken,
          ts.SyntaxKind.LessThanToken,
          ts.SyntaxKind.LessThanEqualsToken,
          ts.SyntaxKind.EqualsEqualsEqualsToken,
        ].includes(n.operatorToken.kind)
      )
        return 'bool'
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
        const p = n.expression
        if (p.name.text === 'slice' || p.name.text === 'fill') return 'array'
        if (p.name.text === 'from') return 'buckets'
        if (p.name.text === 'max' || p.name.text === 'min') return id === 'counting-sort' ? 'int' : 'double'
      }
      return 'int'
    }
    const declType = (t) =>
      t === 'array'
        ? cpp
          ? 'std::vector<double>'
          : 'ArrayList<Double>'
        : t === 'buckets'
          ? cpp
            ? 'std::vector<std::vector<double>>'
            : 'ArrayList<ArrayList<Double>>'
          : t === 'bool'
            ? java
              ? 'boolean'
              : 'bool'
            : t
    const e = (n) => {
      if (!n) return ''
      if (ts.isIdentifier(n)) return n.text
      if (ts.isNumericLiteral(n)) return n.text
      if (n.kind === ts.SyntaxKind.TrueKeyword) return python ? 'True' : 'true'
      if (n.kind === ts.SyntaxKind.FalseKeyword) return python ? 'False' : 'false'
      if (ts.isParenthesizedExpression(n)) return `(${e(n.expression)})`
      if (ts.isArrayLiteralExpression(n))
        return python
          ? `[${n.elements.map(e).join(', ')}]`
          : cpp
            ? `std::vector<double>{${n.elements.map(e).join(', ')}}`
            : n.elements.length
              ? `new ArrayList<Double>(Arrays.asList(${n.elements.map((x) => `(double)(${e(x)})`).join(', ')}))`
              : 'new ArrayList<Double>()'
      if (ts.isElementAccessExpression(n))
        return java
          ? types[e(n.expression)] === 'buckets'
            ? `${e(n.expression)}.get(${e(n.argumentExpression)})`
            : `at(${e(n.expression)}, (int)(${e(n.argumentExpression)}))`
          : `${e(n.expression)}[${e(n.argumentExpression)}]`
      if (ts.isPropertyAccessExpression(n)) {
        if (n.name.text === 'length') return python ? `len(${e(n.expression)})` : cpp ? `int(${e(n.expression)}.size())` : `${e(n.expression)}.size()`
        return `${e(n.expression)}.${n.name.text}`
      }
      if (ts.isPrefixUnaryExpression(n)) {
        if (java && n.operator === ts.SyntaxKind.ExclamationToken && ts.isPropertyAccessExpression(n.operand) && n.operand.name.text === 'length')
          return `(${e(n.operand)} == 0)`
        if (n.operator === ts.SyntaxKind.ExclamationToken) return python ? `not (${e(n.operand)})` : `!(${e(n.operand)})`
        return ts.tokenToString(n.operator) + e(n.operand)
      }
      if (ts.isPostfixUnaryExpression(n)) {
        if (python) return e(n.operand)
        return e(n.operand) + ts.tokenToString(n.operator)
      }
      if (ts.isConditionalExpression(n))
        return python ? `(${e(n.whenTrue)} if ${e(n.condition)} else ${e(n.whenFalse)})` : `(${e(n.condition)} ? ${e(n.whenTrue)} : ${e(n.whenFalse)})`
      if (ts.isBinaryExpression(n)) {
        const op = ts.tokenToString(n.operatorToken.kind)
        return `${e(n.left)} ${op === '===' ? '==' : op === '!==' ? '!=' : python && op === '&&' ? 'and' : python && op === '||' ? 'or' : op} ${e(n.right)}`
      }
      if (ts.isCallExpression(n)) {
        if (ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'from')
          return python ? '[[] for _ in range(10)]' : cpp ? 'std::vector<std::vector<double>>(10)' : 'makeBuckets()'
        const args = n.arguments.map(e)
        if (ts.isIdentifier(n.expression)) {
          const name = n.expression.text
          if (nested.some((fn) => fn.name.text === name) && java) args.unshift('a', 'target')
          return `${name}(${args.join(', ')})`
        }
        const p = n.expression,
          name = p.name.text,
          obj = e(p.expression)
        if (obj === 'Math') {
          if (name === 'floor') return python ? `math.floor(${args[0]})` : cpp ? `int(std::floor(${args[0]}))` : `(int)Math.floor(${args[0]})`
          if (n.arguments.some(ts.isSpreadElement)) return python ? `builtins.${name}([0] + a)` : `${name}Value(a)`
          return python
            ? `builtins.${name}(${args.join(', ')})`
            : cpp
              ? `std::${name}(${args.map((x) => (/\./.test(x) ? x : x)).join(', ')})`
              : `Math.${name}(${args.join(', ')})`
        }
        if (name === 'slice')
          return python
            ? `${obj}[${args[0]}:${args[1]}]`
            : cpp
              ? `std::vector<double>(${obj}.begin() + ${args[0]}, ${obj}.begin() + ${args[1]})`
              : `new ArrayList<>(${obj}.subList(${args[0]}, ${args[1]}))`
        if (name === 'push') return python ? `${obj}.append(${args[0]})` : `${obj}.${cpp ? 'push_back' : 'add'}(${args[0]})`
        if (name === 'pop') return python ? `${obj}.pop()` : cpp ? `${obj}.pop_back()` : `${obj}.remove(${obj}.size() - 1)`
        if (name === 'fill') {
          const count = e(p.expression.arguments[0])
          return python ? `[0] * (${count})` : cpp ? `std::vector<double>(${count}, 0)` : `new ArrayList<>(Collections.nCopies(${count}, 0.0))`
        }
        if (name === 'from') return python ? '[[] for _ in range(10)]' : cpp ? 'std::vector<std::vector<double>>(10)' : 'makeBuckets()'
        throw new Error(`${id} ${lang}: unsupported call ${n.getText(sf)}`)
      }
      if (ts.isSpreadElement(n)) return e(n.expression)
      throw new Error(`${id} ${lang}: unsupported expression ${n.getText(sf)}`)
    }
    const set = (left, right) =>
      java && ts.isElementAccessExpression(left)
        ? `${e(left.expression)}.set((int)(${e(left.argumentExpression)}), (double)(${right}))`
        : `${e(left)} = ${right}`
    const expr = (n, level, semantic) => {
      if (ts.isBinaryExpression(n) && ts.isArrayLiteralExpression(n.left)) {
        const [a, b] = n.left.elements
        if (python) row(`${e(a)}, ${e(b)} = ${e(b)}, ${e(a)}`, level, semantic)
        else if (cpp) row(`std::swap(${e(a)}, ${e(b)});`, level, semantic)
        else {
          row('{', level, semantic)
          row(`double temp = ${e(a)};`, level + 1, semantic)
          row(set(a, e(b)) + ';', level + 1, semantic)
          row(set(b, 'temp') + ';', level + 1, semantic)
          row('}', level, semantic)
        }
        return
      }
      if (ts.isPostfixUnaryExpression(n)) {
        const op = n.operator === ts.SyntaxKind.PlusPlusToken ? '+' : '-'
        row(
          java && ts.isElementAccessExpression(n.operand) ? set(n.operand, `${e(n.operand)} ${op} 1`) + ';' : python ? `${e(n.operand)} ${op}= 1` : e(n) + ';',
          level,
          semantic,
        )
        return
      }
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        row(set(n.left, e(n.right)) + (python ? '' : ';'), level, semantic)
        if (python) {
          const increments = []
          function collect(x, condition) {
            if (ts.isConditionalExpression(x)) {
              collect(x.whenTrue, e(x.condition))
              collect(x.whenFalse, `not (${e(x.condition)})`)
              return
            }
            if (ts.isPostfixUnaryExpression(x)) increments.push({ name: e(x.operand), condition })
            ts.forEachChild(x, (c) => collect(c, condition))
          }
          collect(n.right)
          increments.forEach((v) => row(`${v.condition ? `if ${v.condition}: ` : ''}${v.name} += 1`, level, semantic))
        }
        return
      }
      row(e(n) + (python ? '' : ';'), level, semantic)
    }
    const body = (n, level) => {
      if (ts.isBlock(n)) n.statements.forEach((s) => statement(s, level))
      else statement(n, level)
    }
    const statement = (n, level) => {
      const semantic = lineId(n)
      if (ts.isEmptyStatement(n)) return
      if (ts.isVariableStatement(n)) {
        for (const d of n.declarationList.declarations) {
          let t = type(d.initializer)
          if (['key', 'pivot', 'value', 'sum'].includes(d.name.text)) t = 'double'
          if (d.name.text === 'exp') t = 'double'
          types[d.name.text] = t
          let value = e(d.initializer)
          if (!python && t === 'int' && ['min', 'max'].includes(d.name.text)) value = cpp ? `int(${value})` : `(int)(${value})`
          row(`${python ? '' : declType(t) + ' '}${d.name.text} = ${value}${python ? '' : ';'}`, level, semantic)
        }
      } else if (ts.isExpressionStatement(n)) {
        if (ts.isStringLiteral(n.expression)) return
        expr(n.expression, level, semantic)
      } else if (ts.isIfStatement(n)) {
        row(`${python ? 'if ' : 'if ('}${e(n.expression)}${python ? ':' : ') {'}`, level, semantic)
        body(n.thenStatement, level + 1)
        if (n.elseStatement) {
          row(python ? 'else:' : '} else {', level)
          body(n.elseStatement, level + 1)
        }
        if (!python) row('}', level)
      } else if (ts.isWhileStatement(n)) {
        row(`${python ? 'while ' : 'while ('}${e(n.expression)}${python ? ':' : ') {'}`, level, semantic)
        body(n.statement, level + 1)
        if (!python) row('}', level)
      } else if (ts.isForStatement(n)) {
        const d = n.initializer.declarations[0],
          name = d.name.text
        types[name] = name === 'exp' ? 'double' : 'int'
        if (python) {
          const normal = ts.isPostfixUnaryExpression(n.incrementor)
          if (normal) {
            const decreasing = n.incrementor.operator === ts.SyntaxKind.MinusMinusToken
            const condition = n.condition
            let end
            if (ts.isBinaryExpression(condition.left)) end = `(${e(condition.right)} - ${e(condition.left.right)})`
            else end = e(condition.right)
            if (condition.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken) end = `(${end}) + 1`
            if (condition.operatorToken.kind === ts.SyntaxKind.GreaterThanEqualsToken) end = `(${end}) - 1`
            row(`for ${name} in range(${e(d.initializer)}, ${end}${decreasing ? ', -1' : ''}):`, level, semantic)
            body(n.statement, level + 1)
          } else {
            row(`${name} = ${e(d.initializer)}`, level)
            row(`while ${e(n.condition)}:`, level, semantic)
            body(n.statement, level + 1)
            expr(n.incrementor, level + 1)
          }
        } else {
          row(`for (${declType(types[name])} ${name} = ${e(d.initializer)}; ${e(n.condition)}; ${e(n.incrementor)}) {`, level, semantic)
          body(n.statement, level + 1)
          row('}', level)
        }
      } else if (ts.isForOfStatement(n)) {
        const name = n.initializer.declarations[0].name.text
        const t = types[e(n.expression)] === 'buckets' ? 'array' : 'double'
        types[name] = t
        row(python ? `for ${name} in ${e(n.expression)}:` : `for (${cpp ? 'const auto&' : declType(t)} ${name} : ${e(n.expression)}) {`, level, semantic)
        body(n.statement, level + 1)
        if (!python) row('}', level)
      } else if (ts.isReturnStatement(n)) row(`return${n.expression ? ' ' + e(n.expression) : ''}${python ? '' : ';'}`, level, semantic)
      else if (ts.isBreakStatement(n)) row(python ? 'break' : 'break;', level, semantic)
      else if (ts.isContinueStatement(n)) row(python ? 'continue' : 'continue;', level, semantic)
      else if (ts.isFunctionDeclaration(n)) {
        if (java) return
        const params = n.parameters.map((p) => p.name.text)
        params.forEach((p) => (types[p] = 'int'))
        const returns = n.name.text === 'search' ? 'int' : 'void'
        row(
          python
            ? `def ${n.name.text}(${params.join(', ')}):`
            : `std::function<${returns}(${params.map(() => 'int').join(', ')})> ${n.name.text} = [&](${params.map((p) => 'int ' + p).join(', ')}) {`,
          level,
          semantic,
        )
        body(n.body, level + 1)
        if (cpp) row('};', level)
      } else throw new Error(`${id}: unsupported statement ${n.getText(sf)}`)
    }
    if (python) {
      row('import math', 0)
      row('import builtins', 0)
      row(`def ${root.name.text}(a, target):`, 0)
      body(root.body, 1)
    }
    if (cpp) {
      ;[
        '#include <vector>',
        '#include <algorithm>',
        '#include <cmath>',
        '#include <functional>',
        'double minValue(const std::vector<double>& a) { double v = 0; for (double x : a) v = std::min(v, x); return v; }',
        'double maxValue(const std::vector<double>& a) { double v = 0; for (double x : a) v = std::max(v, x); return v; }',
      ].forEach((x) => row(x, 0))
      row(`${sorting ? 'std::vector<double>' : 'int'} ${root.name.text}(std::vector<double>& a, double target) {`, 0)
      body(root.body, 1)
      row('}', 0)
    }
    if (java) {
      row('import java.util.*;', 0)
      row('class Algorithm {', 0)
      row('static double at(ArrayList<Double> a, int i) { return a.get(i); }', 1)
      row('static double minValue(ArrayList<Double> a) { return Math.min(0, a.isEmpty() ? 0 : Collections.min(a)); }', 1)
      row('static double maxValue(ArrayList<Double> a) { return Math.max(0, a.isEmpty() ? 0 : Collections.max(a)); }', 1)
      row(
        'static ArrayList<ArrayList<Double>> makeBuckets() { ArrayList<ArrayList<Double>> b = new ArrayList<>(); for (int i = 0; i < 10; i++) b.add(new ArrayList<>()); return b; }',
        1,
      )
      row(`static ${sorting ? 'ArrayList<Double>' : 'int'} ${root.name.text}(ArrayList<Double> a, double target) {`, 1)
      body(root.body, 2)
      row('}', 1)
      for (const fn of nested) {
        fn.parameters.forEach((p) => (types[p.name.text] = 'int'))
        row(
          `static ${fn.name.text === 'search' ? 'int' : 'void'} ${fn.name.text}(ArrayList<Double> a, double target, ${fn.parameters.map((p) => 'int ' + p.name.text).join(', ')}) {`,
          1,
          lineId(fn),
        )
        body(fn.body, 2)
        row('}', 1)
      }
      row('}', 0)
    }
    output[id] ??= {}
    output[id][lang] = rows
  }
}
fs.writeFileSync('src/studio/languages.generated.json', JSON.stringify(output, null, 2) + '\n')
console.log(`Generated Python, C++, and Java for ${Object.keys(output).length} kernels.`)
