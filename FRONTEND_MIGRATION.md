# Frontend Migration Prompt — Green Mart Guest Checkout API

> **Paste this whole file to your frontend AI agent.** It describes every backend API change
> from the old (auth-required) API to the new (public guest-checkout) API, so the agent can
> update the frontend codebase end to end.

---

## Your task

You are updating the **frontend** of an e-commerce app. The backend was refactored from an
**authentication-required shopping flow** to a **fully public guest-checkout flow** with
Flutterwave payments. Your job is to update every API call, type, and UI flow in the frontend
to match the new backend contract described below.

Work through the "Migration checklist" at the end. For each item, search the codebase for the
old pattern and replace it with the new one. Do not invent endpoints that are not listed here.

---

## 1. The single biggest change: no auth for shopping

**Before:** every product/cart call required an `Authorization: Bearer <token>` header. The app
called `POST /api/guest/session` to get a `guestToken` (a JWT) and sent it as a Bearer token.

**Now:** shopping, cart, and checkout are **completely public**. There is **no token at all**
for customers. The guest is identified by a plain opaque id sent in a custom header:

```
x-guest-id: <guestId>
```

### What to do
- **Remove** the `Authorization` header from ALL product, cart, checkout, payment, category,
  shipping, coupon, and order-tracking requests.
- **Delete** any logic that stores/refreshes/decodes a `guestToken` JWT.
- **Add** an `x-guest-id` request header to all **cart** and **checkout** calls.
- Keep `Authorization: Bearer <token>` **only** for admin screens (`/api/admin/*`, admin order
  management, product/category/shipping/coupon create+edit).

### Guest id bootstrap logic
On first visit (or when `guestId` is missing from `localStorage`), call `POST /api/guest/session`,
store `data.guestId` in `localStorage`, and attach it as `x-guest-id` on every cart/checkout call.
If any cart call returns **404 with "Guest session not found or has expired"**, discard the stored
id, create a new session, and retry once.

---

## 2. Standard response envelope

Most endpoints return:

```jsonc
{ "success": true, "message": "…", "data": { … }, "timestamp": "ISO-8601" }
```

Errors return:

```jsonc
{ "success": false, "message": "Human readable reason" }
```

Show `message` directly to users — the backend writes user-facing text
(e.g. `"Only 3 unit(s) available"`, `"This coupon has expired"`).

**Important:** payloads moved under a `data` key on several endpoints that previously returned
fields at the top level. Details per endpoint below.

---

## 3. Endpoint-by-endpoint: OLD → NEW

### 3.1 Guest session

| | Old | New |
|---|---|---|
| Endpoint | `POST /api/guest/session` | `POST /api/guest/session` (same URL) |
| Response | `{ success, guestToken, guestId, expiresAt }` | `{ success, message, data: { guestId, expiresAt } }` |

**Change:** `guestToken` **no longer exists**. Read `data.guestId` (not top-level `guestId`).
Stop sending a Bearer token; send `x-guest-id: <guestId>` instead.

---

### 3.2 Products (now public)

| Endpoint | Change |
|---|---|
| `GET /api/product/get-products` | **Remove auth header.** Response shape unchanged: `{ success, message, data: { page, limit, total, totalPages, data: [...] } }`. New optional query param `category=<categoryId>`. Existing `page, limit, search, sort, collections, color` all still work. Only active products are returned. |
| `GET /api/product/get-single-product/:productId` | **Remove auth header. Response shape CHANGED — see below.** |
| `GET /api/product/:productId/variants` | **NEW** — public. Returns `{ success, data: [ { _id, product, sku, size, color, price, isActive, stock } ] }` |

#### Single product response — BREAKING

**Old** (was broken and returned an array): `{ success, status, data: [...] }`

**New:**
```jsonc
{
  "success": true,
  "data": {
    "product":  { /* full product object, category populated as { _id, name, slug } */ },
    "variants": [ { "_id": "…", "size": "l", "color": "red", "price": 26000, "stock": 4 } ],
    "stock":    12,          // base stock, for products without variants
    "related":  [ { "_id", "productName", "productPrice", "productImages", "ratings" } ]
  }
}
```

**Do:** read the product from `data.product` (not `data`/`data[0]`). Render `data.related` as a
"You may also like" section. If `data.variants.length > 0`, show a variant picker and use the
selected variant's `stock`; otherwise use `data.stock`. Disable "Add to cart" when stock is 0.

#### New product fields
`category` (object or null), `isActive` (boolean), `hasVariants` (boolean). Products with
`isActive: false` are already filtered out of public lists.

---

### 3.3 Cart (now public, variant-aware) — **most changes here**

All cart calls need `x-guest-id` and **no** Authorization header.

| Old | New |
|---|---|
| `POST /api/cart/add-cart` | same URL, body now accepts `variantId` |
| `GET /api/cart/get-cart` | same URL |
| — | **`PATCH /api/cart/update-cart`** — NEW (set quantity) |
| `DELETE /api/cart/delete-cart/:productId` | same URL, optional `?variantId=` |
| — | **`DELETE /api/cart/clear-cart`** — NEW |

#### Request bodies
```jsonc
// POST /api/cart/add-cart
{ "productId": "…", "variantId": "…" /* optional, null if none */, "quantity": 1 }

// PATCH /api/cart/update-cart   ← use this for +/- steppers; quantity 0 removes the line
{ "productId": "…", "variantId": null, "quantity": 3 }
```

#### Cart response — BREAKING
**Old:** `{ success, message, cart: [ { productId, quantity } ] }` (raw, unpriced, needed a
`populate`; frontend had to compute totals).

**New:** every cart endpoint (except `clear-cart`) returns a fully priced summary:
```jsonc
{
  "success": true,
  "message": "Product added to cart",
  "data": {
    "items": [
      {
        "productId": "…",
        "variantId": null,
        "productName": "Nike Air Max",
        "image": "https://…",              // first product image URL
        "attributes": { "size": "l", "color": "red" },
        "unitPrice": 25000,
        "quantity": 2,
        "lineTotal": 50000,
        "stock": 7,
        "inStock": true,
        "isActive": true
      }
    ],
    "subtotal": 50000,
    "itemCount": 2
  }
}
```

**Do:**
- Read `data.items` (not `cart`). Read `data.subtotal` — **delete any frontend subtotal/total
  math**; the server computes all money now.
- Use `image`, `productName`, `unitPrice`, `lineTotal` directly — no `populate` shape, no
  `item.productId.productName` nesting anymore.
- Show an "out of stock"/"unavailable" badge when `inStock === false` or `isActive === false`,
  and block checkout until those lines are fixed.
- A cart line is identified by **`productId` + `variantId` together** — the same product with
  two different variants is two separate lines. Update your line-key logic accordingly.
- `clear-cart` returns only `{ success, message }` (no `data`).

**Errors:** `409` with `"Only N unit(s) available"` when exceeding stock — surface this inline.

---

### 3.4 Checkout — **NEW, replaces order creation**

**Removed:** `POST /api/order/create-orders` and `GET /api/order/get-orders` **no longer exist**.
Delete all calls to them.

**New:** `POST /api/checkout` — header `x-guest-id`, no auth.

```jsonc
// Request
{
  "customer": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "08012345678"
  },
  "shippingAddress": {
    "country": "Nigeria",
    "state": "Lagos",
    "city": "Ikeja",
    "addressLine1": "12 Allen Avenue",
    "addressLine2": "",        // optional
    "postalCode": ""           // optional
  },
  "billingAddress": null,      // optional, same shape as shippingAddress
  "couponCode": "SAVE10",      // optional
  "deliveryMethod": "standard",// optional, free text label
  "shippingMethodId": "…",     // optional, _id from GET /api/shipping
  "currency": "NGN",           // optional, defaults to NGN
  "paymentMethod": "card"      // optional
}
```

```jsonc
// 201 Response
{
  "success": true,
  "message": "Checkout initialized. Redirect the customer to paymentLink.",
  "data": {
    "orderNumber": "GM-20260721-4F9A2C",
    "orderId": "…",
    "reference": "GM-TX-1737460000000-9F3B21C4",   // tx_ref — persist this!
    "amount": 53000,
    "currency": "NGN",
    "paymentLink": "https://checkout.flutterwave.com/v3/hosted/pay/…"
  },
  "timestamp": "…"
}
```

**Do:**
- **Never send prices, subtotal, discount, shipping fee, or totals.** The server ignores them
  and recalculates everything. Remove any such fields from your checkout payload.
- The cart is read **server-side** from the `x-guest-id` session — do **not** send cart items.
- Save `data.reference` and `data.orderNumber` to `localStorage` before redirecting.
- Redirect the browser to `data.paymentLink` (`window.location.href = paymentLink`).
- Validate the form client-side to match: `fullName` ≥2 chars, valid `email`, `phoneNumber` ≥7
  chars, and all four required address fields.

**Errors:** `400` empty cart / validation, `409` out of stock or product unavailable.

---

### 3.5 Payment — **NEW**

| Endpoint | Who calls it | Purpose |
|---|---|---|
| `GET /api/payment/verify?tx_ref=…&transaction_id=…&status=…` | **Frontend** | Called on the redirect-back page. Backend verifies with Flutterwave server-side. |
| `GET /api/payment/status/:reference` | **Frontend** (optional) | Poll order/payment status. |
| `POST /api/payment/webhook` | **Flutterwave only — never call from frontend** | Source of truth. |

#### Redirect callback page (build this)
Create a route at `/checkout/callback` (must match backend `PAYMENT_REDIRECT_URL`). Flutterwave
redirects here with `?status=…&tx_ref=…&transaction_id=…` in the query string. On mount:

1. Read those three query params.
2. Call `GET /api/payment/verify` forwarding all three.
3. `success: true` → show the success page using `data.orderNumber`, `data.paymentStatus`, and
   clear the local cart state.
4. `success: false` → show failure with `data.reason` and a "Retry payment" action.

```jsonc
// Success (HTTP 200)
{ "success": true, "message": "Payment verified successfully",
  "data": { "orderNumber": "GM-…", "orderStatus": "confirmed", "paymentStatus": "paid" } }

// Failure / cancelled (also HTTP 200 — check the `success` flag, not the status code)
{ "success": false, "message": "Payment verification failed",
  "data": { "orderNumber": "GM-…", "reason": "Amount mismatch: …" } }
```

> **Critical:** never mark an order paid based on the `status=successful` query param from the
> redirect URL. Always call `/api/payment/verify` and trust only its response.

#### Optional polling
```jsonc
// GET /api/payment/status/:reference
{ "success": true, "data": {
    "reference": "GM-TX-…",
    "paymentStatus": "paid",     // pending | paid | failed | cancelled | refunded
    "order": { "orderNumber", "orderStatus", "paymentStatus", "grandTotal", "currency" } } }
```
Poll every ~3s for up to ~30s if `/verify` returns pending, since the webhook may land first.

---

### 3.6 Order tracking — replaces "my orders"

**Removed:** `GET /api/order/get-orders` (was user-scoped).

**New (public):** `GET /api/order/track/:orderNumber?email=<customer email>`
Both the order number **and** matching email are required.

```jsonc
{ "success": true, "data": {
    "order": { /* full order: items, addresses, subtotal, discountTotal,
                  shippingFee, taxTotal, grandTotal, orderStatus, paymentStatus, … */ },
    "timeline": [ { "status", "title", "description", "createdAt" } ] } }
```

**Do:** replace the "My Orders" list with a **track-order form** (order number + email). Render
`data.timeline` as an order-progress stepper.

Status enums:
- `orderStatus`: `pending | confirmed | processing | shipped | delivered | cancelled`
- `paymentStatus`: `pending | paid | failed | cancelled | refunded`

---

### 3.7 New supporting endpoints (all public reads)

| Endpoint | Response | Use for |
|---|---|---|
| `GET /api/category` | `{ success, data: [ { _id, name, slug, description } ] }` | Category nav / filter. Pass `_id` as `?category=` to product list. |
| `GET /api/shipping` | `{ success, data: [ { _id, name, description, fee, estimatedDays } ] }` | Delivery options at checkout. Send chosen `_id` as `shippingMethodId`. |
| `POST /api/coupon/validate` | `{ success, message, data: { code, type, value, discount } }` | Preview a discount before checkout. |

```jsonc
// POST /api/coupon/validate
{ "code": "SAVE10", "subtotal": 50000 }
```
This is **preview only** — the real discount is recomputed at checkout. Display `data.discount`,
but always show the final total from the checkout response.

---

## 4. Admin endpoints (auth still required)

Keep `Authorization: Bearer <adminToken>` on these. **Product create/edit is now admin-only** —
it previously accepted any user or guest token, so non-admin product mutation will now return 403.

| Endpoint | Notes |
|---|---|
| `POST /api/product/create-products` | admin only now; accepts new `category`, `stock` fields |
| `PATCH /api/product/edit-product/:productId` | admin only now; accepts `category`, `stock`, `isActive` |
| `POST /api/product/:productId/variants` | create variant `{ sku, size, color, price, stock }` |
| `PATCH /api/product/variants/:variantId` | update variant / stock |
| `GET /api/order/admin/list` | paginated, filters: `orderStatus`, `paymentStatus`, `email` |
| `GET /api/order/admin/:orderId` | order + timeline |
| `PATCH /api/order/admin/:orderId/status` | `{ "orderStatus": "shipped" }` |
| `POST|PATCH /api/category`, `/api/shipping`, `/api/coupon` | admin CRUD |

---

## 5. Migration checklist

Work through these in order:

- [ ] **Remove the guest JWT.** Delete `guestToken` storage/refresh/decode logic everywhere.
- [ ] **Create an API client** that attaches `x-guest-id` from `localStorage` to cart/checkout
      calls and attaches `Authorization` **only** for admin calls.
- [ ] Implement guest-id bootstrap + the 404-expired retry-once flow.
- [ ] Strip `Authorization` from all product/category/shipping/coupon/cart/checkout/payment calls.
- [ ] Update single-product page to `data.product` / `data.variants` / `data.stock` / `data.related`.
- [ ] Add a **variant picker** where `hasVariants` is true; pass `variantId` into all cart calls.
- [ ] Rewrite cart state to use `data.items` + `data.subtotal`; **delete client-side total math**.
- [ ] Key cart lines by `productId + variantId`.
- [ ] Wire quantity steppers to `PATCH /api/cart/update-cart`; add a "Clear cart" action.
- [ ] Handle `409` stock errors inline on cart and checkout.
- [ ] Delete `POST /api/order/create-orders` and `GET /api/order/get-orders` usage.
- [ ] Build the checkout form (customer + address + shipping method + coupon) → `POST /api/checkout`
      → persist `reference`/`orderNumber` → redirect to `paymentLink`.
- [ ] **Remove every price/total field from the checkout request payload.**
- [ ] Build the `/checkout/callback` page calling `GET /api/payment/verify`.
- [ ] Add optional status polling via `GET /api/payment/status/:reference`.
- [ ] Replace "My Orders" with the track-order form + timeline stepper.
- [ ] Load categories and shipping methods for their respective selectors.
- [ ] Update all TypeScript types/interfaces to the new response shapes above.

## 6. Rules to follow

1. **Never compute or send money values.** Subtotal, discount, shipping, tax, and total are all
   server-authoritative. Display only what the API returns.
2. **Never trust the payment redirect.** Only `/api/payment/verify` determines success.
3. **Never call `/api/payment/webhook`.** It is provider-to-server only.
4. Check the `success` boolean, not just the HTTP status — verify failures return 200.
5. Show the backend's `message` field to users; it is written to be user-facing.
