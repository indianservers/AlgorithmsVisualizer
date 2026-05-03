import { useEffect, useMemo, useState } from 'react'
import type { AlgorithmModule } from '../types'

type CommandPaletteProps = {
  algorithms: AlgorithmModule[]
  close: () => void
  copyLink: () => void
  open: boolean
  reset: () => void
  run: () => void
  switchTheme: () => void
  chooseAlgorithm: (id: string) => void
}

export function CommandPalette({ algorithms, chooseAlgorithm, close, copyLink, open, reset, run, switchTheme }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const commands = useMemo(
    () => [
      { id: 'run', label: 'Run or pause timeline', action: run },
      { id: 'reset', label: 'Reset animation', action: reset },
      { id: 'theme', label: 'Switch theme', action: switchTheme },
      { id: 'copy-link', label: 'Copy algorithm link', action: copyLink },
      ...algorithms.map((algorithm) => ({ id: algorithm.id, label: `Open ${algorithm.name}`, action: () => chooseAlgorithm(algorithm.id) })),
    ],
    [algorithms, chooseAlgorithm, copyLink, reset, run, switchTheme],
  )
  const visible = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase())).slice(0, 12)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close, open])

  if (!open) return null

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={close}>
      <section className="command-palette" role="dialog" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <input
          autoFocus
          aria-label="Search commands and algorithms"
          placeholder="Search commands or algorithms"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div>
          {visible.length ? (
            visible.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={() => {
                  command.action()
                  close()
                }}
              >
                {command.label}
              </button>
            ))
          ) : (
            <p>No command matches that search.</p>
          )}
        </div>
      </section>
    </div>
  )
}
