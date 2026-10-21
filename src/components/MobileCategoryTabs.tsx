// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import type { AlgorithmCategory } from '../types'
import { categories } from '../data/catalog'
import { categoryIcon } from './navigation'

type MobileCategoryTabsProps = {
  activeCategory: AlgorithmCategory
  chooseCategory: (category: AlgorithmCategory) => void
}

export function MobileCategoryTabs({ activeCategory, chooseCategory }: MobileCategoryTabsProps) {
  useLocaleRender()

  return (
    <nav className="mobile-category-tabs" aria-label={tx('Mobile categories', 'common')}>
      {tx(
        categories.map((category) => (
          <button className={category === activeCategory ? 'active' : ''} key={category} type="button" onClick={() => chooseCategory(category)}>
            {tx(categoryIcon(category, 14), 'common')}
            {tx(category, 'common')}
          </button>
        )),
        'common',
      )}
    </nav>
  )
}
