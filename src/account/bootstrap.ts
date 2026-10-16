import shell from './shell.html?raw'

// Account dialogs live outside React's route tree, keeping verification in memory
// and preserving the original hash route when a user opens or closes sign-in.
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
})
document.getElementById('account-close')!.addEventListener('click', () => dialog.close())
document.getElementById('account-learning')!.addEventListener('click', () => dialog.close())
for (const modal of [dialog, onboarding]) {
  modal.addEventListener('close', () => trigger.focus({ preventScroll: true }))
  modal.addEventListener('keydown', (event) => event.stopPropagation())
}
// A failed CDN load leaves the central-login fallback usable.
const ui = document.createElement('script')
ui.src = '/account/onboarding-ui.js'
ui.onload = () => {
  const auth = document.createElement('script')
  auth.type = 'module'
  auth.src = '/account/auth.js'
  auth.onerror = () => {
    document.getElementById('auth-status')!.textContent = 'Direct sign-in is unavailable. Continue on AIMER Tools, then return here.'
  }
  document.body.append(auth)
}
document.body.append(ui)
