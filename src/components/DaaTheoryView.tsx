// @localized-render
import { useLocaleRender } from '../i18n/render'
import type { AlgorithmModule } from '../types'
import { AlgorithmArticle } from '../encyclopedia/AlgorithmArticle'
export function DaaTheoryView({ module }: { module: AlgorithmModule }) {
  useLocaleRender()

  return <AlgorithmArticle module={module} />
}
