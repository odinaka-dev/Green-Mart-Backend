# Admin Auth — Frontend Implementation Guide

> How the frontend must implement **admin login** and **admin creation**.
> Admin creation is deliberately **NOT** a public "register / create account" flow.

---

## 1. Core principle

There is **no public admin signup**. A visitor can never reach a form that creates an admin.
Admin accounts are only created **from inside the authenticated admin area**, by an admin who
is already logged in and who supplies a server-side secret.

```
Public site           →  guest shopping only, no accounts at all
/admin/login          →  the ONLY public admin page
/admin/management     →  protected; "Create Admin" lives here
```

**Do not** reuse the customer register form, its validation, or its API client for this.
**Do not** link to admin creation from anywhere on the public site.

---

## 2. The required flow

Implement exactly this sequence:

```
1. Admin opens /admin/login and submits email + password
        ↓  POST /api/admin/login
2. On success → store token → redirect to /admin/management
        ↓
3. On /admin/management the admin clicks "Create Admin" (opens a modal or /admin/management/new)
        ↓
4. Admin fills the create-admin payload and submits
        ↓  POST /api/admin/create
5. On success → close modal, toast "Admin created", refresh the admin list
```

Step 3 must not be reachable without completing step 2. Guard the route.

---

## 3. Endpoint reference

Base URL: `https://your-api` (e.g. `https://green-mart-backend.onrender.com`)

### 3.1 Admin login

`POST /api/admin/login` — public, rate limited to **10 requests / 15 min per IP**.

```jsonc
// Request
{ "email": "admin@greenmart.com", "password": "StrongPass123!" }
```

```jsonc
// 200 Response
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOi…",
    "admin": { "id": "…", "fullName": "Jane Admin", "email": "admin@greenmart.com", "role": "ADMIN" }
  }
}
```

| Status | Meaning | Show the user |
|---|---|---|
| 401 | Invalid credentials | "Invalid email or password" |
| 403 | Account exists but is **not** an admin | "This account does not have admin access" |
| 429 | Rate limited | "Too many attempts. Try again later." |

> Note the 403: a normal customer account can log in at `/api/auth/login` but is rejected here.
> Do not fall back to the customer login endpoint when this returns 403.

### 3.2 Create admin

`POST /api/admin/create` — **requires an admin Bearer token**, rate limited to
**10 requests / 15 min per IP**.

Two things are required together:
1. `Authorization: Bearer <adminToken>` — only a logged-in admin may create another admin.
2. `adminSecret` in the body — a second factor, typed by the human at submit time.

```jsonc
// Request
{
  "fullName":    "New Admin",
  "email":       "new.admin@greenmart.com",
  "phoneNumber": "08012345678",
  "password":    "StrongPass123!",
  "adminSecret": "<the server's ADMIN_SECRET>"
}
```

```jsonc
// 201 Response
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": { "id": "…", "fullName": "New Admin", "email": "new.admin@greenmart.com", "role": "ADMIN" },
    "token": "eyJhbGciOi…"     // token for the NEW admin — see warning below
  }
}
```

| Status | Meaning | Show the user |
|---|---|---|
| 400 | Email already in use | "An account with this email already exists" |
| 401 | Missing/invalid/expired admin token | Clear session, redirect to `/admin/login` |
| 403 | Not an admin, **or** `adminSecret` wrong | "Invalid admin secret" (see note) |
| 429 | Rate limited | "Too many attempts. Try again later." |

> A 403 here has two possible causes. If the session is otherwise working (other admin calls
> succeed), treat it as a wrong `adminSecret` and let the user retype it — do **not** log them out.

> ⚠️ **The response contains a token for the newly created admin.**
> **Discard it.** Do NOT store it and do NOT swap the current session to it — that would log the
> current admin out and into the new account. Read only `data.admin` to update your list.

### 3.3 Logout

`POST /api/admin/logout` — requires `Authorization: Bearer <token>`.

Server-side this is a no-op; it does not invalidate the JWT. The frontend must clear the stored
token itself and redirect to `/admin/login`.

---

## 4. The `adminSecret` field — read this carefully

`POST /api/admin/create` is protected by **two** independent checks: a valid admin Bearer token,
and the `adminSecret` matching the server's `ADMIN_SECRET` environment variable. The login step is
therefore enforced **server-side** — the frontend flow is not the only thing protecting it.

The secret still has one hard consequence:

> **Never hardcode `ADMIN_SECRET` in frontend code, `.env.local`, or any bundled config.**
> Anything shipped to the browser is public. Committing it there hands anyone the ability to
> mint admin accounts.

### How to handle it

Make `adminSecret` a **field the human types into the create-admin form**, every time — like a
confirmation password. It is never persisted, never in source, never in localStorage.

```
Create Admin form
├─ Full name
├─ Email
├─ Phone number
├─ Password
└─ Admin secret   ← type="password", autoComplete="off", cleared on submit
```

This gives you two factors for a sensitive action: an authenticated admin session **plus** a
secret only trusted operators know.

### Bootstrapping the first admin

Because creating an admin now requires being an admin, the **first** admin cannot be created over
HTTP. It is seeded server-side by a backend operator:

```bash
npx ts-node src/scripts/seedAdmin.ts "Jane Admin" admin@greenmart.com 08012345678 'StrongPass123!'
```

The frontend never needs to handle this case — there is no "first run" or "no admins yet" UI to
build. If login fails because no admin exists, that is an operator task, not a frontend flow.

---

## 5. Session handling

**Token:** a JWT with payload `{ userId }`, expiring in **24 hours**.

- Store in `localStorage` under a key distinct from any customer key, e.g. `adminToken`.
- Send as `Authorization: Bearer <adminToken>` on every admin request.
- **Never** send it on public shopping requests.
- **Never** send the guest `x-guest-id` header on admin requests.

Also store `data.admin` (id, fullName, email, role) to render the header without a refetch.

### Route guard

```
On mount of any /admin/* route except /admin/login:
  if (!adminToken)             → redirect /admin/login
  if (admin.role !== "ADMIN")  → redirect /admin/login
```

### Global 401/403 handling

Add a response interceptor on the admin API client:

- **401** on any admin call → token expired or invalid → clear `adminToken`, redirect to
  `/admin/login` with a "Session expired, please log in again" message.
- **403** → the account lost admin rights → clear and redirect the same way.

There is no refresh token. After 24h the admin logs in again.

### Example client

```ts
const API = process.env.NEXT_PUBLIC_API_URL;

export async function adminFetch(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem("adminToken");

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    window.location.href = "/admin/login?expired=1";
  }
  return res;
}
```

---

## 6. Page specs

### `/admin/login` (public)

- Fields: email, password. Both required; validate email format client-side.
- Submit → `POST /api/admin/login`.
- Success → store `data.token` as `adminToken`, store `data.admin`, redirect `/admin/management`.
- Failure → show the `message` from the response inline. Do not reveal whether the email exists.
- If `adminToken` already exists on mount, redirect straight to `/admin/management`.
- No "Sign up", "Create admin", or "Register" link anywhere on this page.

### `/admin/management` (protected)

- Header shows the logged-in admin's `fullName` and a **Logout** button.
- Primary action: a **"Create Admin"** button opening a modal (or routing to
  `/admin/management/new`).
- Logout → `POST /api/admin/logout`, then clear storage and redirect to `/admin/login`
  regardless of the response.

### Create Admin modal

- Fields: `fullName`, `email`, `phoneNumber`, `password`, `adminSecret`.
- Client-side validation before submitting:

| Field | Rule |
|---|---|
| `fullName` | required, ≥ 3 characters |
| `email` | required, valid email format |
| `phoneNumber` | required, 11–15 characters |
| `password` | required, **≥ 8 characters** (enforced by the DB — shorter values fail server-side) |
| `adminSecret` | required, masked input |

- Add a confirm-password field client-side if you want; the API does not expect one.
- Submit → `POST /api/admin/create` **via `adminFetch`**, so the current admin's Bearer token is
  attached. A plain `fetch` without the token returns 401.
- Success → **discard `data.token`**, close modal, toast "Admin created successfully",
  refresh the admin list.
- Failure → map the status codes from §3.2 to inline messages. Keep the form filled except
  `adminSecret` and `password`, which must be cleared.
- Disable the submit button while in flight to avoid duplicate accounts.

---

## 7. Implementation checklist

- [ ] Create `/admin/login` as the only public admin route.
- [ ] Create a separate `adminFetch` client that attaches `Authorization` and never `x-guest-id`.
- [ ] Store the admin token under a distinct key (`adminToken`), separate from customer/guest keys.
- [ ] Add a route guard on all `/admin/*` routes except login.
- [ ] Add the global 401/403 interceptor that clears the session and redirects.
- [ ] Build `/admin/management` with the admin's name, Logout, and a "Create Admin" button.
- [ ] Build the Create Admin modal with the five fields, including masked `adminSecret`.
- [ ] Send create-admin through `adminFetch` so the Bearer token is attached (401 without it).
- [ ] On 403 from create-admin, keep the session and let the user retype the secret — don't log out.
- [ ] **Discard the token returned by `/api/admin/create`** — never swap the active session.
- [ ] Confirm `ADMIN_SECRET` appears in **no** frontend file, env file, or commit.
- [ ] Confirm no public page links to admin creation and no customer register form reuses it.
- [ ] Handle 429 rate-limit messaging on both login and create.
- [ ] Clear token + redirect on logout regardless of API response.

---

## 8. Rules

1. Admin creation is **never** a public signup. It lives behind the admin session, on the admin
   management page, and requires the admin secret.
2. `ADMIN_SECRET` is typed by a human at submit time — never bundled, stored, or logged.
3. Discard the token returned by `/api/admin/create`.
4. Admin token and guest id are separate systems; never mix the headers.
5. Tokens last 24h with no refresh — always handle 401 by returning to login.
