import { useEffect, useState, type ReactNode } from 'react'

/** Keep secondary panels available on phones without crowding the visualization. */
export function MobileDisclosure({
  children,
  className,
  title,
  defaultOpen = false,
}: {
  children: ReactNode
  className: string
  title: string
  defaultOpen?: boolean
}) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    const update = () => setMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return mobile ? (
    <details className={`${className} mobile-disclosure`} open={defaultOpen || undefined}>
      <summary>{title}</summary>
      {children}
    </details>
  ) : (
    <section className={className}>{children}</section>
  )
}
