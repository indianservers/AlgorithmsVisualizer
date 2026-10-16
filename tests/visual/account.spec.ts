import { test, expect, type Page } from '@playwright/test'

// Authentication dialogs exercise several async UI steps on desktop and mobile.
test.setTimeout(60_000)

const origin = () => new URL(test.info().project.use.baseURL!).origin
const user: { uid: string; name: string | null; email: string | null; picture: null; signInMethod?: string } = {
  uid: 'mock-uid',
  name: 'Ada Learner',
  email: 'ada@example.test',
  picture: null,
}
async function setup(page: Page, signedIn = false, complete = true) {
  Object.assign(user, { uid: 'mock-uid', name: 'Ada Learner', email: 'ada@example.test', picture: null, signInMethod: 'password' })
  const writes: { method: string; body: Record<string, unknown>; uid?: string }[] = []
  await page.route('https://www.gstatic.com/firebasejs/**', async (route) => {
    const body = route.request().url().endsWith('firebase-app.js')
      ? 'export const initializeApp = x => x;'
      : `const u = { uid:'mock-uid', emailVerified:true, getIdToken:async()=> 'mock-token' };
         export const getAuth=()=>({useDeviceLanguage(){}}); export class RecaptchaVerifier { clear(){} }; export const signInWithPhoneNumber=async(auth,number,verifier)=>{ window.mockPhoneSends=(window.mockPhoneSends||0)+1;return {confirm:async(code)=>{if(code==='000000')throw {code:'auth/invalid-verification-code'};return {user:{uid:'phone-uid',emailVerified:false,providerData:[{providerId:'phone'}],getIdToken:async()=> 'phone-token'}}}}}; export class GoogleAuthProvider {};
         export const inMemoryPersistence={}; export const setPersistence=async()=>{};
         export const signOut=async()=>{};
         export const signInWithPopup=async()=>({user:u});
         export const signInWithEmailAndPassword=async()=>({user:u});
         export const createUserWithEmailAndPassword=async()=>{u.emailVerified=false;return {user:u}};
         export const sendEmailVerification=async()=>{};
         export const sendPasswordResetEmail=async()=>{};
         export const updateProfile=async()=>{};
         export const reload=async()=>{u.emailVerified=true};
         export const validatePassword=async()=>({isValid:true});`
    await route.fulfill({ contentType: 'application/javascript', body })
  })
  await page.route('https://tools.aimersociety.com/api/**', async (route) => {
    const request = route.request()
    expect(request.headers().origin).toBe(origin())
    const headers = {
      'access-control-allow-origin': origin(),
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'Content-Type, X-Aimer-Account',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (request.method() !== 'GET') writes.push({ method: request.method(), body: request.postDataJSON(), uid: request.headers()['x-aimer-account'] })
    if (request.method() === 'POST') {
      signedIn = true
      if (request.postDataJSON().idToken === 'phone-token') Object.assign(user, { uid: 'phone-uid', name: null, email: null, signInMethod: 'phone' })
    }
    if (request.method() === 'DELETE') signedIn = false
    await route.fulfill({
      headers,
      json: request.url().endsWith('/session')
        ? { user: signedIn ? user : null }
        : { profile: { ...user, interests: ['Science'], mobileNumber: null, onboardingComplete: complete } },
    })
  })
  return writes
}

test('guest popup preserves lesson, keyboard focus and central return URL', async ({ page }) => {
  await setup(page)
  await page.goto('/#/searching/binary-search')
  const trigger = page.locator('#account-trigger')
  await trigger.click()
  await expect(page.locator('#account-dialog')).toBeVisible()
  const fallback = new URL((await page.locator('#central-login').getAttribute('href')) as string)
  expect(fallback.searchParams.has('returnTo')).toBe(false) // localhost is never a trusted return destination
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(page).toHaveURL(/#\/searching\/binary-search$/)
  await trigger.click()
  await page.locator('#email-toggle').click()
  await page.locator('#email-signup-tab').click()
  await expect(page.locator('#signup-name')).toBeVisible()
  await page.locator('#email-signin-tab').click()
  await page.locator('#signin-email').fill('ada@example.test')
  await page.locator('#forgot-password').click()
  await expect(page.locator('#auth-status')).toContainText('If an eligible account exists')
})

test('existing session loads common profile and shared logout', async ({ page }) => {
  const writes = await setup(page, true)
  await page.goto('/')
  await expect(page.locator('#account-label')).toHaveText('Ada')
  await page.locator('#account-trigger').click()
  await expect(page.locator('#account-links a').filter({ hasText: 'Profile' })).toHaveAttribute('href', 'https://tools.aimersociety.com/profile')
  await page.locator('#google-logout').click()
  await expect(page.locator('#account-label')).toHaveText('Continue to login')
  expect(writes.some((w) => w.method === 'DELETE')).toBe(true)
})

for (const method of ['google', 'email', 'signup']) {
  test(`${method} uses central session and preserves interests when skipping`, async ({ page }) => {
    const writes = await setup(page, false, false)
    await page.goto('/#/searching/binary-search')
    await page.locator('#account-trigger').click()
    if (method === 'google') await page.locator('#google-login').click()
    else {
      await page.locator('#email-toggle').click()
      if (method === 'signup') {
        await page.locator('#email-signup-tab').click()
        await page.locator('#signup-name').fill('Ada Learner')
      }
      await page.locator('#signin-email').fill('ada@example.test')
      await page.locator('#signin-password').fill('example-password')
      await page.locator('#email-submit').click()
      if (method === 'signup') {
        await expect(page.locator('#email-verification')).toBeVisible()
        expect(writes.some((w) => w.method === 'POST')).toBe(false)
        await page.locator('#resend-verification').click()
        await page.locator('#check-verification').click()
      }
    }
    await expect(page.locator('#onboarding-dialog')).toBeVisible()
    if (method === 'google') await page.screenshot({ path: test.info().outputPath('onboarding.png'), fullPage: true })
    await page.locator('#onboarding-skip').click()
    await expect(page.locator('#onboarding-dialog')).not.toBeVisible()
    expect(writes.find((w) => w.method === 'POST')?.body).toEqual({ idToken: 'mock-token' })
    const patch = writes.find((w) => w.method === 'PATCH')!
    expect(patch.uid).toBe(user.uid)
    expect(patch.body).toEqual({ interests: ['Science'], onboardingComplete: true })
    await expect(page).toHaveURL(/#\/searching\/binary-search$/)
  })
}

test('expired session and non-JSON errors remain readable', async ({ page }) => {
  await setup(page)
  await page.route('https://tools.aimersociety.com/api/session', (route) =>
    route.fulfill({
      status: 401,
      json: { error: 'expired' },
      headers: { 'access-control-allow-origin': origin(), 'access-control-allow-credentials': 'true' },
    }),
  )
  await page.goto('/')
  await page.locator('#account-trigger').click()
  await expect(page.locator('#auth-status')).toContainText('session expired')
  await page.route('https://tools.aimersociety.com/api/session', (route) =>
    route.fulfill({
      status: 503,
      body: '<html>Unavailable</html>',
      headers: { 'access-control-allow-origin': origin(), 'access-control-allow-credentials': 'true' },
    }),
  )
  await page.locator('#auth-retry').click()
  await expect(page.locator('#auth-status')).toContainText('unavailable')
})

test('safe returns reject credentials, untrusted hosts, protocols and loops', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  const results = await page.evaluate(async () => {
    // @ts-expect-error Shared browser module is served as a static asset.
    const { safeReturnTo } = await import('/account/account-client.mjs')
    return [
      'https://algorithms.aimersociety.com/#/searching/binary-search',
      'https://evil.example/',
      'https://aimersociety.com.evil.example/',
      'https://user:pass@algorithms.aimersociety.com/',
      'javascript:alert(1)',
      'http://algorithms.aimersociety.com/',
      'https://tools.aimersociety.com/?login=1&returnTo=https://tools.aimersociety.com/',
    ].map(safeReturnTo)
  })
  expect(results[0]).toBe('https://algorithms.aimersociety.com/#/searching/binary-search')
  expect(results.slice(1)).toEqual([null, null, null, null, null, null])
})

test('personalization cannot save stale data after the shared account changes', async ({ page }) => {
  const writes = await setup(page, true, false)
  await page.goto('/')
  await page.locator('#account-trigger').click()
  await page.locator('#personalize-learning').click()
  await expect(page.locator('#onboarding-dialog')).toBeVisible()
  await page.route('https://tools.aimersociety.com/api/session', (route) =>
    route.fulfill({
      json: { user: { ...user, uid: 'other-uid' } },
      headers: { 'access-control-allow-origin': origin(), 'access-control-allow-credentials': 'true' },
    }),
  )
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.locator('#onboarding-dialog')).not.toBeVisible()
  expect(writes.some((w) => w.method === 'PATCH')).toBe(false)
})

test('phone validates national number, supports invalid-code recovery and phone-only sessions', async ({ page }) => {
  const writes = await setup(page)
  await page.goto('/#/graphs/daa-bfs')
  await page.locator('#account-trigger').click()
  await expect(page.locator('#phone-toggle')).toBeVisible()
  await page.locator('#phone-toggle').click()
  await expect(page.locator('#google-login')).toBeHidden()
  await expect(page.locator('#email-auth')).toBeHidden()
  await expect(page.locator('#phone-country')).toHaveValue('IN')
  await expect(page.locator('#phone-country-flag')).toHaveAttribute('src', '/account/assets/flags/IN.svg')
  await page.locator('#login-phone').fill('123')
  await page.locator('#phone-send').click()
  await expect(page.locator('#phone-number-error')).toContainText('valid mobile number')
  expect(writes.length).toBe(0)
  await page.locator('#login-phone').fill('9876543210')
  await page.locator('#phone-send').click()
  await expect(page.locator('#phone-code-form')).toBeVisible()
  await expect(page.locator('#phone-resend')).toBeDisabled()
  await page.locator('#phone-code').fill('000000')
  await page.locator('#phone-verify').click()
  await expect(page.locator('#phone-code-error')).toContainText('incorrect')
  await page.locator('#phone-code').fill('123456')
  await page.locator('#phone-verify').click()
  await expect(page.locator('#account-label')).toHaveText('My account')
  await expect(page.locator('#account-dialog')).toBeHidden()
  expect(writes.find((w) => w.method === 'POST')?.body).toEqual({ idToken: 'phone-token' })
  await page.locator('#account-trigger').click()
  await expect(page.locator('#profile-email')).toHaveText('Signed in with phone')
  await expect(page.locator('#phone-toggle')).toBeHidden()
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => /firebase:authUser|token/i.test(key)))).toBe(false)
  await expect(page).toHaveURL(/#\/graphs\/daa-bfs$/)
})

for (const viewport of [
  { width: 320, height: 640 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 1280, height: 720 },
  { width: 1536, height: 864 },
])
  test(`compact account layout ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await setup(page)
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.locator('#account-trigger').click()
    for (const id of ['google-login', 'email-toggle', 'phone-toggle']) await expect(page.locator('#' + id)).toBeVisible()
    const size = await page.locator('#account-dialog').evaluate((el) => ({ w: el.clientWidth, sw: el.scrollWidth, h: el.clientHeight, sh: el.scrollHeight }))
    expect(size.sw).toBeLessThanOrEqual(size.w + 1)
    if (viewport.width >= 1280) expect(size.sh).toBeLessThanOrEqual(size.h + 1)
    await page.locator('#account-dialog').screenshot({ path: test.info().outputPath(`account-${viewport.width}.png`) })
    await page.locator('#phone-toggle').click()
    await expect(page.locator('#google-login')).toBeHidden()
    await page.locator('#auth-back').click()
    await page.locator('#email-toggle').click()
    await expect(page.locator('#phone-auth')).toBeHidden()
    await page.locator('#email-signup-tab').click()
    await expect(page.locator('#signup-name')).toBeVisible()
    expect(await page.locator('#signup-mobile').count()).toBe(0)
    await page.keyboard.press('Escape')
    await expect(page.locator('#account-trigger')).toBeFocused()
  })

test('forms remain usable with a short viewport and enlarged text', async ({ page }) => {
  await setup(page)
  await page.setViewportSize({ width: 390, height: 360 })
  await page.goto('/')
  await page.addStyleTag({ content: '#aimer-account-root {font-size:20px} #aimer-account-root input {font-size:20px}' })
  await page.locator('#account-trigger').click()
  await page.locator('#phone-toggle').click()
  await page.locator('#login-phone').fill('123')
  await page.locator('#phone-send').click()
  await expect(page.locator('#phone-number-error')).toBeVisible()
  await page.locator('#account-close').click()
  await expect(page.locator('#account-dialog')).toBeHidden()
})

test('country changes use local flags and reject pasted country codes', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  await page.locator('#account-trigger').click()
  await page.locator('#phone-toggle').click()
  await page.locator('#phone-country').selectOption('US')
  await expect(page.locator('#phone-country-flag')).toHaveAttribute('src', '/account/assets/flags/US.svg')
  await page.locator('#login-phone').fill('+1 202 555 0123')
  await page.locator('#phone-send').click()
  await expect(page.locator('#phone-number-error')).toContainText('without +country code')
  await page.locator('#phone-country').selectOption('IN')
  await page.locator('#login-phone').fill('9876543210')
  await page.locator('#phone-send').click()
  await expect(page.locator('#phone-code-form')).toBeVisible()
  await page.locator('#phone-change').click()
  await expect(page.locator('#login-phone')).toHaveValue('9876543210')
  await expect(page.locator('#phone-code-form')).toBeHidden()
  await page.locator('#phone-send').click()
  await expect(page.locator('#auth-status')).toContainText('wait')
})
for (const size of [
  { width: 1280, height: 720 },
  { width: 1536, height: 864 },
])
  test(`signed-in menu fits ${size.width}`, async ({ page }) => {
    await setup(page, true)
    await page.setViewportSize(size)
    await page.goto('/')
    await page.locator('#account-trigger').click()
    await expect(page.locator('#google-login')).toBeHidden()
    const fit = await page.locator('#account-dialog').evaluate((el) => el.scrollHeight <= el.clientHeight + 1)
    expect(fit).toBe(true)
    await page.locator('#account-dialog').screenshot({ path: test.info().outputPath('signed-menu.png') })
  })

test('desktop service-error popup stays compact without concealing error or legal links', async ({ page }) => {
  await setup(page)
  await page.route('https://tools.aimersociety.com/api/session', (route) => route.abort('failed'))
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await page.locator('#account-trigger').click()
  await expect(page.locator('#auth-status')).toContainText('reach AIMER accounts')
  await expect(page.locator('#auth-retry')).toBeVisible()
  await expect(page.locator('.account-privacy')).toBeVisible()
  const fit = await page.locator('#account-dialog').evaluate((e) => ({ height: e.clientHeight, scroll: e.scrollHeight }))
  expect(fit.scroll).toBeLessThanOrEqual(fit.height + 1)
  await page.locator('#account-dialog').screenshot({ path: test.info().outputPath('account-service-error.png') })
})
