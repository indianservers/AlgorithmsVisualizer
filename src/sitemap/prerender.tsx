import { renderToStaticMarkup } from 'react-dom/server'
import { sourceKey } from '../i18n/keys'
import { escapeHtml } from '../encyclopedia/metadata'
import { SiteMapContent } from './SiteMap'
import { sitemapCatalog, sitemapCopy, sitemapGroups, origin } from './catalog'
import { sitemapLocales, sitemapPath } from './routes'
import { sitemapMetadata } from './metadata'

export function buildSitemapAssets(dictionaries: Record<string, Record<string, string>>) {
  const pages = [],
    files = []
  let home = ''
  for (const locale of sitemapLocales) {
    const resources = dictionaries[locale] ?? {}
    const t = (source: string) => resources[sourceKey(source)] ?? source
    const meta = sitemapMetadata(locale, t)
    const alternates = [...sitemapLocales.map((code) => ({ code, href: origin + sitemapPath(code) })), { code: 'x-default', href: origin + '/sitemap' }]
    const head = `<title>${escapeHtml(meta.title)}</title><meta name="description" content="${escapeHtml(meta.description)}"><link rel="canonical" href="${meta.url}">${alternates.map((a) => `<link rel="alternate" hreflang="${a.code}" href="${a.href}">`).join('')}<link rel="alternate" type="application/json" href="${origin}/sitemaps/${locale}.json"><meta property="og:title" content="${escapeHtml(meta.title)}"><meta property="og:description" content="${escapeHtml(meta.description)}"><meta property="og:url" content="${meta.url}"><script type="application/ld+json">${JSON.stringify(meta.structured).replaceAll('<', '\\u003c')}</script>`
    const body = renderToStaticMarkup(
      <main className="site-map-page">
        <a className="site-map-brand" href="/">
          AlgoDrishti
        </a>
        <SiteMapContent locale={locale} translate={t} />
      </main>,
    )
    pages.push({ path: sitemapPath(locale), head, body, locale })
    const catalog = JSON.stringify(sitemapCatalog(locale, t), null, 2) + '\n'
    files.push({ path: `/sitemaps/${locale}.json`, text: catalog })
    if (locale === 'en-IN') {
      home = renderToStaticMarkup(<SiteMapContent locale="en-IN" translate={t} compact />)
      files.push({ path: '/sitemap.json', text: catalog })
    }
    const readingGuide =
      `# AlgoDrishti — ${t(sitemapCopy.title)}\n\n> ${t(sitemapCopy.intro)}\n\n${t(sitemapCopy.fallback)}\n\n- [${t(sitemapCopy.directory)}](${meta.url})\n- [${t(sitemapCopy.json)}](${origin}/sitemaps/${locale}.json)\n\n` +
      sitemapGroups
        .map(
          (group) =>
            `## ${t(group.name)}\n\n${t(group.description)}\n\n` +
            group.lessons
              .map(
                (lesson) =>
                  `- [${t(lesson.name)}](${origin}${lesson.theoryPath}): ${t(lesson.description)} [${t(sitemapCopy.visualization)}](${origin}${lesson.path})`,
              )
              .join('\n'),
        )
        .join('\n\n')
    files.push({ path: `/sitemaps/${locale}.txt`, text: readingGuide + '\n' })
    if (locale === 'en-IN')
      files.push({
        path: '/llms.txt',
        text:
          readingGuide +
          '\n\n## Other directory languages\n\n' +
          sitemapLocales
            .filter((code) => code !== 'en-IN')
            .map((code) => `- [${code}](${origin}${sitemapPath(code)})`)
            .join('\n') +
          '\n',
      })
  }
  return { pages, files, home }
}
