import shell from './shell.html?raw'
const version = '20261016-2'
const host = document.createElement('div')
host.id = 'aimer-account-root'
host.innerHTML = shell
document.body.append(host)
const trigger = document.getElementById('account-trigger') as HTMLButtonElement
const dialog = document.getElementById('account-dialog') as HTMLDialogElement
const onboarding = document.getElementById('onboarding-dialog') as HTMLDialogElement
trigger.addEventListener('click', () => {
  const fallback = document.getElementById('central-login') as HTMLAnchorElement
  const current = new URL(location.href)
  current.searchParams.delete('login')
  current.searchParams.delete('returnTo')
  const trusted = current.protocol === 'https:' && current.hostname === 'algorithms.aimersociety.com' && !current.port && !current.username && !current.password
  fallback.href = trusted ? `https://tools.aimersociety.com/?login=1&returnTo=${encodeURIComponent(current.href)}` : 'https://tools.aimersociety.com/?login=1'
  if (!dialog.open) dialog.showModal()
  window.dispatchEvent(new Event('aimer-account-open'))
})
document.getElementById('account-close')!.addEventListener('click', () => dialog.close())
document.getElementById('account-learning')!.addEventListener('click', () => dialog.close())
for (const modal of [dialog, onboarding]) {
  modal.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) trigger.focus({ preventScroll: true })
  })
  modal.addEventListener('keydown', (event) => event.stopPropagation())
  modal.addEventListener('click', (event) => {
    const r = modal.getBoundingClientRect()
    if (event.target === modal && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) modal.close()
  })
}
function script(src: string, type?: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = `${src}?v=${version}`
    if (type) el.type = type
    el.onload = () => resolve()
    el.onerror = () => reject(new Error('Account resources could not load.'))
    document.body.append(el)
  })
}
async function loadAccount() {
  try {
    await script('/account/onboarding-ui.js')
    await script('/account/vendor/libphonenumber-max.js')
    await script('/account/auth.js', 'module')
  } catch {
    document.getElementById('auth-status')!.textContent = 'Direct sign-in is unavailable. Continue on AIMER Tools, then return here.'
  }
}
void loadAccount()
