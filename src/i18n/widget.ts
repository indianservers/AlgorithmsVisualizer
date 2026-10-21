import { i18n } from './config'
import { translateText } from './render'
/** Adapter for the existing non-React shared account widget, never the React application DOM. */
export function attachAccountLocalization() {
  const root = document.getElementById('aimer-account-root')
  if (!root) return
  const records = new WeakMap<Node, { source: string; rendered: string }>()
  const personal = '#profile-name,#profile-email,#profile-initial,#onboarding-summary,.profile-initial,input,textarea,code,pre,script,style'
  const observer = new MutationObserver(() => schedule())
  let queued = false,
    active = true
  function text(node: Text) {
    if (
      node.parentElement?.closest(personal) ||
      (node.parentElement?.closest('#account-label') && document.getElementById('account-trigger')?.classList.contains('is-signed-in'))
    )
      return
    const value = node.data
    let record = records.get(node)
    if (!record || value !== record.rendered) record = { source: value, rendered: value }
    record.rendered = translateText(record.source, 'messages')
    records.set(node, record)
    if (value !== record.rendered) node.data = record.rendered
  }
  function update() {
    queued = false
    if (!active) return
    observer.disconnect()
    const walker = document.createTreeWalker(root!, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) text(node as Text)
    // The trigger is moved into the current header by AccountControl.
    const trigger = document.getElementById('account-trigger')
    if (trigger && !trigger.classList.contains('is-signed-in'))
      for (const child of Array.from(trigger.querySelector('#account-label')?.childNodes ?? [])) if (child.nodeType === Node.TEXT_NODE) text(child as Text)
    for (const element of Array.from(root!.querySelectorAll<HTMLElement>('[aria-label],[title],[placeholder]'))) {
      for (const name of ['aria-label', 'title', 'placeholder']) {
        const attr = element.getAttributeNode(name)
        if (!attr) continue
        let record = records.get(attr)
        if (!record || record.rendered !== attr.value) record = { source: attr.value, rendered: attr.value }
        record.rendered = translateText(record.source, 'messages')
        records.set(attr, record)
        attr.value = record.rendered
      }
    }
    observer.observe(root!, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title', 'placeholder'] })
  }
  function schedule() {
    if (!queued) {
      queued = true
      queueMicrotask(update)
    }
  }
  i18n.on('languageChanged', schedule)
  i18n.on('loaded', schedule)
  window.addEventListener('aimer-account', schedule)
  window.addEventListener('aimer-account-open', schedule)
  schedule()
  return () => {
    active = false
    observer.disconnect()
    i18n.off('languageChanged', schedule)
    i18n.off('loaded', schedule)
    window.removeEventListener('aimer-account', schedule)
    window.removeEventListener('aimer-account-open', schedule)
  }
}
