import type { AlgorithmModule } from '../types'
import { AlgorithmArticle } from '../encyclopedia/AlgorithmArticle'
export function DaaTheoryView({ module }: { module: AlgorithmModule }) {
  return <AlgorithmArticle module={module} />
}
