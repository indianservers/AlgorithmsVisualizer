import { sitemapLocaleFromPath } from '../sitemap/routes'
import { useLocaleRender } from './render'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { storedLocale } from './languages'
import { changeLocale, loadRouteResources, applyDocumentLanguage } from './loader'
import { attachAccountLocalization } from './widget'
let restored = false
export function LocalizationRuntime() {
  const { pathname } = useLocation()
  const locale = useLocaleRender()
  useEffect(() => {
    const urlLocale = sitemapLocaleFromPath(pathname)
    if (!restored) {
      restored = true
      applyDocumentLanguage('en-IN')
      void changeLocale(urlLocale ?? storedLocale(), pathname, !!urlLocale).catch(() => applyDocumentLanguage('en-IN'))
    } else if (urlLocale && urlLocale !== locale) {
      void changeLocale(urlLocale, pathname, true).catch(() => {})
    } else
      void loadRouteResources(pathname).catch(() => {
        /* Unavailable keys retain their exact English source. */
      })
  }, [pathname, locale])
  useEffect(() => attachAccountLocalization(), [])
  return null
}
