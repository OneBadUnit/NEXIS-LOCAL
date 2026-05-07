# NEXIS Auth Test Checklist

Run through this checklist after every auth-related code change and before every production deploy.
All tests assume a clean browser session (no existing Supabase cookie/token) unless noted.

---

## 1. Sign-Up

- [ ] Open the app while signed out — the `SignedOutScreen` with email + password fields is shown.
- [ ] Click **Create one** to switch to sign-up mode.
- [ ] Submit with an email that has never been registered.
- [ ] **Expected:** green info message — *"Check your email to confirm your account."*
- [ ] Password field clears; form stays on screen (user is not signed in yet).
- [ ] Check that no Supabase session is created before email confirmation (open DevTools → Application → Local Storage → look for `sb-*` keys; there should be none or only a limbo session with `email_confirmed_at: null`).

---

## 2. Email Confirmation

- [ ] Open the confirmation email from Supabase and click the confirm link.
- [ ] **Expected:** browser redirects back to the app root (`/`).
- [ ] The app should load and immediately show the authenticated dashboard (Supabase sets a session via the URL hash; `onAuthStateChange` picks it up).
- [ ] Verify in DevTools → Application → Local Storage that a `sb-*` token entry exists.

---

## 3. Login — Happy Path

- [ ] Sign out (or open a fresh incognito window).
- [ ] Enter a confirmed account's email and password and click **Sign In**.
- [ ] **Expected:** the dashboard renders immediately with no redirect or extra email sent.
- [ ] Verify the top bar shows the correct email address.

---

## 4. Logout

- [ ] Click **Sign out** in the top bar.
- [ ] **Expected:** `SignedOutScreen` appears immediately.
- [ ] Verify in DevTools → Application → Local Storage that `sb-*` session tokens are cleared.
- [ ] Hard-reload the page — `SignedOutScreen` should still show (no re-authentication from stale storage).

---

## 5. Session Refresh While Logged In

- [ ] Log in normally.
- [ ] Wait on the page or simulate a token refresh (Supabase JS refreshes automatically; you can also manually clear `sb-*-auth-token` in localStorage and reload).
- [ ] **Expected:** the app remains on the dashboard without dropping to `SignedOutScreen`.
- [ ] No new confirmation email is sent.

---

## 6. Page Reload While Logged Out

- [ ] Ensure you are signed out (no `sb-*` storage entries).
- [ ] Hard-reload `https://your-production-url.vercel.app/` and any deep path (e.g. `/somepath`).
- [ ] **Expected:** `SignedOutScreen` always renders — never the dashboard.
- [ ] The `authLoading` spinner should appear briefly, then resolve to the sign-in form.

---

## 7. Bad Password

- [ ] Enter a valid, confirmed email and a wrong password; click **Sign In**.
- [ ] **Expected:** red error message — *"Incorrect email or password."*
- [ ] No email is sent to the user.
- [ ] Form stays interactive; user can retry.

---

## 8. Unconfirmed Account

- [ ] Sign up with a new email but do NOT click the confirmation link.
- [ ] Immediately attempt to sign in with that email and the chosen password.
- [ ] **Expected:** red error message — *"Please confirm your email before signing in."*
- [ ] No new confirmation email is automatically re-sent (Supabase may send one on signup; none should be sent on this failed sign-in attempt).

---

## 9. Rate Limit

- [ ] Attempt sign-up or sign-in with the same email many times in quick succession to trigger Supabase's email rate limit.
- [ ] **Expected:** red error message — *"Too many email attempts. Please wait before trying again."*

---

## 10. URL Tampering

- [ ] While signed out, manually edit the browser URL or append query strings:
  - `?authenticated=true`
  - `?loggedIn=true`
  - `?auth=true`
  - `?bypass=1`
  - `#access_token=fake`
- [ ] **Expected in all cases:** `SignedOutScreen` is shown. No dashboard content is visible.
- [ ] Open DevTools → Console and confirm no errors about invalid sessions.

---

## 11. Password Reset

- [ ] Sign out.
- [ ] On the `SignedOutScreen`, use the **Forgot password** / reset flow (if surfaced) or navigate to the reset overlay.
- [ ] Enter a confirmed account email and submit.
- [ ] **Expected:** Supabase sends a password-reset email; UI confirms it.
- [ ] Click the reset link in the email — app loads and `PasswordRecoveryOverlay` appears.
- [ ] Enter a new password and submit.
- [ ] **Expected:** password is updated; overlay closes; user is on the dashboard.
- [ ] Sign out, then sign in with the **new** password — succeeds.
- [ ] Sign in with the **old** password — fails with *"Incorrect email or password."*

---

## Vercel / Production Checklist

- [ ] `REACT_APP_SUPABASE_URL` is set in Vercel → Project → Settings → Environment Variables (Production scope).
- [ ] `REACT_APP_SUPABASE_ANON_KEY` is set in Vercel → same location.
- [ ] `REACT_APP_API_BASE_URL` is set in Vercel → same location.
- [ ] **No** `SUPABASE_SERVICE_ROLE_KEY` or any `service_role` key is present in Vercel environment variables for the frontend project.
- [ ] Supabase → Authentication → URL Configuration → **Site URL** is set to your production Vercel URL.
- [ ] Supabase → Authentication → URL Configuration → **Redirect URLs** contains your production URL (e.g. `https://your-app.vercel.app/**`).
- [ ] The deployed build is the latest commit from `main` (check Vercel → Deployments).
- [ ] Preview deployments either have their own env vars set or are not being used as the test target.
