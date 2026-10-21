import { useEffect, useRef, useState } from 'react'
import { PencilLine } from 'lucide-react'

export function InputAccessButton({ onOpen }: { onOpen?: () => void }) {
  const [request, setRequest] = useState(0),
    button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!request) return
    let timer: ReturnType<typeof setTimeout>,
      attempts = 0
    const reveal = () => {
      const root = button.current?.closest('.workspace, .lesson-surface, .ss-main') ?? document
      const panel =
        root.querySelector<HTMLElement>('.tuv-problem-input, .studio-input, .daa-input-card, .workbench-input, .ss-input') ??
        root.querySelector<HTMLElement>('.learning-input-panel, .ls-editor, .gr-fields, .dp-fields, .bt-fields')
      if (!panel) {
        if (attempts++ < 40) timer = setTimeout(reveal, 50)
        return
      }
      for (let ancestor: HTMLElement | null = panel; ancestor; ancestor = ancestor.parentElement)
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true
      const visible = (selector: string) =>
        Array.from(panel.querySelectorAll<HTMLElement>(selector)).find(
          (element) => element.getClientRects().length > 0 && !element.closest('details:not([open])') && !element.matches(':disabled'),
        )
      const field = visible('textarea') ?? visible('input:not([type="checkbox"])') ?? visible('select')
      if (!field) {
        if (attempts++ < 40) timer = setTimeout(reveal, 50)
        return
      }
      panel.scrollIntoView({ block: 'start', behavior: 'instant' })
      field.focus({ preventScroll: true })
      if (document.activeElement !== field && attempts++ < 40) timer = setTimeout(reveal, 50)
    }
    timer = setTimeout(reveal, 0)
    return () => clearTimeout(timer)
  }, [request])
  return (
    <button
      ref={button}
      type="button"
      className="input-access-button"
      onClick={() => {
        onOpen?.()
        setRequest((v) => v + 1)
      }}
    >
      <PencilLine size={16} />
      Edit input
    </button>
  )
}
