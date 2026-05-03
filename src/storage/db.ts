import Dexie, { type Table } from 'dexie'
import type { SavedExperiment } from '../types'

class AlgoDrishtiDb extends Dexie {
  experiments!: Table<SavedExperiment, string>

  constructor() {
    super('algodrishti-local')
    this.version(1).stores({
      experiments: 'id, algorithmId, createdAt',
    })
  }
}

export const db = new AlgoDrishtiDb()
