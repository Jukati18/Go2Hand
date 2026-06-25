# Go2Hand — API Documentation

> **Base URL (production):** `https://go2hand.vn`  
> **Base URL (local dev):** `http://localhost:3000`  
> All endpoints are prefixed with `/api/`.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Devices](#2-devices)
3. [Checkout](#3-checkout)
4. [Orders](#4-orders)
5. [Reviews](#5-reviews)
6. [Webhooks](#6-webhooks)
7. [Cron Jobs](#7-cron-jobs)
8. [Common Response Shapes](#8-common-response-shapes)
9. [Error Reference](#9-error-reference)

---

## 1. Authentication

Go2Hand uses **Supabase Auth** under the hood. Authentication state is managed via HTTP-only cookies set by Supabase SSR — there is no token you pass manually in headers for browser clients.

For **server-to-server** or **mobile** clients that cannot use cookies, you can pass the Supabase JWT as a Bearer token:

```
Authorization: Bearer <supabase-jwt>
```

> Most REST endpoints in this document read the session from the cookie automatically. The **Cron** endpoint uses a separate shared secret (not a user JWT).

---

## 2. Devices

### `GET /api/devices`

Returns a paginated list of active device listings with optional filters.

**Auth required:** No (public)

#### Query Parameters

| Parameter    | Type    | Required | Default   | Description |
|--------------|---------|----------|-----------|-------------|
| `search`     | string  | No       | —         | Full-text search on device title (e.g. `iPhone 15`) |
| `category`   | string  | No       | —         | Category slug (e.g. `smartphones`, `laptops`) |
| `brand`      | string  | No       | —         | Brand slug (e.g. `apple`, `samsung`) |
| `condition`  | string  | No       | —         | One of: `like_new` `excellent` `good` `fair` |
| `min_price`  | number  | No       | —         | Minimum price in USD |
| `max_price`  | number  | No       | —         | Maximum price in USD |
| `sort`       | string  | No       | `newest`  | One of: `newest` `price_asc` `price_desc` `popular` |
| `page`       | integer | No       | `1`       | Page number (1-based) |
| `limit`      | integer | No       | `20`      | Results per page (max 100) |

#### Example Request

```bash
GET /api/devices?category=smartphones&brand=apple&sort=price_asc&limit=10
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "brand": "Apple",
      "brandSlug": "apple",
      "model": "iPhone 15 Pro",
      "fullName": "Apple iPhone 15 Pro 256GB Natural Titanium",
      "storage": "256GB",
      "color": "Natural Titanium",
      "grade": "A",
      "conditionLabel": "Excellent",
      "price": 849,
      "originalPrice": 1199,
      "images": ["https://...supabase.co/..."],
      "isVerified": true,
      "batteryHealth": 96,
      "seller": {
        "id": "uuid",
        "name": "Minh Nguyen",
        "rating": 4.8,
        "totalSales": 23,
        "isVerified": true
      },
      "category": "Smartphones",
      "categorySlug": "smartphones"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### `POST /api/devices`

Creates a new device listing. Images must be uploaded to Supabase Storage first — pass the returned public URLs in the `images` array.

**Auth required:** Yes (authenticated user)

#### Request Body (JSON)

```json
{
  "title": "Apple iPhone 15 Pro 256GB Natural Titanium",
  "brand_id": "uuid-of-apple-brand",
  "category_id": "uuid-of-smartphones-category",
  "device_model_id": "uuid-of-iphone-15-pro-model",
  "price": 849,
  "original_price": 1199,
  "condition": "excellent",
  "color": "Natural Titanium",
  "storage_capacity": "256GB",
  "battery_health": 96,
  "images": [
    "https://project.supabase.co/storage/v1/object/public/device-images/products/temp-id/0.jpg",
    "https://project.supabase.co/storage/v1/object/public/device-images/products/temp-id/1.jpg"
  ],
  "imei_status": "clean",
  "icloud_status": "unlocked",
  "carrier_status": "unlocked",
  "specs": {
    "ram": "8GB",
    "display": "6.1-inch Super Retina XDR",
    "chip": "A17 Pro",
    "camera": "48MP Main + 12MP Ultra Wide + 12MP 3× Telephoto",
    "battery": "3274 mAh",
    "os": "iOS 17"
  },
  "description": "Barely used, always kept in a case. Original box included."
}
```

#### Required Fields

| Field         | Type     | Description |
|---------------|----------|-------------|
| `title`       | string   | Listing title shown to buyers |
| `brand_id`    | UUID     | From `/api/categories` brand lookup |
| `category_id` | UUID     | From `/api/categories` lookup |
| `price`       | number   | Asking price in USD (must be > 0) |
| `condition`   | string   | One of: `like_new` `excellent` `good` `fair` |
| `images`      | string[] | At least 1 public Supabase Storage URL |

#### Success Response — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "new-listing-uuid"
  }
}
```

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"Missing required fields: title, images"` | Required field absent |
| `401` | `"Authentication required"` | No valid session |
| `500` | `"Failed to create listing: ..."` | Database error |

---

### `GET /api/devices/:id`

Retrieves a single device listing by its UUID.

**Auth required:** No (public)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id`      | UUID | Device listing ID |

#### Example Request

```bash
GET /api/devices/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Apple iPhone 15 Pro 256GB",
    "price": 849,
    "originalPrice": 1199,
    "grade": "A",
    "conditionLabel": "Excellent",
    "batteryHealth": 96,
    "isVerified": true,
    "images": ["https://..."],
    "specs": [
      { "label": "Storage", "value": "256GB", "highlighted": true },
      { "label": "RAM", "value": "8GB" }
    ],
    "seller": {
      "id": "uuid",
      "name": "Minh Nguyen",
      "rating": 4.8,
      "memberSince": "Jan 2024",
      "location": "Ho Chi Minh City"
    },
    "reviews": [],
    "totalReviews": 0,
    "averageRating": 0
  }
}
```

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `404` | `"Device not found"` | ID doesn't exist or listing is sold/inactive |

---

### `PUT /api/devices/:id`

Updates fields on an existing listing. Only the seller who owns the listing can update it (enforced via RLS).

**Auth required:** Yes (must be the seller who created the listing)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id`      | UUID | Device listing ID |

#### Request Body (JSON) — all fields optional

```json
{
  "title": "Updated title",
  "price": 799,
  "original_price": 1199,
  "condition": "good",
  "color": "Space Black",
  "storage_capacity": "256GB",
  "battery_health": 91,
  "images": ["https://...new-photo.jpg"],
  "description": "Updated description.",
  "status": "inactive"
}
```

| Field            | Type     | Description |
|------------------|----------|-------------|
| `title`          | string   | Listing title |
| `price`          | number   | New asking price |
| `original_price` | number   | New retail price reference |
| `condition`      | string   | `like_new` / `excellent` / `good` / `fair` |
| `color`          | string   | Device colour |
| `storage_capacity` | string | e.g. `"256GB"` |
| `battery_health` | integer  | 0–100 |
| `images`         | string[] | Replaces current image array |
| `description`    | string   | Seller notes |
| `status`         | string   | `active` / `inactive` / `sold` |
| `specs`          | object   | Key-value spec overrides |

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"Invalid JSON body"` | Malformed request |
| `401` | `"Authentication required"` | No valid session |
| `403` | `"Permission denied"` | Not the listing owner |
| `500` | `"Failed to update listing: ..."` | Database error |

---

### `DELETE /api/devices/:id`

Soft-deletes a listing by setting `status = 'inactive'`. The listing is hidden from buyers but not permanently removed.

**Auth required:** Yes (must be the seller who created the listing)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id`      | UUID | Device listing ID |

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `401` | `"Authentication required"` | No valid session |
| `500` | `"Failed to delete listing: ..."` | Database or ownership error |

---

## 3. Checkout

### `POST /api/checkout`

Initiates the escrow checkout flow. This endpoint:
1. Validates the device is still available (`status = 'active'`)
2. Creates a Stripe `PaymentIntent` with `capture_method: 'manual'` — funds are **held** on the buyer's card but **not charged** yet
3. Creates a `pending` order in the database
4. Returns the Stripe `clientSecret` for the frontend to complete payment with Stripe Elements

**Auth required:** Yes

#### Request Body (JSON)

```json
{
  "deviceId": "uuid-of-device",
  "shippingAddress": {
    "fullName": "Nguyen Van A",
    "phone": "+84 909 123 456",
    "addressLine1": "123 Nguyen Hue Street",
    "addressLine2": "Floor 3",
    "city": "Ho Chi Minh City",
    "state": "HCM",
    "postalCode": "70000",
    "country": "Vietnam"
  },
  "shippingFee": 0
}
```

| Field             | Type   | Required | Description |
|-------------------|--------|----------|-------------|
| `deviceId`        | UUID   | Yes      | The device listing being purchased |
| `shippingAddress` | object | Yes      | Full delivery address |
| `shippingFee`     | number | No       | Shipping cost in USD. Defaults to `0` (free shipping) |

#### `shippingAddress` Fields

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `fullName`     | string | Yes      | Recipient full name |
| `phone`        | string | Yes      | Contact phone number |
| `addressLine1` | string | Yes      | Street address |
| `addressLine2` | string | No       | Apt, floor, building |
| `city`         | string | Yes      | City |
| `state`        | string | Yes      | Province / state |
| `postalCode`   | string | No       | Postal code |
| `country`      | string | Yes      | Country name |

#### Success Response — `200 OK`

```json
{
  "clientSecret": "pi_3PxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA_secret_xxxxxxxxxxxxxxxxxxxx",
  "orderId": "uuid-of-new-order",
  "amount": 849,
  "shippingFee": 0,
  "total": 849
}
```

Use `clientSecret` with Stripe.js `stripe.confirmPayment()` on the frontend to complete payment.

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"deviceId and shippingAddress are required"` | Missing body fields |
| `400` | `"You cannot purchase your own listing"` | Buyer = seller |
| `401` | `"Authentication required"` | No valid session |
| `404` | `"Device not found or already sold"` | Listing unavailable |
| `500` | Server error message | Stripe or database failure |

---

## 4. Orders

### `POST /api/orders/:id/release`

Called when the buyer clicks **"Approve & Release Payment"** after inspecting the device.

This endpoint:
1. Verifies the caller is the buyer and the order is `in_inspection`
2. Calls `stripe.paymentIntents.capture()` — money moves from the hold to Go2Hand's Stripe balance
3. Sets order status to `completed`

**Auth required:** Yes (must be the buyer of this order)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id`      | UUID | Order ID |

#### Request Body

None required.

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `401` | `"Authentication required"` | No valid session |
| `403` | `"Forbidden"` | Caller is not the buyer |
| `404` | `"Order not found"` | Invalid order ID |
| `400` | `"Cannot release payment — order status is 'paid'"` | Order not in inspection yet |
| `500` | Server error | Stripe capture failure or DB error |

---

### `POST /api/orders/:id/refund`

**Admin only.** Resolves a dispute in the buyer's favour by cancelling the Stripe payment hold (or issuing a refund if already captured) and setting order status to `refunded`.

**Auth required:** Yes (must have `role = 'admin'` in the `users` table)

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id`      | UUID | Order ID |

#### Request Body

None required.

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

#### What happens internally

| PaymentIntent status    | Action taken |
|-------------------------|--------------|
| `requires_capture`      | `stripe.paymentIntents.cancel()` — no money ever moved |
| `succeeded`             | `stripe.refunds.create()` — money returned to buyer's card |
| Any other status        | Logged as warning; DB still updated |

The device listing is also re-activated (`status = 'active'`) so it can be sold again.

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `401` | `"Authentication required"` | No valid session |
| `403` | `"Admin access required"` | User is not an admin |
| `404` | `"Order not found"` | Invalid order ID |
| `400` | `"Cannot refund — order status is 'paid'"` | Order not in `disputed` state |
| `500` | Server error | Stripe or DB failure |

---

## 5. Reviews

### `GET /api/reviews`

Retrieves reviews and aggregate stats for a product or seller. Also supports an eligibility check for the review form.

**Auth required:** No for `product_id` / `seller_id` queries. Yes for eligibility check.

#### Query Parameters (choose one mode)

**Mode A — Reviews for a device:**

| Parameter    | Type    | Required | Description |
|--------------|---------|----------|-------------|
| `product_id` | UUID    | Yes      | Device listing ID |
| `limit`      | integer | No       | Max reviews to return. Default: `20` |

**Mode B — Reviews for a seller:**

| Parameter   | Type    | Required | Description |
|-------------|---------|----------|-------------|
| `seller_id` | UUID    | Yes      | Seller user ID |
| `limit`     | integer | No       | Max reviews to return. Default: `20` |

**Mode C — Eligibility check (can current user review this order?):**

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `order_id` | UUID   | Yes      | Order ID to check |
| `check`    | string | Yes      | Must be `"eligible"` |

---

#### Example Request A — Product reviews

```bash
GET /api/reviews?product_id=uuid-of-device&limit=10
```

#### Success Response A — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "review-uuid",
      "orderId": "order-uuid",
      "buyerId": "buyer-uuid",
      "sellerId": "seller-uuid",
      "overallRating": 5,
      "sellerRating": 5,
      "accuracyRating": 4,
      "title": "Great deal!",
      "body": "Phone was exactly as described. Fast shipping.",
      "createdAt": "2025-03-15T10:22:00Z",
      "buyer": {
        "id": "uuid",
        "username": "minhbuyer",
        "avatarUrl": null
      }
    }
  ],
  "stats": {
    "totalReviews": 12,
    "averageOverall": 4.7,
    "averageSeller": 4.8,
    "averageAccuracy": 4.6,
    "distribution": {
      "1": 0,
      "2": 0,
      "3": 1,
      "4": 2,
      "5": 9
    }
  }
}
```

---

#### Example Request C — Eligibility check

```bash
GET /api/reviews?order_id=uuid-of-order&check=eligible
Authorization: Bearer <jwt>
```

#### Success Response C — `200 OK`

```json
{
  "eligible": true
}
```

or if not eligible:

```json
{
  "eligible": false,
  "reason": "Already reviewed"
}
```

**Possible `reason` values:**

| Reason | Meaning |
|--------|---------|
| `"Not authenticated"` | No valid session |
| `"Order not found"` | Order ID invalid or doesn't belong to caller |
| `"Order is not yet completed"` | Can only review completed orders |
| `"Already reviewed"` | Review already submitted for this order |

#### Error Responses (all modes)

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"Provide product_id or seller_id query param"` | No valid query mode detected |
| `500` | Server error | Database failure |

---

### `POST /api/reviews`

Submits a review for a completed order. Each order can only be reviewed once.

**Auth required:** Yes (must be the buyer of the order)

#### Request Body (JSON)

```json
{
  "orderId": "uuid-of-completed-order",
  "sellerId": "uuid-of-seller",
  "productId": "uuid-of-device",
  "overallRating": 5,
  "sellerRating": 5,
  "accuracyRating": 4,
  "title": "Fantastic purchase!",
  "body": "Battery health was exactly 96% as listed. Shipped next day."
}
```

#### Required Fields

| Field            | Type    | Description |
|------------------|---------|-------------|
| `orderId`        | UUID    | Must be a completed order where caller is the buyer |
| `sellerId`       | UUID    | The seller being reviewed |
| `productId`      | UUID    | The device being reviewed |
| `overallRating`  | integer | 1–5: overall purchase experience |
| `sellerRating`   | integer | 1–5: seller communication, honesty, shipping speed |
| `accuracyRating` | integer | 1–5: did device match the listing? |

#### Optional Fields

| Field   | Type   | Max Length | Description |
|---------|--------|------------|-------------|
| `title` | string | 100 chars  | Short headline |
| `body`  | string | 1000 chars | Full review text |

#### Success Response — `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "new-review-uuid"
  }
}
```

After a successful submission:
- The seller's `seller_rating` and `total_reviews` on the `users` table are recalculated
- The pages `/devices/:productId`, `/orders/:orderId`, and `/profile/:sellerId` are revalidated

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"Missing: orderId, overallRating, ..."` | Required fields absent |
| `400` | `"Invalid JSON body"` | Malformed request |
| `401` | `"Authentication required"` | No valid session |
| `403` | `"You can only review completed orders"` | Order not completed |
| `409` | `"You have already reviewed this order"` | Duplicate review attempt |
| `500` | Server error | Database failure |

---

## 6. Webhooks

### `POST /api/webhooks/stripe`

Receives and processes Stripe events. **This endpoint is called by Stripe, not by your frontend.**

Every request is verified using the `STRIPE_WEBHOOK_SECRET` environment variable. Requests with invalid signatures return `400`.

**Auth required:** Stripe signature header (`stripe-signature`)

#### Events Handled

| Event | Action |
|-------|--------|
| `payment_intent.amount_capturable_updated` | **Primary escrow signal.** Upgrades order from `pending` → `paid`. Marks device as `sold`. |
| `payment_intent.succeeded` | Safety net for non-escrow PaymentIntents. Same action as above (idempotent). |
| `payment_intent.payment_failed` | Sets order to `cancelled`. Re-activates the device listing. |
| `payment_intent.canceled` | If order is still `paid/shipped/in_inspection`, sets it to `refunded` and re-activates listing (handles Stripe's 7-day auto-cancel). |

#### Success Response — `200 OK`

```json
{
  "received": true
}
```

#### Error Responses

| Status | Cause |
|--------|-------|
| `400` | Missing `stripe-signature` header |
| `400` | Invalid signature (possible forgery) |
| `500` | Handler threw an unexpected error |

#### Local Development Setup

```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret printed to your terminal into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

---

## 7. Cron Jobs

### `GET /api/cron/release-expired-inspections`

Auto-releases payments for orders where the 5-day inspection window has expired. **This endpoint is called by Vercel Cron, not by users.**

Scheduled: every hour (`0 * * * *` in `vercel.json`)

**Auth required:** `Authorization: Bearer <CRON_SECRET>` header

#### What it does

1. Finds all orders with `status = 'in_inspection'` AND `inspection_started_at` older than 5 days
2. For each expired order:
   - Calls `stripe.paymentIntents.capture()` → money moves to Go2Hand
   - Sets `status = 'completed'`
3. Reports how many orders were released

#### Example Request (manual trigger for testing)

```bash
curl -H "Authorization: Bearer your_cron_secret_here" \
  https://go2hand.vn/api/cron/release-expired-inspections
```

#### Success Response — `200 OK`

```json
{
  "released": 3,
  "failed": 0,
  "releasedOrderIds": [
    "order-uuid-1",
    "order-uuid-2",
    "order-uuid-3"
  ]
}
```

If no expired orders found:

```json
{
  "released": 0,
  "message": "No expired inspections"
}
```

If some orders failed (others still processed):

```json
{
  "released": 2,
  "failed": 1,
  "releasedOrderIds": ["order-uuid-1", "order-uuid-2"],
  "errors": ["Stripe capture failed: No such payment_intent: pi_xxx"]
}
```

#### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| `401` | `"Unauthorized"` | Missing or incorrect `CRON_SECRET` |
| `500` | `"Server misconfiguration"` | `CRON_SECRET` env var not set |
| `500` | Database error message | Failed to query orders |

---

## 8. Common Response Shapes

### Success Envelope

All successful responses wrap data in a consistent envelope:

```json
{
  "success": true,
  "data": { }
}
```

Paginated list responses add a `meta` object:

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "total": 142,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Error Envelope

All error responses use:

```json
{
  "success": false,
  "error": "Human-readable error message here"
}
```

---

### Order Object

Returned in checkout and order detail responses:

```json
{
  "id": "uuid",
  "buyerId": "uuid",
  "sellerId": "uuid",
  "productId": "uuid",
  "amount": 849,
  "shippingFee": 0,
  "platformFee": 42.45,
  "total": 849,
  "status": "in_inspection",
  "paidAt": "2025-04-01T08:00:00Z",
  "shippedAt": "2025-04-02T10:00:00Z",
  "inspectionStartedAt": "2025-04-03T14:00:00Z",
  "completedAt": null,
  "disputedAt": null,
  "refundedAt": null,
  "cancelledAt": null,
  "trackingNumber": "JT1234567890VN",
  "shippingProvider": "J&T Express",
  "shippingAddress": { },
  "disputeReason": null,
  "stripePaymentIntentId": "pi_xxx",
  "createdAt": "2025-04-01T07:55:00Z",
  "updatedAt": "2025-04-03T14:00:00Z",
  "product": {
    "id": "uuid",
    "title": "Apple iPhone 15 Pro 256GB",
    "images": ["https://..."],
    "price": 849,
    "brand": "Apple"
  }
}
```

### Order Status Values

| Status | Description |
|--------|-------------|
| `pending` | Order created; Stripe payment not yet confirmed |
| `paid` | Stripe authorized the hold — money is in escrow |
| `shipped` | Seller confirmed shipment with tracking number |
| `in_inspection` | Buyer confirmed delivery — 5-day window active |
| `completed` | Buyer approved or window expired — money captured |
| `disputed` | Buyer raised an issue during inspection |
| `refunded` | Admin resolved dispute in buyer's favour |
| `cancelled` | Buyer cancelled before shipment |

### Review Object

```json
{
  "id": "uuid",
  "orderId": "uuid",
  "buyerId": "uuid",
  "sellerId": "uuid",
  "productId": "uuid",
  "overallRating": 5,
  "sellerRating": 5,
  "accuracyRating": 4,
  "title": "Great deal!",
  "body": "Exactly as described.",
  "createdAt": "2025-04-10T12:00:00Z",
  "buyer": {
    "id": "uuid",
    "username": "minhbuyer",
    "avatarUrl": null
  }
}
```

---

## 9. Error Reference

### HTTP Status Codes Used

| Code | Meaning | When it appears |
|------|---------|-----------------|
| `200` | OK | Successful GET / action |
| `201` | Created | Successful POST (new resource created) |
| `400` | Bad Request | Missing fields, invalid input, business rule violation |
| `401` | Unauthorized | No valid session / missing auth |
| `403` | Forbidden | Valid session but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate (e.g., already reviewed) |
| `500` | Internal Server Error | Unexpected server / database / Stripe failure |

### Common Business Logic Errors

| Error message | What to do |
|---------------|------------|
| `"You cannot purchase your own listing"` | Buyer and seller IDs match |
| `"Device not found or already sold"` | Listing was sold between page load and checkout |
| `"You can only review completed orders"` | Wait until buyer approves device |
| `"You have already reviewed this order"` | One review per order — show existing review |
| `"Cannot release payment — order status is '...'"` | Order is in wrong state for this action |
| `"Cannot refund — order status is '...'"` | Only `disputed` orders can be refunded |
| `"A reason is required to open a dispute"` | Include `reason` field with ≥ 10 characters |

---

*Last updated: June 2025 · Go2Hand v0.1.0*