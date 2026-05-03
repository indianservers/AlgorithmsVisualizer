import type { AlgorithmCategory } from '../types'
import { categories } from '../data/catalog'
import { categoryIcon } from './navigation'

type MobileCategoryTabsProps = {
  activeCategory: AlgorithmCategory
  chooseCategory: (category: AlgorithmCategory) => void
}

export function MobileCategoryTabs({ activeCategory, chooseCategory }: MobileCategoryTabsProps) {
  return (
    <nav className="mobile-category-tabs" aria-label="Mobile categories">
      {categories.map((category) => (
        <button className={category === activeCategory ? 'active' : ''} key={category} type="button" onClick={() => chooseCategory(category)}>
          {categoryIcon(category, 14)}
          {category}
        </button>
      ))}
    </nav>
  )
}
