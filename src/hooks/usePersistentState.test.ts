import { describe, expect, it } from 'vitest'
import { parsePersistentValue, persistentBoolean, persistentNumber, persistentString } from './usePersistentState'

describe('persistent state parsing', () => {
  it('parses JSON values', () => {
    expect(parsePersistentValue<number[]>('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('falls back to legacy raw string values', () => {
    expect(parsePersistentValue<string>('comfortable')).toBe('comfortable')
  })

  it('supports explicit primitive serializers for existing localStorage keys', () => {
    expect(persistentNumber.deserialize('31')).toBe(31)
    expect(persistentBoolean.deserialize('true')).toBe(true)
    expect(persistentString.deserialize('dark')).toBe('dark')
  })
})
