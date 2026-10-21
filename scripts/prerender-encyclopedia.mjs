import { createServer } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { buildStaticPages } = await server.ssrLoadModule('/src/encyclopedia/prerender.tsx')
  const { buildSitemapAssets } = await server.ssrLoadModule('/src/sitemap/prerender.tsx')
  const { pages } = buildStaticPages()
  const { sitemapLocales } = await server.ssrLoadModule('/src/sitemap/routes.ts')
  const { namespaces } = await server.ssrLoadModule('/src/i18n/keys.ts')
  const resources = Object.fromEntries(
    await Promise.all(
      sitemapLocales.map(async (locale) => [
        locale,
        Object.assign({}, ...(await Promise.all(namespaces.map(async (ns) => JSON.parse(await readFile(`src/i18n/locales/${locale}/${ns}.json`, 'utf8')))))),
      ]),
    ),
  )
  const siteMap = buildSitemapAssets(resources)
  const template = await readFile('dist/index.html', 'utf8')
  const withPage = (head, body) =>
    template
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+name="description"[^>]*>/, '')
      .replace('</head>', head + '</head>')
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  for (const page of pages) {
    const file = path.join('dist', page.path.slice(1) + '.html')
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, withPage(page.head, page.body))
  }
  for (const page of siteMap.pages) {
    const file = path.join('dist', page.path.slice(1) + '.html')
    await mkdir(path.dirname(file), { recursive: true })
    // The directory is real HTML; it never depends on a bot executing the application.
    const staticTemplate = template
      .replace(/<script\b[\s\S]*?<\/script>/g, '')
      .replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+name="description"[^>]*>/, '')
      .replace(/<html[^>]*>/, `<html lang="${page.locale}" dir="${page.locale === 'ar' ? 'rtl' : 'ltr'}">`)
      .replace('</head>', page.head + '</head>')
      .replace('<div id="root"></div>', `<div id="root">${page.body}</div>`)
      .replace('</body>', `<script>try{localStorage.setItem('algodrishti-language',${JSON.stringify(page.locale)})}catch{}</script></body>`)
    await writeFile(file, staticTemplate)
  }
  for (const file of siteMap.files) {
    const target = path.join('dist', file.path.slice(1))
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, file.text)
  }
  await writeFile(
    'dist/index.html',
    template
      .replace(
        '<div id="root"></div>',
        `<div id="root"><main class="wiki-page"><h1>AlgoDrishti — Algorithms and Data Structures</h1><p>Learn with interactive visualizations and detailed theory.</p><a href="/encyclopedia">Browse the encyclopedia</a>${siteMap.home}</main></div>`,
      )
      .replace(
        '</head>',
        '<link rel="canonical" href="https://algorithms.aimersociety.com/"><link rel="alternate" type="application/json" href="/sitemap.json"></head>',
      ),
  )
  const urls = ['/', ...pages.map((p) => p.path), ...siteMap.pages.map((p) => p.path)]
  const alternateLinks =
    siteMap.pages.map((p) => `<xhtml:link rel="alternate" hreflang="${p.locale}" href="https://algorithms.aimersociety.com${p.path}"/>`).join('') +
    '<xhtml:link rel="alternate" hreflang="x-default" href="https://algorithms.aimersociety.com/sitemap"/>'
  await writeFile(
    'dist/sitemap.xml',
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
      [...new Set(urls)]
        .map((p) => `<url><loc>https://algorithms.aimersociety.com${p}</loc>${siteMap.pages.some((page) => page.path === p) ? alternateLinks : ''}</url>`)
        .join('') +
      '</urlset>',
  )
  await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://algorithms.aimersociety.com/sitemap.xml\n')
  console.log(
    `Generated ${pages.length + siteMap.pages.length} searchable HTML pages, multilingual sitemap catalogs, AI reading guides, sitemap.xml and robots.txt.`,
  )
} finally {
  await server.close()
}
