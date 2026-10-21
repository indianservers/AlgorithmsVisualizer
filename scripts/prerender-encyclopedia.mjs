import { createServer } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { buildStaticPages } = await server.ssrLoadModule('/src/encyclopedia/prerender.tsx')
  const { pages, directory } = buildStaticPages()
  const template = await readFile('dist/index.html', 'utf8')
  const withPage = (head, body) =>
    template
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta name="description"[^>]*>/, '')
      .replace('</head>', head + '</head>')
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  for (const page of pages) {
    const file = path.join('dist', page.path.slice(1) + '.html')
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, withPage(page.head, page.body))
  }
  await writeFile(
    'dist/index.html',
    template.replace(
      '<div id="root"></div>',
      `<div id="root"><main class="wiki-page"><h1>AlgoDrishti — Algorithms and Data Structures</h1><p>Learn with interactive visualizations and detailed theory.</p><a href="/encyclopedia">Browse the encyclopedia</a>${directory}</main></div>`,
    ),
  )
  const urls = ['/', '/encyclopedia', ...pages.filter((p) => p.path != '/encyclopedia').map((p) => p.path)]
  await writeFile(
    'dist/sitemap.xml',
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      [...new Set(urls)].map((p) => `<url><loc>https://algorithms.aimersociety.com${p}</loc></url>`).join('') +
      '</urlset>',
  )
  await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://algorithms.aimersociety.com/sitemap.xml\n')
  console.log(`Generated ${pages.length} searchable HTML pages, sitemap.xml and robots.txt.`)
} finally {
  await server.close()
}
