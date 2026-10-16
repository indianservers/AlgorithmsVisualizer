import { useLayoutEffect, useRef } from 'react'

/** The shared widget owns its DOM; this slot preserves it across React routes. */
export function AccountControl() {
  const slot = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const trigger = document.getElementById('account-trigger')
    if (trigger) slot.current?.append(trigger)
    return () => {
      if (trigger) document.getElementById('account-parking')?.append(trigger)
    }
  }, [])
  return <div ref={slot} className="aimer-account-slot" />
}
