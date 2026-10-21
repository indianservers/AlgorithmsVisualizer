import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { Globe, ChevronDown, Check, Search, X } from 'lucide-react'
import { languages, defaultLocale } from './languages'
import { changeLocale } from './loader'
import { tx, useLocaleRender } from './render'
import './localization.css'
export function LanguageSelector() {
  const locale = useLocaleRender(),
    { pathname } = useLocation(),
    id = useId()
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [highlight, setHighlight] = useState(0),
    [position, setPosition] = useState({ top: 60, left: 10 })
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null),
    search = useRef<HTMLInputElement>(null)
  const current = languages.find((language) => language.code === locale) ?? languages[0]
  const choices = languages.filter((language) =>
    `${language.nativeName} ${language.englishName} ${language.code}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  )
  useEffect(() => {
    if (!open) return
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect()
      if (rect)
        setPosition({
          top: Math.min(rect.bottom + 8, window.innerHeight - 200),
          left: Math.max(10, Math.min(rect.right - 340, window.innerWidth - Math.min(340, window.innerWidth - 20) - 10)),
        })
    }
    place()
    search.current?.focus()
    const close = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', place)
    }
  }, [open])
  const highlightedCode = choices[highlight]?.code
  useEffect(() => {
    if (open) document.getElementById(`${id}-${highlightedCode}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, highlightedCode, id])
  const select = async (code: string) => {
    setBusy(true)
    setError('')
    try {
      await changeLocale(code, pathname)
      setOpen(false)
      setQuery('')
      trigger.current?.focus({ preventScroll: true })
    } catch {
      setError(tx('Language resources could not load. Please try again.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="language-selector">
      <button
        ref={trigger}
        className="language-trigger"
        aria-label={`${tx('Language')}: ${current.nativeName}`}
        title={current.nativeName}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setOpen(!open)
          setQuery('')
          setHighlight(0)
        }}
      >
        <Globe size={17} />
        <span>{current.nativeName}</span>
        <ChevronDown size={13} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={panel} id={id} className="language-popover" role="dialog" aria-label={tx('Choose language')} style={position} dir={current.direction}>
            <header>
              <strong>{tx('Choose language')}</strong>
              <button
                aria-label={tx('Close')}
                onClick={() => {
                  setOpen(false)
                  trigger.current?.focus()
                }}
              >
                <X size={18} />
              </button>
            </header>
            <label className="language-search">
              <Search size={16} />
              <input
                ref={search}
                type="search"
                role="combobox"
                aria-label={tx('Search languages')}
                aria-expanded="true"
                aria-controls={id + '-options'}
                aria-activedescendant={choices[highlight] ? `${id}-${choices[highlight].code}` : undefined}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlight(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlight((i) => Math.min(choices.length - 1, i + 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlight((i) => Math.max(0, i - 1))
                  }
                  if (e.key === 'Enter' && choices[highlight]) {
                    e.preventDefault()
                    void select(choices[highlight].code)
                  }
                  if (e.key === 'Escape') {
                    setOpen(false)
                    trigger.current?.focus()
                  }
                }}
                placeholder={tx('Search languages')}
              />
            </label>
            <div role="listbox" id={id + '-options'} aria-label={tx('Available languages')} className="language-options">
              {['Default', 'India', 'International'].map((region) => {
                const items = choices.filter((language) => language.region === region)
                return (
                  !!items.length && (
                    <div key={region} role="group" aria-label={tx(region)}>
                      <h3>{tx(region)}</h3>
                      {items.map((language) => (
                        <button
                          key={language.code}
                          id={`${id}-${language.code}`}
                          type="button"
                          role="option"
                          aria-selected={language.code === locale}
                          data-highlighted={choices[highlight]?.code === language.code}
                          disabled={busy}
                          onClick={() => void select(language.code)}
                        >
                          <span>
                            <b lang={language.code} dir={language.direction}>
                              {language.nativeName}
                            </b>
                            <small>{language.englishName}</small>
                          </span>
                          {language.code === (locale || defaultLocale) && <Check size={17} />}
                        </button>
                      ))}
                    </div>
                  )
                )
              })}
              {!choices.length && <p>{tx('No languages found')}</p>}
            </div>
            <p className="language-status" role="status">
              {busy ? tx('Loading language…') : error}
            </p>
          </div>,
          document.body,
        )}
    </div>
  )
}
