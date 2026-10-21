import { LanguageSelector } from '../i18n/LanguageSelector'
// @localized-render
import { useLocaleRender } from '../i18n/render'
import { useLayoutEffect, useRef } from 'react'

/** The shared widget owns its DOM; this slot preserves it across React routes. */
export function AccountControl() {
  useLocaleRender()

  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const trigger = document.getElementById('account-trigger')
    if (trigger) slot.current?.append(trigger)
    return () => {
      if (trigger) document.getElementById('account-parking')?.append(trigger)
    }
  }, [])
  return (
    <div className="aimer-account-controls">
      <LanguageSelector />
      <div ref={slot} className="aimer-account-slot" />
    </div>
  )
}
