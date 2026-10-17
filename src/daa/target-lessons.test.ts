import { describe, expect, it } from 'vitest'
import { daaLessons } from './catalog'
import { targetProfiles } from './targetProfiles'
import { isTargetUiLesson } from './targetUi'
import { executeLesson } from './types'

describe('target UI lesson coverage', () => {
  const lessons = daaLessons.filter(isTargetUiLesson)
  it('maps all 45 targets to unique profiles', () => {
    expect(lessons).toHaveLength(45)
    expect(Object.keys(targetProfiles)).toHaveLength(45)
    expect(new Set(Object.values(targetProfiles).map((p) => p.number)).size).toBe(45)
    for (const lesson of lessons) expect(targetProfiles[lesson.id], lesson.id).toBeDefined()
  })
  it('computes every runnable default example', () => {
    for (const lesson of lessons.filter((l) => l.run)) {
      const run = executeLesson(lesson, structuredClone(lesson.defaultInput!))
      expect(run.status, lesson.id).toBe('complete')
      expect(run.steps.length, lesson.id).toBeGreaterThan(1)
    }
  })
  it('keeps correctness-sensitive reference results', () => {
    const result = (id: string) => {
      const l = lessons.find((x) => x.id === id)!
      return executeLesson(l, structuredClone(l.defaultInput!)).result as Record<string, unknown>
    }
    expect(result('edmonds-karp').flow).toBe(5)
    expect(result('counting-inversions').inversions).toBe(3)
    expect(result('bin-packing').bins).toHaveLength(2)
    expect(result('suffix-array').suffixArray).toEqual([5, 3, 1, 0, 4, 2])
  })
})
