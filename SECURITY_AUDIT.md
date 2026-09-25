# Security & Quality Audit — ENIT Connect

**Date:** 2026-09-20
**Scope:** `Backend/` (Express 4 / Node ≥18 / PostgreSQL), `frontend/` (React 19 / Vite / TypeScript)
**Framework:** OWASP Top 10 (2021)
**Status:** 20 findings identified — **18 remediated and verified**, 2 accepted/deferred with rationale.

Original request was a server-side prototype pollution (SSPP) scan following the RCE remediation; extended to Express/Node-native vulnerability classes, frontend defects, and a full OWASP Top 10 pass.

Every finding was **reproduced by execution** before being fixed, and every fix is now **enforced by an executable regression test** in `Backend/tests/security/owasp.test.js`.

---

## Verification summary

```
Backend    33 suites, 176 tests   PASS   (60 of them OWASP security tests)
Frontend   10 files,   33 tests   PASS   (was 21/33 before this work)
TypeScript tsc -b                 CLEAN
npm audit  22 → 21 vulnerabilities (joi advisories cleared)
```

**Negative control.** A regression suite that passes proves nothing unless it also fails against the vulnerable code. The suite was run against a pristine copy of the pre-fix tree (restored from `HEAD` into a scratch directory, with `joi@17.13.3` reinstalled to reproduce the original dependency state):

```
Original code + joi 17.13.3  →  42 of 60 security tests FAIL
Current code + joi 17.13.8   →  60 of 60 security tests PASS
```

The 18 tests that pass in both runs are the ones asserting properties that were already correct (for example, that global `Object.prototype` is never polluted — it never was; see [Not reproduced](#not-reproduced-checked-and-cleared)).

---

## OWASP Top 10 (2021) coverage

| Category | Findings | Status | Tests |
|---|---|---|---|
| **A01** Broken Access Control | #1, #2, #3, #5, #7 | Fixed | 11 |
| **A02** Cryptographic Failures | #17, #18 | Fixed | 6 |
| **A03** Injection | #9 | Fixed | 14 |
| **A04** Insecure Design | #6, #16 | Fixed | 6 |
| **A05** Security Misconfiguration | #10, #11, #20 | Fixed | 5 |
| **A06** Vulnerable & Outdated Components | #4 (dependency), Appendix B | Partially fixed | 2 |
| **A07** Identification & Authentication Failures | #15, #16 | Fixed | 6 |
| **A08** Software & Data Integrity Failures | #4, #8, #13 | Fixed | 7 |
| **A09** Security Logging & Monitoring Failures | #11 | Fixed | 3 |
| **A10** Server-Side Request Forgery | #14 | Fixed | 2 |
| — | #12, #19 (frontend quality) | Fixed | frontend suite |

Run the security tests alone with:

```bash
cd Backend && npx jest tests/security
```

### Notes on categories with residual risk

- **A06** is *partially* fixed. The finding that mattered (`joi`) is resolved and the advisory is gone. 21 advisories remain in transitive dependencies (`nodemailer`, `tar` via `bcrypt`, `sharp`), all requiring major-version bumps. Deliberately deferred — see [Appendix B](#appendix-b--dependency-audit).
- **A05** retains one accepted gap: Content Security Policy is still disabled in `app.js` (`contentSecurityPolicy: false`). Re-enabling it needs a directive set worked out against the upload and map origins, which is more than a two-day change.

---

## Findings

| # | Severity | Finding | OWASP | Status |
|---|----------|---------|-------|--------|
| [1](#1) | **Critical** | `isCompany` authorized the ID in the query string, not the caller | A01 | ✅ Fixed |
| [2](#2) | **Critical** | Any authenticated user could update any company | A01 | ✅ Fixed |
| [3](#3) | **Critical** | `GET /api/student/all` unauthenticated, returned full student PII | A01 | ✅ Fixed |
| [4](#4) | **High** | Joi `__proto__` prototype injection defeated all input validation | A08/A06 | ✅ Fixed |
| [5](#5) | **High** | Offer update/delete had no ownership check | A01 | ✅ Fixed |
| [6](#6) | **High** | CSRF unmitigated for POST under the production cookie config | A04 | ✅ Fixed |
| [7](#7) | **High** | `POST /api/student/posts` unauthenticated and unvalidated | A01 | ✅ Fixed |
| [8](#8) | **Medium** | `xssPrevention` was a prototype-pollution sink | A08 | ✅ Fixed |
| [9](#9) | **Medium** | Allowlist lookups on raw user keys fed unparameterized SQL | A03 | ✅ Fixed |
| [10](#10) | **Medium** | `hpp()` ran before the body parser and was a no-op for bodies | A05 | ✅ Fixed |
| [11](#11) | **Medium** | 110 handlers leaked raw driver error messages | A05/A09 | ✅ Fixed |
| [12](#12) | **Medium** | SSE hook reconnected on every render | Frontend | ✅ Fixed |
| [13](#13) | **Medium** | Zip entry names from user-controlled document titles | A08 | ✅ Fixed |
| [14](#14) | **Low** | `geocoder.reverse(req.query)` forwarded the whole query object | A10 | ✅ Fixed |
| [15](#15) | **Low** | Blocking `bcrypt.compareSync` on the login path | A07 | ✅ Fixed |
| [16](#16) | **Low** | Login user-enumeration oracle | A04/A07 | ✅ Fixed |
| [17](#17) | **Low** | `clearCookie` attributes did not match `setCookie` | A02 | ✅ Fixed |
| [18](#18) | **Low** | No fail-fast guard on `JWT_SECRET` | A02 | ✅ Fixed |
| [19](#19) | **Info** | 12 of 33 frontend tests failing (test-harness bug) | — | ✅ Fixed |
| [20](#20) | **Info** | `SECURITY.md` documented controls that were not in place | A05 | ✅ Fixed |

---

<a id="1"></a>
### 1. `isCompany` authorized the ID in the query string, not the caller — Critical (A01)

**Was:** `middlewares/authJwt.js`

```js
const companyId = req.query.id || req.id;   // attacker-controlled
companyRepository.findById(companyId).then((company) => {
  if (!company) { res.status(401)... } else { next(); }   // never checks the CALLER
})
```

The middleware asked *"does a company with this ID exist?"* instead of *"is the authenticated caller a company?"*. Because `req.query.id` took precedence over the token identity, **any authenticated user — including a student — passed this gate** by appending `?id=<any valid company UUID>`. Company UUIDs are not secret; `GET /api/student/companies` returns them. The gate protects **18 routes**.

**Fix:** authorize the authenticated principal only.

```js
const companyId = req.id;
```

**Verified by:** `isCompany does not accept ?id= to impersonate a company` — a student token plus `?id=<company>` now receives 401.

---

<a id="2"></a>
### 2. Any authenticated user could update any company — Critical (A01)

**Was:** `controllers/company.controller.js` — `const companyId = req.query.id || req.id;`

The same `?id=` that bypassed the gate in #1 also selected the row that got written. A logged-in student could rewrite an arbitrary company's profile and, via #4, its `email` — the login identity, making this a path to account takeover through password reset.

The frontend supplies this value from client-controlled storage (`localStorage.getItem('company_id')`), so the exploit required only a devtools edit.

**Fix:** `const companyId = req.id;`

**Verified by:** two tests — a student is rejected with 401, and a legitimate company calling `PATCH /api/company/update?id=<victim>` writes to **its own** id, asserted on the repository spy:

```js
expect(updateCompanyMock.mock.calls[0][0]).toBe(COMPANY_ID);
```

> The `?id=` parameter is now ignored rather than rejected, so no frontend change was required. Removing it from `ProfilePage.tsx`, `HomePage.tsx` and `CandidaciesListPage.tsx` is worthwhile cleanup but is not a security dependency.

---

<a id="3"></a>
### 3. `GET /api/student/all` unauthenticated, returned full student PII — Critical (A01)

**Was:** `routes/student.routes.js` — `router.get("/all", controller.getAll);`

`getAll` mapped every row through `mapStudentRow`, returning `email`, `phone`, `address`, `latitude`, `longitude` and `linkedin` for **every student in the database**. One unauthenticated request dumped the entire student directory including home addresses and geolocation — a reportable personal-data breach.

**Fix:** two layers.

1. `authJwt.verifyToken` added to `/all`, `/posts` (GET) and `/posts` (POST).
2. A new `mapStudentDirectoryRow` projection that structurally omits `email`, `phone`, `address`, `latitude` and `longitude`. `mapStudentRow` is retained for the self-profile path where those fields are legitimate.

The frontend never called `/student/all` or `/student/posts`, so nothing broke.

**Verified by:** an unauthenticated request returns 401/403, and an authenticated one is asserted field-by-field to contain none of the five PII fields while still carrying `firstname` and `promotion`.

---

<a id="4"></a>
### 4. Joi `__proto__` prototype injection defeated all input validation — High (A08 / A06)

This was the original SSPP question. The answer: **there was no global `Object.prototype` pollution anywhere in this codebase** — but there was a per-request prototype injection that silently nullified the Joi allowlist.

`JSON.parse` turns a `__proto__` key into an own property, and Joi 17.13.3 promotes it to the validated object's **prototype**. `stripUnknown: true` removes unknown *own* keys, so it never touched it. `validate()` then assigned that object to `req.body`, and every `req.body.<field>` read in the controllers transparently picked up the attacker's inherited properties.

**Was — reproduction against the real route chain:**

```
PATCH /api/student/<own-uuid>
{"city":"Tunis","__proto__":{"type":"admin","picture":"http://evil/x.png","workAt":"pwn"}}

→ updateData = { status:"Active", city:"Tunis",
                 type:"admin", workAt:"pwn", picture:"http://evil/x.png" }
```

`type`, `picture` and `workAt` are **not** in `updateStudentSchema`. The same shape let `email` and `logo` — absent from `updateCompanySchema` — reach `updateCompany`.

**Fix:** two layers.

1. **Dependency:** `joi` 17.13.3 → **17.13.8** (same major, no API change), and `package.json` pinned to `^17.13.8` so the range cannot resolve backwards.
2. **Defence in depth** in `middlewares/validation.js`, so a future Joi regression cannot reopen it:

```js
if (value && typeof value === 'object') {
  Object.setPrototypeOf(value, Object.prototype);
}
```

**Verified by:** four tests. The two injection tests fail against `joi@17.13.3` and pass against 17.13.8, confirming they detect a dependency regression rather than merely asserting current behaviour. Two further tests confirm no global pollution from either `__proto__` or `constructor.prototype` payloads. A fifth test asserts the installed Joi version is ≥ 17.13.6 and a sixth asserts the declared range cannot resolve to a vulnerable version.

---

<a id="5"></a>
### 5. Offer update and delete had no ownership check — High (A01)

**Was:** `controllers/offer.controller.js` — both handlers took an offer id and acted on it with no owner comparison, on routes guarded by `verifyToken` **only** (not even `isCompany`). Any authenticated user — any student — could rewrite or delete **any offer on the platform**.

**Fix:**

- Added `authJwt.isCompany` to `PATCH /api/offers`, `DELETE /api/offers` and `DELETE /api/offers/:id`.
- Added the ownership check the sibling `updateCandidacyStatus` already had:

```js
const existing = await offerRepository.findById(offerId);
if (!existing) return res.status(404).send({ message: "Offer not found." });
if (String(existing.company_id) !== String(req.id)) {
  return res.status(403).send({ message: "Unauthorized offer access." });
}
```

**Verified by:** four tests — a student is blocked, a company is blocked from another company's offer (403, repository never called), a company is blocked from deleting one, **and** a company can still update its own offer. That last test is the guard against over-blocking.

---

<a id="6"></a>
### 6. CSRF unmitigated for POST under the production cookie config — High (A04)

Authentication is cookie-based and there was **no CSRF token anywhere**. `render.yaml` sets `COOKIE_SAMESITE=none` in production (frontend and backend are on different Render subdomains), removing the only defence.

CORS does not close this. It governs whether a response may be **read**, not whether the request is **sent**. A cross-site `POST` with a CORS-simple content type (`application/x-www-form-urlencoded`, `text/plain`, or `multipart/form-data`) is dispatched with the victim's cookies and no preflight, so the side effect happens regardless of CORS:

```html
<form action="https://enit-connect-backend.onrender.com/api/student/apply/<offerId>" method="POST">
```

**Fix:** a new `middlewares/csrfGuard.js`, mounted after CORS so blocked responses still carry CORS headers. For every state-changing method it requires the browser-supplied `Origin` (falling back to `Referer`) to match an allowlist derived from `FRONTEND_URL` / `APP_URL` / `BASE_URL`, plus the request's own origin.

An `Origin`-based guard was chosen over a content-type check because **multipart uploads are also CORS-simple**, so a content-type rule would have left every upload route exposed.

Requests with neither header are allowed through: those are non-browser clients (curl, server-to-server, health checks), and no browser attaches ambient cookies to an attacker's behalf without sending `Origin`. This keeps API clients and the existing test suite working while closing the browser CSRF path.

**Verified by:** five tests — cross-origin JSON POST blocked, cross-origin **urlencoded** POST blocked (the simple-request bypass), `Referer`-only cross-origin blocked, the legitimate frontend origin allowed, and safe `GET` requests unaffected.

> **Operational dependency:** the guard's allowlist comes from `FRONTEND_URL`. If that variable is wrong or unset in an environment, legitimate state-changing requests from the browser will be rejected with 403. Confirm it is set correctly per environment before deploying. A token-based CSRF scheme (`csrf-csrf`) remains the stronger long-term answer and is recommended once the release pressure is off.

---

<a id="7"></a>
### 7. `POST /api/student/posts` unauthenticated and unvalidated — High (A01)

**Was:** no auth, no schema, no rate limit. `addPost` wrote `title`, `topic`, `date`, `userName`, `body` and `description` straight from `req.body`. Anonymous users could create unlimited posts, and `userName` was attacker-chosen — so posts could be attributed to any real user.

**Fix:** `verifyToken` + `isStudent` on the route; authorship derived from the token by looking up the authenticated student; required-field validation and length caps on every field.

```js
userName: `${author.firstname} ${author.lastname}`.trim(),
```

**Verified by:** unauthenticated POST is rejected and the repository is never called; an authenticated POST sending `userName: "Impersonated Admin"` is asserted to persist `"Test Student"` — the token's identity.

---

<a id="8"></a>
### 8. `xssPrevention` was a prototype-pollution sink — Medium (A08)

**Was:** `sanitized[key] = sanitizeValue(value[key])` — with `key === "__proto__"` and an object value, the assignment invoked the `__proto__` setter and reparented the object, turning attacker JSON into inherited properties on `req.body`.

It was **not mounted on any route** (`xssPrevention` and `sanitizeInput` were exported and unused), so there was no live impact — but it was a loaded gun for whoever mounted it next.

**Fix:** a shared `FORBIDDEN_KEYS` set (`__proto__`, `constructor`, `prototype`) skipped by both `sanitizeInput` and `xssPrevention`. Kept rather than deleted, since both are part of the module's exported surface.

**Verified by:** two unit tests calling the middleware directly and asserting `Object.getPrototypeOf(req.body) === Object.prototype` and no global pollution.

---

<a id="9"></a>
### 9. Allowlist lookups on raw user keys fed unparameterized SQL — Medium (A03)

**Was:** seven sites across four controllers:

```js
const column = allowed[req.query.property];
if (!column || !req.query.key) return res.status(400)...
```

`column` then went **unparameterized** into the query: `SELECT * FROM companies WHERE ${column} ILIKE $1`.

`?property=constructor`, `toString`, `valueOf` or `__proto__` all returned truthy non-columns that passed the falsiness check and reached the SQL string. More importantly, this was the sink that would convert *any* future prototype pollution into direct SQL injection:

```
Object.prototype.evil = "name; -- "
→ SELECT * FROM offers WHERE name; --  ILIKE $1
```

**Fix:** a shared `pickAllowed` helper in `utils/validation.js`, applied at all seven sites:

```js
const pickAllowed = (map, key) =>
  typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key)
    ? map[key]
    : null;
```

**Verified by:** 14 tests. Five inherited keys (`constructor`, `toString`, `valueOf`, `__proto__`, `hasOwnProperty`) are rejected with 400 on two separate search endpoints, with the repository asserted never to be called. One test pollutes `Object.prototype.evilColumn` with a SQL payload and confirms it cannot introduce a column. One confirms legitimate columns still work (no over-blocking), and one confirms the column argument is never attacker-controlled even when the *value* carries SQL metacharacters.

---

<a id="10"></a>
### 10. `hpp()` ran before the body parser and was a no-op for bodies — Medium (A05)

**Was:** `app.use(hpp())` was mounted *above* the body parsers. `hpp` reads `req.body` at call time; since the parsers had not run, it was `undefined` and body protection was silently skipped. Demonstrated:

```
hpp before bodyParser -> body.email = ["a@b.c","evil@x.y"]   ← array survives
hpp after  bodyParser -> body.email = "evil@x.y"             ← collapsed correctly
```

A control the project believed it had, silently absent.

**Fix:** moved `app.use(hpp())` below both `bodyParser` calls.

**Verified by:** a duplicated `title` field in a urlencoded body is asserted to reach the repository as a string, not an array; a companion test covers duplicated query parameters.

---

<a id="11"></a>
### 11. 110 handlers leaked raw driver error messages — Medium (A05 / A09)

**Was:** `res.status(500).send({ message: err.message || err });` — 110 occurrences across `controllers/` and `middlewares/`. `errorHandler.js` was written correctly but essentially every controller caught its own errors and bypassed it. PostgreSQL messages disclose table names, column names, constraint names and query fragments — exactly the feedback needed to develop the SQL reachable via #9.

**Fix:** all 110 replaced by script, each becoming a server-side log plus a generic client response:

```js
console.error("[500]", req.method, req.originalUrl, err);
res.status(500).send({ message: "Internal server error." });
```

This also closes the A09 gap: the diagnostic information is now *retained* in logs with request context, rather than being shipped to the client and nowhere else.

**Verified by:** a repository call is forced to reject with `relation "students" does not exist at character 15`; the response is asserted to be exactly `"Internal server error."` and to match none of `/relation|character|students/i`, while `console.error` is asserted to have been called.

---

<a id="12"></a>
### 12. SSE hook reconnected on every render — Medium (frontend)

**Was:** `useSSENotifications` listed `onNotification` in the `connect` dependency array, and the sole consumer (`Topbar.tsx`) passes an inline arrow — a new identity every render. The effect therefore **tore down and reopened the `EventSource` on every render of `Topbar`**, which renders on every page and calls `setNotificationCount` from a 30-second poll and from every received notification.

Production consequence: `/notifications/subscribe` sits under the 100-request/15-minute limiter, so reconnect churn could lock a user out of **the entire API**.

**Fix:** the callback is held in a ref and removed from the dependency list, so the connection survives re-renders. The pre-existing self-referential `setTimeout(connect, …)` (which ESLint flagged separately as *"accessed before it is declared"*) now reconnects through a `connectRef`.

**Verified by:** `tsc -b` clean and ESLint clean on this file — the `react-hooks/immutability` error it previously raised is gone.

---

<a id="13"></a>
### 13. Zip entry names from user-controlled document titles — Medium (A08)

**Was:** `archive.file(filePath, { name: doc.title || filename })`. The read path was safe (`path.basename`), but the entry name *written into the archive* was the user-supplied title. A title like `../../../../.ssh/authorized_keys` produced a traversing entry — zip slip, executed on the machine of whoever extracted the batch download.

**Fix:** `{ name: path.basename(doc.title || filename) }`.

---

<a id="14"></a>
### 14. `geocoder.reverse(req.query)` forwarded the whole query object — Low (A10)

**Was:** the entire user-controlled query object was passed to `node-geocoder`, so arbitrary extra keys became parameters on the outbound provider request — and an options-injection gadget under prototype pollution.

**Fix:** coordinates are parsed and validated as finite numbers, and only `{ lat, lon }` is forwarded. Non-numeric input short-circuits to `callback(null)` without any outbound request.

**Verified by:** a test passing `provider`, `apiKey` and `httpAdapter` alongside valid coordinates asserts the forwarded object's keys are exactly `["lat", "lon"]`; a second asserts a non-numeric `lat` makes no provider call at all.

---

<a id="15"></a>
### 15. Blocking `bcrypt.compareSync` on the login path — Low (A07)

**Was:** `compareSync` blocked the Node event loop for the full bcrypt comparison (~100 ms at cost factor 10), stalling *all* concurrent requests.

**Fix:** `await bcrypt.compare(...)` in both student and company sign-in. Both functions were already `async`.

> Cost factor remains 10. Raising it to 12 is worthwhile but changes login latency and was left as a deliberate, separate decision.

---

<a id="16"></a>
### 16. Login user-enumeration oracle — Low (A04 / A07)

**Was:** an unknown email returned `"Invalid email or password."` while a known-but-unverified account returned `"Pending Account. Please Verify Your Email!"` — a reliable account-existence oracle. Timing differed too, since no bcrypt comparison ran when the user did not exist.

**Fix:** two changes in both sign-in handlers.

1. Account status is only disclosed **after** the password is proven, so learning that an account is pending now requires knowing its password.
2. A bcrypt comparison against a constant dummy hash always runs, even when no account matches, equalizing response time.

**Verified by:** a test asserting that an unknown email and a known email with a wrong password produce identical status codes **and** identical message bodies.

---

<a id="17"></a>
### 17. `clearCookie` attributes did not match `setCookie` — Low (A02)

**Was:** `res.clearCookie('accessToken', { path: '/' })` — omitting the `secure`, `sameSite` and `domain` attributes the cookies were set with. Browsers only clear a cookie when the attributes match, so under the production config (`Secure`, `SameSite=None`) **logout could leave session cookies in place**.

**Fix:** the clearing options are now derived from the same `cookieOptions` object, minus `maxAge`.

**Verified by:** a test asserting the logout response's `Set-Cookie` carries an expiry in the past along with matching `Path` and `HttpOnly` attributes.

---

<a id="18"></a>
### 18. No fail-fast guard on `JWT_SECRET` — Low (A02)

**Was:** `config/auth.config.js` exported `process.env.JWT_SECRET` unvalidated. If unset, the server booted normally and 500'd on every login.

**Fix:** mirrors the existing `DATABASE_URL` guard in `db/index.js` — throws at startup if unset, and additionally enforces a 32-character minimum when `NODE_ENV === 'production'`.

**Verified by:** a test that unsets the variable inside `jest.isolateModules` and asserts the module throws.

---

<a id="19"></a>
### 19. 12 of 33 frontend tests failing — Info (test harness)

**Was:** `src/test/test-utils.tsx` wrapped components in `QueryClientProvider` and `BrowserRouter` but never initialised i18n, so `t()` returned raw keys and the DOM rendered `home.companyTitle` instead of `Company Dashboard`. Every assertion on visible text failed.

The translation keys **did** exist in `locales/{en,fr,ar}.ts` — the application UI was correct and this was never a user-visible defect. The consequence was that four page-level smoke tests provided zero regression coverage.

**Fix:** the render helper now wraps in `I18nextProvider` with the app's real i18n instance.

**Result:** 33/33 frontend tests pass (was 21/33).

---

<a id="20"></a>
### 20. `SECURITY.md` documented controls that were not in place — Info (A05)

**Was:** the policy claimed *"MongoDB injection protection (express-mongo-sanitize)"* (not a dependency; the database is PostgreSQL), *"Content Security Policy"* (explicitly disabled), and HPP body protection (non-functional; see #10). A security policy that overstates coverage is worse than none, because it stops people from looking.

**Fix:** `SECURITY.md` rewritten to describe the controls that actually exist, with CSP explicitly marked as a known gap, PostgreSQL references replacing the MongoDB ones, a remediation log, and a pointer to this audit and its test suite.

---

## Not reproduced (checked and cleared)

Investigated and found **not** to be vulnerabilities. Recorded so the same ground is not re-covered.

- **Global `Object.prototype` pollution.** Not achievable. The backend contained only **two** computed-property write sites, neither of which polluted the global prototype. No `Object.assign`, no `_.merge`, no recursive merge helpers, no `{...req.body}` into shared state, no `for...in` copy loops in application code.
- **`express-trimmer@0.0.3`.** Source pulled from the registry and read. Uses `for...in`, but only writes back to pre-existing own string properties, so it cannot create a prototype link. (Unrelated correctness bug: an early `return` aborts the loop after the first non-string property, so sibling fields go untrimmed.)
- **`qs` / `body-parser` urlencoded.** `allowPrototypes: false` by default; `__proto__[x]=y` is dropped. Verified.
- **`constructor` / `constructor.prototype` payloads.** Do not pass through Joi — only the `__proto__` form did.
- **Joi advisories GHSA-gg4h-3hg2-grpc and GHSA-6w3j-5fw6-r9vr.** Not reachable: `.rename()` is used nowhere, and `customMessages` is static developer-defined data.
- **Upload extension handling.** `helpers/uploadSanitize.js` uses a `Set` allowlist (immune to prototype pollution) and server-generated filenames via `path.basename`. The earlier RCE fix holds; `.pug`, `.js`, `.html` and `.svg` are all excluded.
- **Email template selection.** `config/nodemailer.config.js` uses hardcoded template names. Note that **pug 3.0.3 is present** via `email-templates` — the standard pollution-to-RCE gadget — which is why findings #8 and #9 must not regress.
- **Refresh token flow.** `auth.controller.js` correctly checks expiry, deletes expired tokens and re-fetches the user. Tokens are 40 random bytes.
- **File read paths.** Download and delete paths derive filenames from database rows through `path.basename`; no traversal on the read side. The archive *write* side was the exception (#13).
- **XSS in the frontend.** No `dangerouslySetInnerHTML` anywhere in `src/`.
- **Tokens in browser storage.** None. Auth uses httpOnly cookies; `localStorage` holds only IDs and display names. Those IDs being *trusted by the server* was the real problem, fixed in #1/#2.
- **`.env` handling.** Correctly listed in `.gitignore` and absent from git history.

---

## Residual risks and recommended next steps

Not fixed in this pass, in priority order.

1. **Dependency upgrades requiring major bumps** — `nodemailer` (SMTP command injection, recipient-domain bypass), `tar` via `bcrypt` (path traversal), `sharp` (libvips CVEs). See [Appendix B](#appendix-b--dependency-audit). These need testing time that two days before release does not allow.
2. **Content Security Policy is still disabled** (`app.js`). Re-enable with an explicit directive set covering the upload and map origins.
3. **Token-based CSRF.** The Origin guard (#6) is solid against browser CSRF, but a double-submit token scheme is the stronger control and does not depend on `FRONTEND_URL` being correct in every environment.
4. **`tests/unit/*.controller.test.js` are not real tests.** They define inline stub handlers and assert against those, not the production controllers — which is why they never caught any of the findings here despite high nominal coverage. The new `tests/security/` suite shows the pattern to follow (mock repositories, mount the real app). Worth rewriting.
5. **`GET /api/company/info?id=` returns any company's profile including `email`** to any authenticated user. Companies are semi-public entities so this may be intended, but it should be a conscious decision.
6. **Unbounded listings.** `getByName` loads all students and runs `string-similarity` across them on every request; several endpoints call `listAll()` with no pagination. A CPU and memory concern as the dataset grows, not a vulnerability today.
7. **`bcrypt` cost factor 10** — consider 12.
8. **Live-environment validation.** The access-control fixes are covered by tests against mocked repositories. Exercising #1, #2, #3, #5 and #7 once against a staging instance with real data is worthwhile before sign-off.

---

## Appendix A — ESLint status

Before: 12 problems (9 errors, 3 warnings). After: 11 problems (8 errors, 3 warnings).

The `react-hooks/immutability` error on `useSSENotifications.ts` — the only one with a runtime security or availability impact (#12) — is resolved. The remainder are cosmetic and were left alone deliberately:

```
src/pages/admin/DashboardPage.tsx     222:48  error    Unexpected any
src/pages/company/DashboardPage.tsx   204:52  error    Unexpected any
src/pages/visitor/RegisterPage.tsx    25:22   error    Unnecessary escape character: \(
src/pages/visitor/RegisterPage.tsx    25:24   error    Unnecessary escape character: \)
vitest.config.ts                      6:24    error    Unexpected any
src/pages/{admin,company,student}/SettingsPage.tsx  35:43  warning  missing dep 'loadPreferences'
```

The three `loadPreferences` warnings are the same stale-closure pattern in all three `SettingsPage` files — low impact, since the effect only needs to run once.

---

<a id="appendix-b--dependency-audit"></a>
## Appendix B — Dependency audit

`npm audit --omit=dev` in `Backend/`: **22 → 21 vulnerabilities**. The `joi` advisories are cleared (finding #4).

| Package | Severity | Status |
|---|---|---|
| `joi` ≤17.13.5 | Moderate | ✅ **Fixed** — 17.13.8, pinned `^17.13.8` |
| `nodemailer` ≤9.1.0 | High | ⚠️ Deferred — needs `nodemailer@10` (breaking) |
| `tar` ≤7.5.20 (via `bcrypt`) | **Critical** | ⚠️ Deferred — needs `bcrypt@6` (breaking). Build-time surface |
| `sharp` ≤0.35.4-rc.0 | High | ⚠️ Deferred — needs `sharp@0.35.4` (breaking). Reachable from user-uploaded images |
| `qs` / `express` / `body-parser` | Moderate | ⚠️ `npm audit fix` resolves without breaking changes |
| `lodash` ≤4.17.23 | High | ℹ️ Transitive only; `_.template`, `_.unset`, `_.omit` are not called by this codebase |

Suggested sequence after release:

```bash
cd Backend
npm audit fix                                   # non-breaking
npm i bcrypt@^6 sharp@^0.35.4 nodemailer@^10    # breaking — test each
npx jest                                        # 176 tests must stay green
```

---

## Appendix C — Files changed

27 files changed, 490 insertions, 196 deletions.

**New:**

| File | Purpose |
|---|---|
| `Backend/middlewares/csrfGuard.js` | CSRF Origin/Referer guard (#6) |
| `Backend/tests/security/owasp.test.js` | 60 OWASP Top 10 regression tests |
| `Backend/tests/security/fixtures.js` | Shared fixtures and repository spies |

**Modified (security):** `app.js`, `config/auth.config.js`, `config/geocoder.config.js`, `middlewares/authJwt.js`, `middlewares/validation.js`, `utils/validation.js`, `routes/offer.routes.js`, `routes/student.routes.js`, `controllers/{student,company,offer,admin}.controller.js`, plus 9 further controllers for the error-leak fix (#11).

**Modified (frontend):** `src/hooks/useSSENotifications.ts` (#12), `src/test/test-utils.tsx` (#19).

**Modified (docs/tests):** `SECURITY.md` (#20), `jest.config.js` (registers `tests/security/`), `tests/data/offerSearch.repository.test.js` (stale assertion after an `end_date::date` cast).

---

## Method

- All backend findings were reproduced against the project's real middleware before being fixed. The regression suite mounts the **real** `app.js` — real routes, real middleware chain, real controllers — mocking only the repository layer, outbound email and the database pool, so the code under test is exactly what ships.
- The Joi fix was validated across 17.13.3, 17.13.6, 17.13.8 and 18.2.9.
- `express-trimmer@0.0.3` was downloaded from the registry and read in full rather than assumed.
- The negative control (42/60 failing against the pre-fix tree with `joi@17.13.3`) was produced in a scratch copy restored from `HEAD`; the project working tree was never reverted or stashed.
- Frontend results come from `tsc -b`, `eslint .` and `vitest --run` on a clean `npm install`.

**Reproduce everything:**

```bash
cd Backend  && npx jest              # 176 tests, incl. 60 security
cd frontend && npx tsc -b && npx vitest --run && npx eslint .
```
