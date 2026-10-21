import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LogIn, X } from 'lucide-react'
import './login-invitation.css'

const visitKey = 'algodrishti-login-visits'
type Visits = { path: string; count: number; dismissed: number }
function readVisits(): Visits {
  try {
    const value = JSON.parse(sessionStorage.getItem(visitKey) || 'null')
    if (value && typeof value.path === 'string' && Number.isSafeInteger(value.count) && value.count >= 0)
      return { ...value, dismissed: Number(value.dismissed) || 0 }
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  return { path: '', count: 0, dismissed: 0 }
}
function saveVisits(value: Visits) {
  try {
    sessionStorage.setItem(visitKey, JSON.stringify(value))
  } catch {
    /* Browsing stays available. */
  }
}

/** A route invitation never opens the account dialog or interrupts learning. */
export function LoginInvitation() {
  const { pathname } = useLocation()
  const [shownPath, setShownPath] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(() => !!document.getElementById('account-trigger')?.classList.contains('is-signed-in'))
  useEffect(() => {
    const onAccount = (event: Event) => {
      setSignedIn(!!(event as CustomEvent).detail)
      setShownPath(null)
    }
    const onOpen = () => setShownPath(null)
    window.addEventListener('aimer-account', onAccount)
    window.addEventListener('aimer-account-open', onOpen)
    return () => {
      window.removeEventListener('aimer-account', onAccount)
      window.removeEventListener('aimer-account-open', onOpen)
    }
  }, [])
  useEffect(() => {
    if (signedIn) return
    const visits = readVisits()
    if (visits.path !== pathname) {
      visits.path = pathname
      visits.count++
      saveVisits(visits)
    }
    if (visits.count % 2 !== 0 || visits.dismissed === visits.count) return
    const timer = window.setTimeout(() => {
      if (!document.querySelector('dialog[open]') && !document.getElementById('account-trigger')?.classList.contains('is-signed-in')) setShownPath(pathname)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [pathname, signedIn])
  const dismiss = () => {
    const visits = readVisits()
    saveVisits({ ...visits, dismissed: visits.count })
    setShownPath(null)
  }
  if (signedIn || shownPath !== pathname) return null
  return (
    <aside className="login-invitation" aria-label="Optional login" role="region">
      <button className="login-invitation-close" aria-label="Dismiss login invitation" onClick={dismiss}>
        <X size={18} />
      </button>
      <span className="login-invitation-icon" aria-hidden="true">
        <LogIn size={23} />
      </span>
      <div>
        <h2>Enjoying exploring?</h2>
        <p>Log in to continue with your AIMER account, or keep learning as a guest.</p>
      </div>
      <div className="login-invitation-actions">
        <button
          className="login-invitation-primary"
          onClick={() => {
            dismiss()
            document.getElementById('account-trigger')?.click()
          }}
        >
          Log in to continue
        </button>
        <button onClick={dismiss}>Continue as guest</button>
      </div>
    </aside>
  )
}
