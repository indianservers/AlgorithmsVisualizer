# Shared AIMER account integration

## Architecture and migration

The target is the React/Vite AlgorithmsVisualizer at `https://algorithms.aimersociety.com`.
The source reference was read directly from `C:\Indian Servers\Tools Dashboard`,
including current account/phone/onboarding assets, central API handlers,
profile page, identity guards and all four database migrations. Live public Tools
assets were also inspected; the obsolete tall popup was replaced.

`src/account/shell.html` contains exactly one account dialog and one optional
personalization dialog. `bootstrap.ts` loads onboarding, libphonenumber and auth
in that order. Auth now loads Firebase only when a provider needs it; recognizing
an existing central session does not depend on the Firebase CDN. Account UI CSS
is scoped to the widget. Dialog/script/style resources have a new cache version.
No service worker or competing token store was found.

Google, email and phone all POST a fresh `{ idToken }` to the central session
service with credentials included. Firebase uses memory-only persistence and is
signed out after the shared session exchange. Pending verification and OTP state
stay in memory until completed or cancelled. Google/email verification is required;
phone identities need neither an email nor a display name. No accounts are linked
by matching email or optional contact numbers.

Every session/profile call uses `https://tools.aimersociety.com`,
`credentials: include`, and `cache: no-store`. Profile PATCH includes the verified
UID in `X-Aimer-Account`; only optional contact/interests/onboarding fields are
written here. Tools-specific `learning` fields are never written. Guest and
existing device-local favorites, notes, experiments and progress are preserved;
this change does not invent cloud-progress synchronization.

The central profile and legal pages remain on Tools. The local My Learning link
opens the existing DAA learning area. The central fallback carries only the trusted
production HTTPS route, query and hash; localhost, credentials, ports and unsafe
return hosts are rejected. Native dialogs trap focus, restore focus and support
Escape. Forms have labels, autofill, inline errors and 44px targets. The close
control remains available in short viewports. Onboarding stays skippable and does
not interrupt an existing user's public lesson on page load.

Phone validation uses the reference's full libphonenumber metadata and local
country SVGs (licenses retained under `public/account/vendor`). Country and national
number are validated separately and combined into E.164 only after validation.
The current reference reCAPTCHA lifecycle, six-digit confirmation, resend cooldown,
change-number flow and SMS consent are supported. A selectable country does not
promise SMS availability there. The supplied last verified SMS policy was India
only; current private SMS-region settings could not be queried with available
credentials. Provider/region/quota/billing errors do not claim Phone is disabled.

## Production connectivity rechecked 2026-10-21

The earlier origin restriction is resolved. Anonymous `GET /api/session` returns
200 with `{"user":null}`. `OPTIONS /api/session` for POST and `OPTIONS /api/profile`
for PATCH both return 204. All three responses allow the exact origin
`https://algorithms.aimersociety.com` with credentials; profile preflight also
allows Content-Type and X-Aimer-Account. These are read-only connectivity checks,
not proof of real OAuth consent, email delivery or SMS delivery.

## Historical production prerequisites observed 2026-10-16

| Prerequisite                  | Evidence / result                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Firebase authorized domain    | Public Firebase project config lists `algorithms.aimersociety.com` in the existing project (number 593351107909). |
| Trusted return host           | Live Tools `account-client.mjs` explicitly lists `algorithms.aimersociety.com`.                                   |
| Central session GET           | 403 `Origin not allowed` for `Origin: https://algorithms.aimersociety.com`; no credentialed CORS headers.         |
| Session POST/DELETE preflight | Both OPTIONS probes return 403. No POST token exchange or real logout was attempted.                              |
| Profile PATCH preflight       | OPTIONS with Content-Type and X-Aimer-Account returns 403. No profile mutation was attempted.                     |
| Central admin access          | No usable gcloud admin credential or configured Vercel credential/token was available.                            |

The external change required at that time was to append `https://algorithms.aimersociety.com` to
`AUTH_ALLOWED_ORIGINS` on the **central Tools Vercel project's production environment**
without replacing its current entries, then redeploy Tools. Also apply the change
on any intentionally integrated preview environments. Do not wildcard or reflect
arbitrary origins. Firebase domain authorization and the safe-return host already
pass; do not unnecessarily create another project or broaden SMS regions.

After redeployment verify GET and OPTIONS POST/DELETE session requests plus
OPTIONS PATCH profile requests return the exact allowed origin,
`Access-Control-Allow-Credentials: true`, correct methods, and Content-Type /
X-Aimer-Account headers. Session anonymous (200), expired (401), rejected origin
(403) and transport/service errors have distinct UI handling.

## Verification boundaries

Automated browser tests mock Firebase and the central account service, including
phone-only identities, invalid-code recovery, cooldown/change number, signup and
verification/reset, UID ownership checks, optional interests, shared logout,
return routes and layouts at 320/360/390/1280/1536px plus short enlarged-text views.
No real SMS, authentication email, test account creation or production profile
write is authorized or performed by these tests.

Real-user validation is still needed after the central origin fix: Google consent,
email delivery/verification/reset, recent-auth expiry, reCAPTCHA, actual allowed
region SMS delivery, an existing HttpOnly session from another subdomain, shared
logout across tabs, and privacy-mode cookie behavior. Popup rendering and mocked
OTP confirmation alone do not prove those flows. Private backend routes must use
Firebase Admin `verifySessionCookie(cookie, true)` and verified-UID scoping; none
were added here.

## Release checks

Local validation on 2026-10-16: lint, 449 unit tests, TypeScript/Vite production
build and the existing 250 KiB per-chunk budget pass. The chess dependency is in a
separate vendor chunk rather than raising the budget. Account/mobile regression
checks pass against the production preview, including the new DAA header account
control and the 320px/768px layout fixes. Visual account/menu layouts were reviewed
at phone and desktop sizes. The final source also preserves the previously
requested penguin sorting, searching and graph Icons visualizations.
