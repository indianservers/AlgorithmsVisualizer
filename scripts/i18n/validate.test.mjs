import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resourceErrors } from './validate.mjs'
test('rejects malformed, obsolete and placeholder-corrupt target dictionaries', () => {
  const source = { a: 'Step {{count}}', b: 'Save' }
  assert.deepEqual(resourceErrors(source, { a: 'Шаг {{count}}', b: 'Сохранить' }), [])
  assert.ok(resourceErrors(source, { a: 'Шаг {{wrong}}' }).some((e) => e.includes('Interpolation mismatch')))
  assert.ok(resourceErrors(source, { unknown: 'x' }).some((e) => e.includes('Obsolete')))
  assert.ok(resourceErrors(source, { b: 7 }).some((e) => e.includes('Invalid')))
  assert.ok(resourceErrors(source, []).length)
  assert.ok(resourceErrors({ c: 'Time O(n log n)' }, { c: 'Time O(n)' }).some((e) => e.includes('Complexity notation mismatch')))
})
