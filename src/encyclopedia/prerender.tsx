import { MemoryRouter } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { allModules } from '../algorithms'
import { AlgorithmArticle } from './AlgorithmArticle'
import { articleMetadata, metadataHtml, escapeHtml } from './metadata'
import { algorithmPath } from '../utils/routing'
import { categoryPages } from '../data/catalog'

export function buildStaticPages() {
  const pages: { path: string; head: string; body: string }[] = []
  for (const module of allModules) {
    const base = algorithmPath(module)
    const article = renderToStaticMarkup(
      <MemoryRouter initialEntries={[base + '/learn']}>
        <AlgorithmArticle module={module} />
      </MemoryRouter>,
    )
    const header = `<header class="wiki-site-header"><a class="wiki-brand" href="/">AlgoDrishti</a><a href="/encyclopedia">Algorithm encyclopedia</a></header>`
    pages.push({
      path: base + '/learn',
      head: metadataHtml(articleMetadata(module)),
      body: `<main class="wiki-page">${header}<nav class="wiki-breadcrumb"><a href="${base}">Open visualization</a></nav>${article}</main>`,
    })
    pages.push({
      path: base,
      head: metadataHtml(articleMetadata(module, false)),
      body: `<main class="wiki-page">${header}<p><a href="${base}/learn">Read the complete ${escapeHtml(module.name)} guide</a></p>${article}<noscript>Interactive playback needs JavaScript. The complete theory remains available above.</noscript></main>`,
    })
  }
  const directory = Object.entries(categoryPages)
    .map(
      ([category, page]) =>
        `<section><h2>${escapeHtml(category)}</h2><p>${escapeHtml(page.subtitle)}</p><ul>${allModules
          .filter((m) => m.category === category)
          .map((m) => `<li><a href="${algorithmPath(m)}/learn">${escapeHtml(m.name)}</a> — ${escapeHtml(m.summary)}</li>`)
          .join('')}</ul></section>`,
    )
    .join('')
  const head =
    '<title>Algorithm Encyclopedia — Theory &amp; Examples | AlgoDrishti</title><meta name="description" content="Browse definitions, purposes, worked examples, complexity and implementations for every AlgoDrishti algorithm."><link rel="canonical" href="https://algorithms.aimersociety.com/encyclopedia">'
  pages.push({ path: '/encyclopedia', head, body: `<main class="wiki-page"><h1>Algorithm encyclopedia</h1>${directory}</main>` })
  for (const [category, page] of Object.entries(categoryPages))
    pages.push({
      path: '/' + page.slug,
      head: `<title>${escapeHtml(category)} Algorithms &amp; Theory | AlgoDrishti</title><meta name="description" content="${escapeHtml(page.subtitle)}"><link rel="canonical" href="https://algorithms.aimersociety.com/${page.slug}">`,
      body: `<main class="wiki-page"><h1>${escapeHtml(category)}</h1><p>${escapeHtml(page.subtitle)}</p><section>${directory
        .split('<section>')
        .filter((x) => x.startsWith('<h2>' + escapeHtml(category) + '</h2>'))
        .join('')}</main>`,
    })
  return { pages, directory }
}
