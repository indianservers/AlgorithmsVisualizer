import { test, expect, type Page } from '@playwright/test'

// Authentication dialogs exercise several async UI steps on desktop and mobile.
test.setTimeout(60_000)

const origin = () => new URL(test.info().project.use.baseURL!).origin
const user = { uid: 'mock-uid', name: 'Ada Learner', email: 'ada@example.test', picture: null }
async function setup(page: Page, signedIn = false, complete = true) {
  const writes: { method: string; body: Record<string, unknown>; uid?: string }[] = []
  await page.route('https://www.gstatic.com/firebasejs/**', async (route) => {
    const body = route.request().url().endsWith('firebase-app.js')
      ? 'export const initializeApp = x => x;'
      : `const u = { uid:'mock-uid', emailVerified:true, getIdToken:async()=> 'mock-token' };
         export const getAuth=()=>({}); export class GoogleAuthProvider {};
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
    if (request.method() === 'POST') signedIn = true
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
