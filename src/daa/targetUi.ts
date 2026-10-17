import type { Lesson } from './types'
import { getTargetProfile } from './targetProfiles'
const categories = new Set(['Analysis & Correctness', 'Divide and Conquer', 'Branch and Bound', 'Complexity Theory', 'DAA Extensions'])
export const isTargetUiLesson = (lesson: Lesson) => categories.has(lesson.category) && Boolean(getTargetProfile(lesson.id))
