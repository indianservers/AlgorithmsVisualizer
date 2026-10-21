// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { allModules } from '../algorithms'
import { categoryPages } from '../data/catalog'
import { articleMetadata, siteOrigin } from './metadata'

export function PageMetadata() {
  const locale = useLocaleRender()

  const { pathname } = useLocation()
  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean)
    const category = Object.entries(categoryPages).find(([, page]) => page.slug === parts[0])
    const module = allModules.find((m) => m.id === parts[1] && m.category === category?.[0])
    const learn = parts[2] === 'learn'
    const meta = module
      ? articleMetadata(module, learn)
      : {
          title:
            pathname === '/encyclopedia'
              ? 'Algorithm Encyclopedia — Theory & Examples | AlgoDrishti'
              : category
                ? `${category[0]} Algorithms & Theory | AlgoDrishti`
                : 'AlgoDrishti — Interactive Algorithms & Data Structures',
          description: 'Explore algorithms and data structures with definitions, theory, worked examples, complexity analysis and interactive visualizations.',
          url: siteOrigin + pathname,
          structured: null,
        }
    document.title = tx(meta.title, 'algorithms')
    for (const [selector, attribute, value] of [
      ['meta[name="description"]', 'content', meta.description],
      ['link[rel="canonical"]', 'href', meta.url],
      ['meta[property="og:title"]', 'content', meta.title],
      ['meta[property="og:description"]', 'content', meta.description],
      ['meta[property="og:url"]', 'content', meta.url],
      ['meta[property="og:type"]', 'content', module && learn ? 'article' : 'website'],
      ['meta[name="twitter:card"]', 'content', 'summary'],
    ] as const) {
      let node = document.head.querySelector(selector)
      if (!node) {
        node = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
        const match = selector.match(/\[(name|property|rel)="([^"]+)"\]/)!
        node.setAttribute(match[1], match[2])
        document.head.append(node)
      }
      node.setAttribute(attribute, value)
    }
    let schema = document.getElementById('page-schema')
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'page-schema'
      schema.setAttribute('type', 'application/ld+json')
      document.head.append(schema)
    }
    schema.textContent = JSON.stringify(meta.structured ?? {})
    let robots = document.head.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.append(robots)
    }
    robots.setAttribute(
      'content',
      (parts.length > 1 && !module) || (parts.length === 1 && !category && pathname !== '/encyclopedia') ? 'noindex,follow' : 'index,follow',
    )
  }, [pathname, locale])
  return null
}
