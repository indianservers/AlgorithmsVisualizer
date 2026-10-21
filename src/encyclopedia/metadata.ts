import type { AlgorithmModule } from '../types'
import { encyclopediaFor } from './content'
import { algorithmPath } from '../utils/routing'
export const siteOrigin = 'https://algorithms.aimersociety.com'
export function articleMetadata(module: AlgorithmModule, learn = true) {
  const t = encyclopediaFor(module)
  const path = algorithmPath(module) + (learn ? '/learn' : '')
  const url = siteOrigin + path
  const title = `${module.name} ${learn ? '— Explanation, Examples & Complexity' : 'Visualization & Interactive Examples'} | AlgoDrishti`
  return {
    title,
    description: t.description,
    url,
    structured: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': learn ? 'TechArticle' : 'WebPage',
          '@id': url,
          name: title,
          headline: `${module.name}: explanation and examples`,
          description: t.description,
          url,
          inLanguage: 'en',
          isAccessibleForFree: true,
          learningResourceType: 'Tutorial',
          author: { '@type': 'Organization', name: 'AIMER Society', url: 'https://www.aimersociety.com/' },
          publisher: { '@type': 'Organization', name: 'AlgoDrishti', url: siteOrigin },
          about: { '@type': 'Thing', name: module.name },
          ...(learn ? { articleSection: module.category } : {}),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'AlgoDrishti', item: siteOrigin + '/' },
            { '@type': 'ListItem', position: 2, name: module.category, item: siteOrigin + algorithmPath(module).split('/').slice(0, 2).join('/') },
            { '@type': 'ListItem', position: 3, name: module.name, item: url },
          ],
        },
      ],
    },
  }
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
export function metadataHtml(meta: ReturnType<typeof articleMetadata>) {
  return `<title>${escapeHtml(meta.title)}</title><meta name="description" content="${escapeHtml(meta.description)}"><link rel="canonical" href="${escapeHtml(meta.url)}"><meta property="og:title" content="${escapeHtml(meta.title)}"><meta property="og:description" content="${escapeHtml(meta.description)}"><meta property="og:url" content="${escapeHtml(meta.url)}"><meta property="og:type" content="article"><meta name="twitter:card" content="summary"><script id="page-schema" type="application/ld+json">${JSON.stringify(meta.structured).replaceAll('<', '\\u003c')}</script>`
}
