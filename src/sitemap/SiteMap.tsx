import { useParams } from 'react-router-dom'
import { tx, useLocaleRender } from '../i18n/render'
import { languages } from '../i18n/languages'
import { sitemapCopy as copy, sitemapGroups, sitemapSchema, type SitemapTranslate } from './catalog'
import { sitemapLocales, sitemapPath } from './routes'
import './sitemap.css'

/** Shared visible markup for the home footer, full directory and no-JavaScript HTML. */
export function SiteMapContent({ locale, translate, compact = false }: { locale: string; translate: SitemapTranslate; compact?: boolean }) {
  const t = translate
  const language = (source: string) => (t(source) === source ? 'en-IN' : locale)
  return (
    <section
      className={`site-map ${compact ? 'site-map-compact' : 'site-map-full'}`}
      id="topic-map"
      lang={locale}
      dir={locale === 'ar' || locale === 'ur' ? 'rtl' : 'ltr'}
      aria-label={t(copy.title)}
    >
      <header>
        {compact ? <h2>{t(copy.title)}</h2> : <h1>{t(copy.title)}</h1>}
        <p>{t(copy.intro)}</p>
        <p className="site-map-note">{t(copy.fallback)}</p>
      </header>
      <nav className="site-map-languages" aria-label={t(copy.languages)}>
        {sitemapLocales.map((code) => {
          const entry = languages.find((item) => item.code === code)!
          return (
            <a key={code} href={sitemapPath(code)} hrefLang={code} lang={code} dir={entry.direction} aria-current={code === locale ? 'page' : undefined}>
              {entry.nativeName}
            </a>
          )
        })}
      </nav>
      <div className="site-map-groups">
        {sitemapGroups.map((group) => (
          <details key={group.id} open={!compact}>
            <summary>
              <strong lang={language(group.name)}>{t(group.name)}</strong>
              <span lang={language(group.description)} dir="auto">
                {t(group.description)}
              </span>
            </summary>
            <a className="site-map-category" href={group.path} lang={language(group.name)}>
              {t(group.name)}
            </a>
            <ul>
              {group.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <a className="site-map-topic" href={lesson.path} lang={language(lesson.name)}>
                    {t(lesson.name)}
                  </a>
                  <p lang={language(lesson.description)} dir="auto">
                    {t(lesson.description)}
                  </p>
                  <a href={lesson.theoryPath}>{t(copy.theory)}</a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <nav className="site-map-resources" aria-label={t(copy.directory)}>
        <a href="/">{t(copy.home)}</a>
        <a href={sitemapPath(sitemapLocales.find((code) => code === locale) ?? 'en-IN')}>{t(copy.directory)}</a>
        <a href="/sitemap.xml">{t(copy.xml)}</a>
        <a href={`/sitemaps/${sitemapLocales.find((code) => code === locale) ?? 'en-IN'}.json`}>{t(copy.json)}</a>
        <a href="/llms.txt">{t(copy.agents)}</a>
      </nav>
      {compact && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sitemapSchema(locale, t, '/')).replaceAll('<', '\\u003c') }} />
      )}
    </section>
  )
}

export function HomeSiteMap() {
  const locale = useLocaleRender()
  return <SiteMapContent locale={locale} translate={(source) => tx(source)} compact />
}

/** Vite/SPA fallback for the same directory that production also serves as static HTML. */
export function SitemapPage() {
  const active = useLocaleRender()
  const { locale: requested } = useParams()
  const locale = requested ?? 'en-IN'
  if (!sitemapLocales.some((code) => code === locale))
    return (
      <main className="site-map-page">
        <a href="/sitemap">{tx(copy.directory)}</a>
      </main>
    )
  return (
    <main className="site-map-page" data-active-locale={active}>
      <a className="site-map-brand" href="/">
        {tx('AlgoDrishti')}
      </a>
      <SiteMapContent locale={locale} translate={(source) => tx(source)} />
    </main>
  )
}
