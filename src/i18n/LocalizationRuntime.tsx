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
    if (!restored) {
      restored = true
      applyDocumentLanguage('en-IN')
      void changeLocale(storedLocale(), pathname, false).catch(() => applyDocumentLanguage('en-IN'))
    } else
      void loadRouteResources(pathname).catch(() => {
        /* Unavailable keys retain their exact English source. */
      })
  }, [pathname, locale])
  useEffect(() => attachAccountLocalization(), [])
  return null
}
