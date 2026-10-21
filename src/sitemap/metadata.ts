import { sitemapCopy, sitemapSchema, origin, type SitemapTranslate } from './catalog'
import { sitemapPath } from './routes'
export function sitemapMetadata(locale: string, translate: SitemapTranslate) {
  const path = sitemapPath(locale)
  return {
    title: `${translate(sitemapCopy.title)} | AlgoDrishti`,
    description: translate(sitemapCopy.intro),
    url: origin + path,
    structured: sitemapSchema(locale, translate, path),
  }
}
