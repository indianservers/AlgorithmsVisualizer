import { setupPhoneInput } from './phone-input.mjs?v=20261016-3'
import { accountRequest, getProfile, updateProfile } from './account-client.mjs?v=20261016-3'
const $ = (selector) => document.querySelector(selector)
const dialog = $('#account-dialog'),
  onboarding = $('#onboarding-dialog'),
  status = $('#auth-status'),
  phoneInput = setupPhoneInput()
let currentUser = null,
  busy = false,
  refreshing = false,
  pendingVerification = null,
  confirmation = null,
  verifier = null,
  resendAt = 0,
  timer,
  firebase,
  method = 'methods',
  emailMode = 'signin',
  lastAttempt = 'refresh',
  ownerVersion = 0
const deferredOnboarding = new Set()
const config = {
  apiKey: 'AIzaSyDKiPMjAuHqmFFm1l6tW3YMCkF7xQlsoMw',
  authDomain: 'mlvisualizationsaimersweb.firebaseapp.com',
  projectId: 'mlvisualizationsaimersweb',
  storageBucket: 'mlvisualizationsaimersweb.firebasestorage.app',
  messagingSenderId: '593351107909',
  appId: '1:593351107909:web:e2ba110eb27a8ef6830a2c',
}
async function sdk() {
  if (!firebase)
    firebase = (async () => {
      const [{ initializeApp }, f] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
      ])
      const auth = f.getAuth(initializeApp(config))
      await f.setPersistence(auth, f.inMemoryPersistence)
      return { ...f, auth }
    })().catch((error) => {
      firebase = null
      throw error
    })
  return firebase
}
async function clearClient() {
  if (firebase) {
    const f = await firebase.catch(() => null)
    if (f) await f.signOut(f.auth).catch(() => {})
  }
}
function fieldError(id, message = '') {
  const field = $('#' + id)
  field.setAttribute('aria-invalid', String(!!message))
  $('#' + id + '-error').textContent = message
}
function clearErrors() {
  for (const id of ['signup-name', 'signin-email', 'signin-password', 'phone-code']) fieldError(id)
}
function message(text) {
  status.textContent = text
  $('#auth-retry').hidden = true
}
function cooldown() {
  const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
  $('#phone-resend').disabled = busy || seconds > 0
  $('#phone-resend').textContent = seconds ? `Resend in ${seconds}s` : 'Resend code'
}
function clearVerifier() {
  verifier?.clear()
  verifier = null
  $('#phone-recaptcha').replaceChildren()
}
function resetPhone() {
  clearVerifier()
  confirmation = null
  clearInterval(timer)
  $('#phone-number-form').hidden = false
  $('#phone-code-form').hidden = true
  $('#phone-code').value = ''
  cooldown()
}
function view(next) {
  method = next
  dialog.dataset.authView = next
  $('#email-auth').hidden = next !== 'email'
  $('#phone-auth').hidden = next !== 'phone'
  $('#email-verification').hidden = next !== 'verification'
  for (const id of ['google-login', 'email-toggle', 'phone-toggle']) $('#' + id).hidden = !!currentUser || next !== 'methods'
  $('#auth-back').hidden = !!currentUser || next === 'methods' || next === 'verification'
  $('#email-toggle').setAttribute('aria-expanded', String(next === 'email'))
  $('#phone-toggle').setAttribute('aria-expanded', String(next === 'phone'))
}
async function showProfile(user) {
  const { photo } = await import('./account-client.mjs?v=20261016-3')
  if (user?.uid !== currentUser?.uid) return
  if (user) {
    photo($('.account-avatar'), user)
    photo($('#profile-initial'), user)
  }
}
function render(user) {
  const changed = currentUser?.uid !== user?.uid
  if (changed) {
    ownerVersion++
    onboarding.close()
    pendingVerification = null
    resetPhone()
    clearClient()
    clearErrors()
  }
  currentUser = user
  dialog.classList.toggle('is-signed-in', !!user)
  $('#account-trigger').classList.toggle('is-signed-in', !!user)
  $('#account-trigger').setAttribute('aria-label', user ? `Account: ${user.name || 'My account'}` : 'Continue to login')
  $('#account-label').textContent = user ? user.name?.trim().split(/\s+/)[0] || 'My account' : 'Continue to login'
  $('#account-title').textContent = user ? 'Your AIMER account' : 'Welcome to AIMER Society'
  $('#account-description').textContent = 'Choose how you’d like to continue. Learning is always open to guests.'
  $('#profile-name').textContent = user?.name || 'AIMER learner'
  $('#profile-email').textContent = user?.email || (user?.signInMethod === 'phone' ? 'Signed in with phone' : '')
  $('#account-profile').hidden = !user
  $('#account-links').hidden = !user
  $('#google-logout').hidden = !user
  $('#shared-account').hidden = !!user
  $('#central-login').hidden = !!user
  if (!user) {
    $('.account-avatar').textContent = 'A'
    $('#profile-initial').textContent = ''
  } else showProfile(user)
  if (changed || user) view('methods')
  if (changed) window.dispatchEvent(new CustomEvent('aimer-account', { detail: user }))
}
function lock(value) {
  busy = value
  dialog.setAttribute('aria-busy', String(value))
  for (const el of dialog.querySelectorAll('button,input,select')) if (el.id !== 'account-close') el.disabled = value
  cooldown()
}
const errors = {
  'auth/popup-closed-by-user': 'Sign-in cancelled. Choose a method to try again.',
  'auth/popup-blocked': 'Allow pop-ups for this site, or continue on AIMER Tools.',
  'auth/unauthorized-domain': 'Direct sign-in is not configured for this website yet. Continue on AIMER Tools.',
  'auth/invalid-credential': 'We couldn’t sign you in. Check your email and password, or use your original sign-in method.',
  'auth/wrong-password': 'We couldn’t sign you in. Check your email and password, or use your original sign-in method.',
  'auth/user-not-found': 'We couldn’t sign you in. Check your email and password, or use your original sign-in method.',
  'auth/email-already-in-use': 'Unable to create this account. Try signing in or requesting a password reset.',
  'auth/account-exists-with-different-credential': 'Use your original sign-in method. Accounts are not linked automatically.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes before trying again.',
  'auth/invalid-verification-code': 'That code is incorrect. Check the SMS and try again.',
  'auth/code-expired': 'This code expired. Resend a code or change the number.',
  'auth/session-expired': 'This code expired. Resend a code or change the number.',
  'auth/captcha-check-failed': 'Security check expired. Complete reCAPTCHA again to request a code.',
  'auth/quota-exceeded': 'The SMS quota is temporarily unavailable. Use Google or email, or try later.',
  'auth/billing-not-enabled': 'SMS is unavailable due to the provider’s billing configuration. Use Google or email.',
  'auth/network-request-failed': 'Connection interrupted. Check your internet and try again.',
  'auth/requires-recent-login': 'Your verification took longer than the secure sign-in window. Sign in again to finish.',
}
function failure(error) {
  const text =
    errors[error.code] ||
    (error.code === 'auth/operation-not-allowed'
      ? lastAttempt === 'phone'
        ? 'SMS may be restricted for the selected country or by the provider configuration. Last verified region policy allowed India only. Try Google or email.'
        : 'This sign-in method is unavailable. Try another method.'
      : error.code?.startsWith('auth/')
        ? 'Sign-in could not complete. Try again.'
        : error.message || 'The account service is unavailable. Try again.')
  message(text)
  $('#auth-retry').hidden = false
  if (lastAttempt === 'email') fieldError(error.code === 'auth/invalid-email' ? 'signin-email' : 'signin-password', text)
  if (lastAttempt === 'phone' && confirmation) fieldError('phone-code', text)
}
async function action(attempt, task) {
  if (busy) return
  lastAttempt = attempt
  lock(true)
  clearErrors()
  message('Connecting securely…')
  try {
    await task()
  } catch (error) {
    failure(error)
  } finally {
    lock(false)
    if (!pendingVerification && !confirmation) await clearClient()
    if (dialog.open) {
      const invalid = dialog.querySelector('[aria-invalid="true"]')
      if (invalid) invalid.focus()
      else if (confirmation && method === 'phone') $('#phone-code').focus()
    }
  }
}
async function commonProfile(auto = false) {
  const uid = currentUser?.uid,
    version = ownerVersion
  if (!uid) return
  const p = await getProfile()
  if (version !== ownerVersion || p.uid !== uid || currentUser?.uid !== uid) return
  render({ ...currentUser, name: p.name, picture: p.picture, signInMethod: p.signInMethod || currentUser.signInMethod })
  if (auto && !p.onboardingComplete && !deferredOnboarding.has(uid)) {
    deferredOnboarding.add(uid)
    dialog.close()
    window.aimerOnboarding.open(p)
  }
  return p
}
async function completeLogin(user) {
  if (user.providerData?.some((p) => p.providerId === 'password' || p.providerId === 'google.com') && !user.emailVerified)
    throw new Error('Verify your email before finishing sign-in.')
  const { user: sessionUser } = await accountRequest('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: await user.getIdToken(true) }),
  })
  if (!sessionUser?.uid) throw new Error('The shared session was not created. Try signing in again.')
  pendingVerification = null
  confirmation = null
  render(sessionUser)
  await clearClient()
  message('Signed in to AIMER Society.')
  dialog.close()
  try {
    await commonProfile(true)
  } catch (error) {
    message('You’re signed in, but your profile could not load. Open your account and try again.')
    failure(error)
  }
}
async function refresh() {
  if (busy || refreshing || pendingVerification || confirmation || method === 'phone' || method === 'email') return
  refreshing = true
  const version = ownerVersion
  try {
    const { user } = await accountRequest('/api/session')
    if (busy || version !== ownerVersion) return
    render(user)
    message('')
    if (user) await commonProfile(false)
  } catch (error) {
    if (error.status === 401) render(null)
    failure(error)
  } finally {
    refreshing = false
  }
}
function settings() {
  const url = new URL(location.href)
  url.searchParams.delete('returnTo')
  url.searchParams.set('login', '1')
  return { url: url.href }
}
function setEmailMode(mode) {
  emailMode = mode
  $('#signup-fields').hidden = mode !== 'signup'
  $('#signup-name').required = mode === 'signup'
  $('#signin-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password'
  $('#password-help').hidden = mode !== 'signup'
  $('#forgot-password').hidden = mode === 'signup'
  $('#email-submit').textContent = mode === 'signup' ? 'Create account' : 'Sign in with email'
  $('#email-signin-tab').setAttribute('aria-pressed', String(mode === 'signin'))
  $('#email-signup-tab').setAttribute('aria-pressed', String(mode === 'signup'))
  clearErrors()
}
function verification(user) {
  pendingVerification = user
  view('verification')
  $('#signin-password').value = ''
}
$('#google-login').addEventListener('click', () =>
  action('google', async () => {
    resetPhone()
    const f = await sdk()
    const result = await f.signInWithPopup(f.auth, new f.GoogleAuthProvider())
    await completeLogin(result.user)
  }),
)
$('#email-toggle').addEventListener('click', () => {
  if (busy) return
  resetPhone()
  view('email')
  setEmailMode('signin')
  message('')
  $('#signin-email').focus()
})
$('#phone-toggle').addEventListener('click', () => {
  if (busy) return
  resetPhone()
  view('phone')
  message('')
  $('#login-phone').focus()
})
$('#auth-back').addEventListener('click', () => {
  if (busy) return
  resetPhone()
  view('methods')
  message('')
  $('#google-login').focus()
})
$('#email-signin-tab').addEventListener('click', () => setEmailMode('signin'))
$('#email-signup-tab').addEventListener('click', () => setEmailMode('signup'))
$('#toggle-password').addEventListener('click', () => {
  const input = $('#signin-password'),
    show = input.type === 'password'
  input.type = show ? 'text' : 'password'
  $('#toggle-password').textContent = show ? 'Hide' : 'Show'
  $('#toggle-password').setAttribute('aria-label', show ? 'Hide password' : 'Show password')
})
$('#email-form').addEventListener('submit', (event) => {
  event.preventDefault()
  if (busy) return
  for (const id of ['signin-email', 'signin-password', ...(emailMode === 'signup' ? ['signup-name'] : [])]) {
    const input = $('#' + id)
    if (!input.value.trim() || !input.checkValidity()) {
      fieldError(id, id === 'signin-email' ? 'Enter a valid email address.' : id === 'signup-name' ? 'Enter your name.' : 'Enter your password.')
      input.focus()
      return
    }
  }
  action('email', async () => {
    const f = await sdk(),
      email = $('#signin-email').value.trim(),
      password = $('#signin-password').value
    let result
    if (emailMode === 'signup') {
      const policy = await f.validatePassword(f.auth, password)
      if (!policy.isValid) {
        const rules = [
          policy.containsLowercaseLetter === false ? 'a lowercase letter' : '',
          policy.containsUppercaseLetter === false ? 'an uppercase letter' : '',
          policy.containsNumericCharacter === false ? 'a number' : '',
          policy.containsNonAlphanumericCharacter === false ? 'a symbol' : '',
          policy.meetsMinPasswordLength === false ? `at least ${policy.passwordPolicy?.customStrengthOptions?.minPasswordLength || 8} characters` : '',
        ].filter(Boolean)
        throw new Error('Password needs ' + (rules.join(', ') || 'to meet the account password policy') + '.')
      }
      result = await f.createUserWithEmailAndPassword(f.auth, email, password)
      verification(result.user)
      await f.updateProfile(result.user, { displayName: $('#signup-name').value.trim() })
      await f.sendEmailVerification(result.user, settings())
      message('Verification email sent. Check your inbox and spam folder.')
    } else {
      result = await f.signInWithEmailAndPassword(f.auth, email, password)
      if (!result.user.emailVerified) {
        verification(result.user)
        await f.sendEmailVerification(result.user, settings())
        message('Verify your email to finish signing in. Check your inbox and spam folder.')
      } else {
        $('#signin-password').value = ''
        await completeLogin(result.user)
      }
    }
  })
})
$('#forgot-password').addEventListener('click', () => {
  const input = $('#signin-email')
  if (!input.value || !input.checkValidity()) {
    fieldError('signin-email', 'Enter your email address to request a reset link.')
    input.focus()
    return
  }
  action('reset', async () => {
    const f = await sdk()
    try {
      await f.sendPasswordResetEmail(f.auth, input.value.trim(), settings())
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error
    }
    message('If an eligible account exists, a password reset link will arrive in your inbox. Check spam too.')
  })
})
$('#resend-verification').addEventListener('click', () =>
  action('verification', async () => {
    if (!pendingVerification) return
    const f = await sdk()
    await f.sendEmailVerification(pendingVerification, settings())
    message('Verification email sent. Check your inbox and spam folder.')
  }),
)
$('#check-verification').addEventListener('click', () =>
  action('verification', async () => {
    if (!pendingVerification) return
    const f = await sdk()
    await f.reload(pendingVerification)
    if (!pendingVerification.emailVerified) {
      message('Your email is not verified yet. Open the latest link, then try again.')
      return
    }
    try {
      await completeLogin(pendingVerification)
    } catch (error) {
      if (error.status === 401 || error.code === 'auth/requires-recent-login') {
        pendingVerification = null
        view('email')
        setEmailMode('signin')
        message('Verification is complete. Sign in again to finish securely.')
      } else throw error
    }
  }),
)
$('#cancel-verification').addEventListener('click', () =>
  action('verification', async () => {
    pendingVerification = null
    await clearClient()
    view('methods')
    message('')
  }),
)
async function sendCode() {
  const number = phoneInput.validate()
  if (Date.now() < resendAt) throw new Error('Please wait before requesting another SMS.')
  const f = await sdk()
  confirmation = null
  clearVerifier()
  f.auth.useDeviceLanguage?.()
  $('#phone-number-form').hidden = false
  $('#phone-code-form').hidden = true
  verifier = new f.RecaptchaVerifier(f.auth, 'phone-recaptcha', { size: $('#phone-recaptcha').clientWidth < 304 ? 'compact' : 'normal' })
  message('Complete the security check to receive your code…')
  try {
    confirmation = await f.signInWithPhoneNumber(f.auth, number, verifier)
  } finally {
    clearVerifier()
  }
  resendAt = Date.now() + 60000
  clearInterval(timer)
  timer = setInterval(cooldown, 1000)
  $('#phone-number-form').hidden = true
  $('#phone-code-form').hidden = false
  $('#phone-code-hint').textContent = `Code sent to ${number}.`
  $('#phone-code').value = ''
  message('Enter the 6-digit verification code.')
  $('#phone-code').focus()
}
$('#phone-number-form').addEventListener('submit', (event) => {
  event.preventDefault()
  action('phone', sendCode)
})
$('#phone-code-form').addEventListener('submit', (event) => {
  event.preventDefault()
  if (!/^\d{6}$/.test($('#phone-code').value.trim())) {
    fieldError('phone-code', 'Enter the 6-digit code from your SMS.')
    return
  }
  action('phone', async () => {
    if (!confirmation) throw new Error('Request a new code.')
    const result = await confirmation.confirm($('#phone-code').value.trim())
    await completeLogin(result.user)
  })
})
$('#phone-resend').addEventListener('click', () => action('phone', sendCode))
$('#phone-change').addEventListener('click', () => {
  if (busy) return
  resetPhone()
  view('phone')
  message('')
  $('#login-phone').focus()
})
$('#google-logout').addEventListener('click', () =>
  action('logout', async () => {
    await accountRequest('/api/session', { method: 'DELETE' })
    pendingVerification = null
    resetPhone()
    await clearClient()
    render(null)
    message('Signed out of AIMER websites.')
  }),
)
$('#auth-retry').addEventListener('click', () => {
  if (busy) return
  if (lastAttempt === 'refresh' || lastAttempt === 'logout') {
    refresh()
    return
  }
  if (method === 'verification') $('#check-verification').click()
  else if (method === 'phone') (confirmation ? $('#phone-code-form') : $('#phone-number-form')).requestSubmit()
  else if (method === 'email') lastAttempt === 'reset' ? $('#forgot-password').click() : $('#email-form').requestSubmit()
  else refresh()
})
$('#personalize-learning').addEventListener('click', () =>
  action('profile', async () => {
    const p = await commonProfile(false)
    if (!p) return
    dialog.close()
    window.aimerOnboarding.open(p)
  }),
)
async function finishOnboarding(skip) {
  const uid = onboarding.dataset.accountUid
  if (busy || !uid || uid !== currentUser?.uid) {
    onboarding.close()
    return
  }
  const controls = [...onboarding.querySelectorAll('button,input')]
  controls.forEach((el) => (el.disabled = true))
  try {
    const skipInterests = skip && onboarding.dataset.step === '1',
      body = {
        interests: skipInterests
          ? JSON.parse(onboarding.dataset.originalInterests || '[]')
          : [...onboarding.querySelectorAll('.interest-card input:checked')].map((i) => i.value).filter((v) => v !== 'all'),
        onboardingComplete: true,
      }
    if (!skip) {
      const mobile = $('#onboarding-mobile').value.replace(/[ ()-]/g, '')
      if (mobile && !/^\+[1-9]\d{7,14}$/.test(mobile)) throw new Error('Enter a contact number with country code, or skip this optional step.')
      body.mobileNumber = mobile
    }
    await updateProfile(body, uid)
    onboarding.close()
  } catch (error) {
    $('#onboarding-status').textContent = error.message
  } finally {
    controls.forEach((el) => (el.disabled = false))
  }
}
$('#onboarding-save').addEventListener('click', () => finishOnboarding(false))
$('#onboarding-skip').addEventListener('click', () => finishOnboarding(true))
window.addEventListener('aimer-session-expired', () => {
  render(null)
  message('Your session expired. Sign in again to access your AIMER account.')
})
dialog.addEventListener('close', () => {
  if (!busy && !pendingVerification) {
    resetPhone()
    view('methods')
    clearClient()
  }
})
window.addEventListener('focus', refresh)
window.addEventListener('pageshow', refresh)
window.addEventListener('aimer-account-open', refresh)
await refresh()
if (new URLSearchParams(location.search).get('login') === '1' && !currentUser) $('#account-trigger').click()
