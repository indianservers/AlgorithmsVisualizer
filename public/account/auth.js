import { readSessionResponse } from './session-response.mjs'
import { getProfile, updateProfile, safeReturnTo, photo } from './account-client.mjs'
let auth, firebase, initialization
async function initializeFirebase() {
  if (!initialization)
    initialization = (async () => {
      const [appSDK, authSDK] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
      ])
      firebase = authSDK
      auth = firebase.getAuth(
        appSDK.initializeApp({
          apiKey: 'AIzaSyDKiPMjAuHqmFFm1l6tW3YMCkF7xQlsoMw',
          authDomain: 'mlvisualizationsaimersweb.firebaseapp.com',
          projectId: 'mlvisualizationsaimersweb',
          storageBucket: 'mlvisualizationsaimersweb.firebasestorage.app',
          messagingSenderId: '593351107909',
          appId: '1:593351107909:web:e2ba110eb27a8ef6830a2c',
        }),
      )
      await firebase.setPersistence(auth, firebase.inMemoryPersistence)
    })().catch((error) => {
      initialization = null
      throw error
    })
  return initialization
}
const signOut = () => (auth ? firebase.signOut(auth) : Promise.resolve())
const signInWithPopup = (...args) => firebase.signInWithPopup(...args)
const createUserWithEmailAndPassword = (...args) => firebase.createUserWithEmailAndPassword(...args)
const signInWithEmailAndPassword = (...args) => firebase.signInWithEmailAndPassword(...args)
const sendEmailVerification = (...args) => firebase.sendEmailVerification(...args)
const sendPasswordResetEmail = (...args) => firebase.sendPasswordResetEmail(...args)
const updateFirebaseProfile = (...args) => firebase.updateProfile(...args)
const reload = (...args) => firebase.reload(...args)
const validatePassword = (...args) => firebase.validatePassword(...args)
const button = document.querySelector('#google-login')
const logout = document.querySelector('#google-logout')
const status = document.querySelector('#auth-status')
let currentUser
let busy = false
let emailMode = 'signin',
  pendingVerification = null,
  pendingMobile = ''
let lastAttempt = 'google'

window.addEventListener('aimer-profile', (e) => {
  if (currentUser?.uid === e.detail.uid) render({ ...currentUser, name: e.detail.name, picture: e.detail.picture })
})
function render(user) {
  const changed = currentUser?.uid !== user?.uid || currentUser === undefined
  if (currentUser?.uid && currentUser.uid !== user?.uid) document.querySelector('#onboarding-dialog').close()
  currentUser = user
  const trigger = document.querySelector('#account-trigger')
  trigger.classList.toggle('is-signed-in', Boolean(user))
  trigger.setAttribute('aria-label', user ? `Account: ${user.name || user.email || 'Signed in'}` : 'Continue to login')
  document.querySelector('#account-label').textContent = user ? (user.name || 'My account').split(' ')[0] : 'Continue to login'
  const avatar = trigger.querySelector('.account-avatar')
  if (user) avatar.textContent = (user.name || user.email || 'A').slice(0, 1).toUpperCase()
  else
    avatar.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>'
  if (user) {
    photo(avatar, user)
    photo(document.querySelector('#profile-initial'), user)
  }
  document.querySelector('#account-title').innerHTML = user ? 'Welcome to AIMER.' : 'A little curiosity.<br>Endless possibilities.'
  document.querySelector('#account-description').textContent = user
    ? 'You’re signed in. Let’s explore something new.'
    : 'Sign in with Google or your email. Your next discovery starts here.'
  document.querySelector('#account-profile').hidden = !user
  document.querySelector('#profile-name').textContent = user?.name || ''
  document.querySelector('#profile-email').textContent = user?.email || ''
  if (user) photo(document.querySelector('#profile-initial'), user)
  else document.querySelector('#profile-initial').textContent = ''
  button.hidden = Boolean(user)
  button.disabled = false
  logout.hidden = !user
  document.querySelector('#account-links').hidden = !user
  document.querySelector('#shared-account').hidden = Boolean(user)
  document.querySelector('#email-toggle').hidden = Boolean(user) || Boolean(pendingVerification)
  if (user) {
    document.querySelector('#email-auth').hidden = true
    document.querySelector('#email-verification').hidden = true
  }
  if (changed) window.dispatchEvent(new CustomEvent('aimer-account', { detail: user }))
}
async function session(method = 'GET', idToken) {
  const response = await fetch('https://tools.aimersociety.com/api/session', {
    method,
    credentials: 'include',
    cache: 'no-store',
    ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) } : {}),
  })
  if (response.status === 401) {
    render(null)
    throw new Error('Your session expired. Please sign in again.')
  }
  return readSessionResponse(response)
}
function emailBusy(value) {
  document.querySelector('#email-auth').setAttribute('aria-busy', String(value))
  for (const el of document.querySelectorAll('#email-auth button,#email-auth input,#email-toggle,#email-verification button')) el.disabled = value
}
function mobileValue(value) {
  const normalized = value.replace(/[ ()-]/g, '')
  if (normalized && !/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error('Enter a mobile number with country code, such as +91 98765 43210.')
  return normalized
}
async function completeLogin(user) {
  if (!user.emailVerified) throw new Error('Verify your email before signing in.')
  render(await session('POST', await user.getIdToken(true)))
  pendingVerification = null
  await signOut(auth)
  if (pendingMobile) {
    try {
      await updateProfile({ mobileNumber: pendingMobile }, user.uid)
      pendingMobile = ''
    } catch {
      status.textContent = 'Signed in. Add your optional mobile number in your profile.'
    }
  }
  status.textContent = 'Signed in to AIMER Society.'
  document.querySelector('#account-dialog').close()
  await loadCommonProfile()
}
function authError(error) {
  const messages = {
    'auth/popup-closed-by-user': 'Sign-in cancelled. You can try again.',
    'auth/popup-blocked': 'Allow pop-ups for this site, then try again.',
    'auth/operation-not-allowed': 'This sign-in method must be enabled in Firebase.',
    'auth/unauthorized-domain': 'This website needs to be authorized in Firebase.',
    'auth/invalid-credential': 'We couldn’t sign you in. Check your email and password, or try Google.',
    'auth/wrong-password': 'We couldn’t sign you in. Check your email and password, or try Google.',
    'auth/user-not-found': 'We couldn’t sign you in. Check your email and password, or try Google.',
    'auth/email-already-in-use': 'Unable to create this account. Try signing in, Google, or password reset.',
    'auth/account-exists-with-different-credential': 'Try your original sign-in method to access this account.',
    'auth/weak-password': 'Choose a stronger password that meets the password requirements.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
    'auth/network-request-failed': 'Connection interrupted. Check your internet and try again.',
  }
  status.textContent = messages[error.code] || (error.code?.startsWith('auth/') ? 'Sign-in could not complete. Please try again.' : error.message)
  document.querySelector('#auth-retry').hidden = false
  if (document.querySelector('#account-dialog').open) status.scrollIntoView({ block: 'nearest' })
}
button.addEventListener('click', async () => {
  if (busy) return
  busy = true
  lastAttempt = 'google'
  pendingMobile = ''
  emailBusy(true)
  button.disabled = true
  status.textContent = 'Connecting to Google…'
  button.classList.add('is-loading')
  button.querySelector('span').textContent = 'Connecting to Google…'
  document.querySelector('#auth-retry').hidden = true
  try {
    await initializeFirebase()
    const result = await signInWithPopup(auth, new firebase.GoogleAuthProvider())
    status.textContent = 'Signing you in…'
    button.querySelector('span').textContent = 'Signing you in…'
    await completeLogin(result.user)
  } catch (error) {
    authError(error)
  } finally {
    await signOut(auth).catch(() => {})
    button.disabled = false
    busy = false
    emailBusy(false)
    button.classList.remove('is-loading')
    button.querySelector('span').textContent = 'Continue with Google'
  }
})
logout.addEventListener('click', async () => {
  if (busy) return
  busy = true
  logout.disabled = true
  try {
    await session('DELETE')
    await signOut(auth)
    render(null)
    status.textContent = 'Signed out.'
  } catch (error) {
    status.textContent = error.message
  } finally {
    logout.disabled = false
    busy = false
  }
})
let refreshing = false
async function refresh() {
  if (busy || refreshing) return
  refreshing = true
  try {
    const user = await session()
    if (busy) return
    render(user)
    status.textContent = ''
    if (currentUser) await loadCommonProfile()
  } catch (error) {
    status.textContent = error.message
    document.querySelector('#auth-retry').hidden = false
  } finally {
    refreshing = false
  }
}

document.querySelector('#auth-retry').addEventListener('click', () => {
  if (busy) return
  if (pendingVerification) document.querySelector('#check-verification').click()
  else if (lastAttempt === 'reset') document.querySelector('#forgot-password').click()
  else if (lastAttempt === 'email') document.querySelector('#email-form').requestSubmit()
  else refresh()
})
window.addEventListener('aimer-session-expired', () => {
  render(null)
  document.querySelector('#onboarding-dialog').close()
  status.textContent = 'Your session expired. Sign in again to access your AIMER account.'
  document.querySelector('#account-trigger').click()
})
const onboarding = document.querySelector('#onboarding-dialog')
window.addEventListener('aimer-onboarding', (e) => {
  const profile = { ...e.detail, mobileNumber: e.detail.mobileNumber || pendingMobile || '' }
  if (currentUser?.uid === profile.uid && !onboarding.open && !busy) window.aimerOnboarding.open(profile)
  else if (busy)
    setTimeout(() => {
      if (currentUser?.uid === profile.uid && !onboarding.open) window.aimerOnboarding.open(profile)
    }, 250)
})
document.querySelector('#personalize-learning').addEventListener('click', async () => {
  const control = document.querySelector('#personalize-learning')
  control.disabled = true
  try {
    const profile = await getProfile()
    document.querySelector('#account-dialog').close()
    window.aimerOnboarding.open(profile)
  } catch (error) {
    status.textContent = error.message
  } finally {
    control.disabled = false
  }
})
async function finishOnboarding(skip) {
  const owner = onboarding.dataset.accountUid
  if (!owner || currentUser?.uid !== owner) {
    onboarding.close()
    status.textContent = 'Your account changed. Open personalization again.'
    return
  }
  const controls = [...onboarding.querySelectorAll('button')]
  controls.forEach((b) => (b.disabled = true))
  try {
    const skipInterests = skip && onboarding.dataset.step === '1'
    await updateProfile(
      {
        ...(skip ? {} : { mobileNumber: mobileValue(document.querySelector('#onboarding-mobile').value) }),
        interests: skipInterests
          ? JSON.parse(onboarding.dataset.originalInterests || '[]')
          : [...onboarding.querySelectorAll('.interest-card input:checked')].map((i) => i.value).filter((value) => value !== 'all'),
        onboardingComplete: true,
      },
      owner,
    )
    onboarding.close()
    // Keep the current learning route.
  } catch (error) {
    document.querySelector('#onboarding-status').textContent = error.message
  } finally {
    controls.forEach((b) => (b.disabled = false))
  }
}
document.querySelector('#onboarding-save').addEventListener('click', () => finishOnboarding(false))
document.querySelector('#onboarding-skip').addEventListener('click', () => finishOnboarding(true))
const emailForm = document.querySelector('#email-form')
function setEmailMode(mode) {
  emailMode = mode
  document.querySelector('#signup-fields').hidden = mode !== 'signup'
  document.querySelector('#signup-name').required = mode === 'signup'
  document.querySelector('#signin-password').minLength = mode === 'signup' ? 8 : 1
  document.querySelector('#signin-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password'
  document.querySelector('#password-help').hidden = mode !== 'signup'
  document.querySelector('#email-submit').textContent = mode === 'signup' ? 'Create account →' : 'Sign in with email →'
  document.querySelector('#forgot-password').hidden = mode === 'signup'
  document.querySelector('#email-signin-tab').setAttribute('aria-pressed', mode === 'signin')
  document.querySelector('#email-signup-tab').setAttribute('aria-pressed', mode === 'signup')
}
function verificationView(user) {
  pendingVerification = user
  document.querySelector('#email-auth').hidden = true
  document.querySelector('#email-toggle').hidden = true
  document.querySelector('#email-verification').hidden = false
  button.hidden = true
  document.querySelector('#signin-password').value = ''
}
function actionSettings() {
  const url = new URL('/?login=1', location.origin)
  const destination = safeReturnTo(new URLSearchParams(location.search).get('returnTo'))
  if (destination) url.searchParams.set('returnTo', destination)
  return { url: url.href }
}
async function emailAction(task, message) {
  if (busy) return
  busy = true
  emailBusy(true)
  button.disabled = true
  status.textContent = message
  document.querySelector('#auth-retry').hidden = true
  document.querySelector('#email-submit').classList.add('is-loading')
  try {
    await initializeFirebase()
    await task()
  } catch (error) {
    authError(error)
  } finally {
    if (!pendingVerification) await signOut(auth).catch(() => {})
    busy = false
    emailBusy(false)
    button.disabled = false
    document.querySelector('#email-submit').classList.remove('is-loading')
  }
}
document.querySelector('#email-toggle').addEventListener('click', () => {
  const section = document.querySelector('#email-auth')
  section.hidden = !section.hidden
  document.querySelector('#email-toggle').setAttribute('aria-expanded', !section.hidden)
  if (!section.hidden) {
    setEmailMode('signin')
    document.querySelector('#signin-email').focus()
  }
})
document.querySelector('#email-signin-tab').addEventListener('click', () => setEmailMode('signin'))
document.querySelector('#email-signup-tab').addEventListener('click', () => setEmailMode('signup'))
document.querySelector('#toggle-password').addEventListener('click', () => {
  const input = document.querySelector('#signin-password'),
    show = input.type === 'password'
  input.type = show ? 'text' : 'password'
  document.querySelector('#toggle-password').textContent = show ? 'Hide' : 'Show'
  document.querySelector('#toggle-password').setAttribute('aria-label', show ? 'Hide password' : 'Show password')
})
emailForm.addEventListener('submit', (e) => {
  e.preventDefault()
  lastAttempt = 'email'
  emailAction(
    async () => {
      const email = document.querySelector('#signin-email').value.trim(),
        password = document.querySelector('#signin-password').value
      let result
      if (emailMode === 'signup') {
        const displayName = document.querySelector('#signup-name').value.trim()
        if (!displayName) throw new Error('Enter your name to create an account.')
        pendingMobile = mobileValue(document.querySelector('#signup-mobile').value)
        if (!(await validatePassword(auth, password)).isValid) throw new Error('Choose a password that meets the account password requirements.')
        result = await createUserWithEmailAndPassword(auth, email, password)
        verificationView(result.user)
        await updateFirebaseProfile(result.user, { displayName })
        await sendEmailVerification(result.user, actionSettings())
        status.textContent = 'Verification email sent. Check your inbox and spam folder.'
      } else {
        pendingMobile = ''
        result = await signInWithEmailAndPassword(auth, email, password)
        if (!result.user.emailVerified) {
          verificationView(result.user)
          await sendEmailVerification(result.user, actionSettings())
          status.textContent = 'Verify your email to finish signing in. We sent a new link.'
        } else {
          document.querySelector('#signin-password').value = ''
          await completeLogin(result.user)
        }
      }
    },
    emailMode === 'signup' ? 'Creating your account…' : 'Signing you in…',
  )
})
document.querySelector('#forgot-password').addEventListener('click', () => {
  const input = document.querySelector('#signin-email')
  if (!input.reportValidity()) return
  lastAttempt = 'reset'
  emailAction(async () => {
    try {
      await sendPasswordResetEmail(auth, input.value.trim(), actionSettings())
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error
    }
    status.textContent = 'If an eligible account exists, a password reset link will arrive in your inbox. Check spam too.'
    document.querySelector('#signin-password').value = ''
  }, 'Requesting a reset link…')
})
document.querySelector('#resend-verification').addEventListener('click', () =>
  emailAction(async () => {
    if (!pendingVerification) return
    await sendEmailVerification(pendingVerification, actionSettings())
    status.textContent = 'Verification email sent. Check your inbox and spam folder.'
  }, 'Sending verification link…'),
)
document.querySelector('#check-verification').addEventListener('click', () =>
  emailAction(async () => {
    if (!pendingVerification) return
    await reload(pendingVerification)
    if (!pendingVerification.emailVerified) {
      status.textContent = 'Your email is not verified yet. Open the latest verification link, then try again.'
      return
    }
    const verified = pendingVerification
    pendingVerification = null
    try {
      await completeLogin(verified)
    } catch (error) {
      document.querySelector('#email-verification').hidden = true
      document.querySelector('#email-auth').hidden = false
      document.querySelector('#email-toggle').hidden = false
      button.hidden = false
      setEmailMode('signin')
      throw error
    }
  }, 'Checking your verification…'),
)
document.querySelector('#cancel-verification').addEventListener('click', () =>
  emailAction(async () => {
    pendingVerification = null
    pendingMobile = ''
    await signOut(auth)
    document.querySelector('#email-verification').hidden = true
    document.querySelector('#email-auth').hidden = true
    document.querySelector('#email-toggle').setAttribute('aria-expanded', 'false')
    render(null)
    status.textContent = ''
  }, 'Returning to sign-in…'),
)
document.querySelector('#account-trigger').addEventListener('click', () => {
  initializeFirebase().catch(() => {})
})
await refresh()
const params = new URLSearchParams(location.search)
if (params.get('login') === '1') {
  const destination = safeReturnTo(params.get('returnTo'))
  if (currentUser && destination && destination !== location.href) location.replace(destination)
  else document.querySelector('#account-trigger').click()
}
window.addEventListener('focus', refresh)

async function loadCommonProfile() {
  const uid = currentUser?.uid
  const profile = await getProfile()
  if (!uid || currentUser?.uid !== uid || profile.uid !== uid) return
  render({ ...currentUser, name: profile.name, picture: profile.picture })
  if (!profile.onboardingComplete && !onboarding.open && !document.querySelector('#account-dialog').open)
    window.dispatchEvent(new CustomEvent('aimer-onboarding', { detail: profile }))
}
