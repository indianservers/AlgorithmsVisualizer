// @localized-render
import { useLocaleRender } from '../i18n/render'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
/** Follow an article's Edit input link after the destination's lazy editor is ready. */
export function InputNavigation() {
  useLocaleRender()

  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash !== '#problem-input') return
    let timer: ReturnType<typeof setTimeout>,
      attempts = 0
    const reveal = () => {
      const panels = Array.from(
        document.querySelectorAll<HTMLElement>('.studio-input,.tuv-problem-input,.daa-input-card,.workbench-input,.learning-input-panel,.ls-editor,.ss-input'),
      )
      for (const panel of panels) {
        for (let parent: HTMLElement | null = panel; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true
        const field = Array.from(panel.querySelectorAll<HTMLElement>('textarea,input:not([type="checkbox"]),select')).find(
          (el) => el.getClientRects().length && !el.closest('details:not([open])') && !el.matches(':disabled'),
        )
        if (field) {
          panel.scrollIntoView({ block: 'start' })
          field.focus({ preventScroll: true })
          return
        }
      }
      if (attempts++ < 60) timer = setTimeout(reveal, 50)
    }
    timer = setTimeout(reveal, 50)
    return () => clearTimeout(timer)
  }, [pathname, hash])
  return null
}
