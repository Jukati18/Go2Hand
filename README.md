# Go2Hand — Vietnam's Trusted Second-Hand Device Marketplace

> **Buy & sell verified second-hand tech safely.** Every device is IMEI-checked, condition-graded, and protected by escrow payment.

![Go2Hand](https://img.shields.io/badge/Go2Hand-Marketplace-teal?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%2B%20Auth-3ECF8E?style=flat-square&logo=supabase)
![Stripe](https://img.shields.io/badge/Stripe-Escrow%20Payments-635BFF?style=flat-square&logo=stripe)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Database Setup](#database-setup)
- [Supabase Storage Setup](#supabase-storage-setup)
- [Stripe Setup](#stripe-setup)
- [Running Locally](#running-locally)
- [Key Architectural Patterns](#key-architectural-patterns)
- [API Reference](#api-reference)
- [Escrow Payment Flow](#escrow-payment-flow)
- [Order Lifecycle](#order-lifecycle)
- [Deployment](#deployment)
- [Common Issues & Fixes](#common-issues--fixes)
- [Contributing](#contributing)

---

## Overview

Go2Hand is a full-stack second-hand device marketplace built for the Vietnamese market. It focuses on smartphones, laptops, tablets, and smartwatches, with features designed to build buyer trust:

- **IMEI/Serial Verification** — devices checked against stolen databases (Luhn algorithm + mock blacklist for MVP)
- **Condition Grading** — A+, A, B, C grades after physical inspection
- **Escrow Payments** — Stripe manual capture holds funds until the buyer approves the device
- **5-Day Inspection Window** — buyers have 5 days after delivery to approve or dispute

---

## Features

### Buyer Features
- Browse devices with advanced filters (brand, condition, price, storage, RAM)
- Hierarchical category navigation (`/categories/smartphones/apple`)
- Autocomplete search with model suggestions
- Watchlist / saved devices with price tracking
- Per-device escrow checkout (Stripe Payment Element)
- 5-day inspection window with countdown timer
- Dispute resolution system
- Review & rating system (seller + device accuracy dimensions)
- Buyer dashboard with order tracking

### Seller Features
- 4-step device listing form with auto-fill specs from model database
- Photo upload (min 5, max 10) to Supabase Storage
- IMEI/Serial number verification before listing
- Pricing suggestions based on condition + retail price
- Seller dashboard with earnings, active listings, pending sales
- Listing management (activate/deactivate)
- Public seller profile with ratings

### Platform Features
- Google & Facebook OAuth + email/password auth
- Real-time session sync (Supabase SSR cookies)
- SEO-optimised pages with JSON-LD structured data
- Automatic payment release after 5-day inspection window expires (Vercel cron)
- Webhook handling for all Stripe payment events
- Responsive design — mobile, tablet, desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google + Facebook OAuth) |
| Storage | Supabase Storage (device images, avatars) |
| Payments | Stripe (manual capture / escrow) |
| Deployment | Vercel |
| Icons | Heroicons v2 |

---

## Project Structure

```
go2hand/
├── src/
│   ├── actions/           # Next.js Server Actions
│   │   ├── auth.ts        # Sign in / sign up / sign out
│   │   ├── device.ts      # Create / update / delete listings
│   │   ├── order.ts       # Order lifecycle actions
│   │   ├── review.ts      # Submit review
│   │   ├── watchlist.ts   # Save / unsave devices
│   │   ├── verification.ts # IMEI / serial check
│   │   └── profile.ts     # Update profile
│   │
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx        # Homepage
│   │   ├── layout.tsx      # Root layout (Auth + Cart providers)
│   │   ├── devices/        # Device listing + detail pages
│   │   ├── categories/     # Category + brand browse pages
│   │   ├── cart/           # Shopping cart
│   │   ├── checkout/       # Stripe checkout flow
│   │   ├── orders/         # Order detail + confirmation
│   │   ├── dashboard/      # Seller + buyer dashboards
│   │   ├── profile/        # Public + own profile pages
│   │   ├── sell/           # List device form
│   │   ├── watchlist/      # Saved devices
│   │   ├── auth/           # OAuth callback handler
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── api/            # REST API route handlers
│   │   │   ├── checkout/   # POST — create PaymentIntent + order
│   │   │   ├── devices/    # GET/POST/PUT/DELETE device listings
│   │   │   ├── orders/     # Release / refund escrow
│   │   │   ├── reviews/    # GET / POST reviews
│   │   │   ├── webhooks/stripe/  # Stripe event handler
│   │   │   └── cron/release-expired-inspections/  # Auto-release
│   │   ├── sitemap.ts      # Dynamic sitemap generator
│   │   └── robots.ts       # robots.txt generator
│   │
│   ├── components/        # React components
│   │   ├── cart/           # Cart item cards, order summary, toast
│   │   ├── checkout/       # CheckoutClient (shipping + Stripe form)
│   │   ├── dashboard/      # ListingsManager
│   │   ├── devices/        # DeviceCard, DeviceDetailClient, FilterSidebar, etc.
│   │   ├── layout/         # Navbar, Footer, Breadcrumb, SearchBar, RatingStars
│   │   ├── orders/         # OrderStatusTracker, EscrowTimelineMini, InspectionCountdown
│   │   ├── profile/        # ProfileHeader, ProfileTabs, EditProfileModal
│   │   ├── reviews/        # ReviewCard, ReviewForm, ReviewList, StarPicker
│   │   ├── sell/           # StepCategory, StepDetails, StepCondition, StepPricing
│   │   ├── ui/             # ConditionBadge, SortSelect
│   │   └── watchlist/      # WatchlistButton, WatchlistCard
│   │
│   ├── context/           # React Context providers
│   │   ├── AuthContext.tsx  # Supabase session state
│   │   └── CartContext.tsx  # Cart state (localStorage)
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useFilterOptions.ts    # Fetch brands for filter sidebar
│   │   ├── useInView.ts           # IntersectionObserver for lazy loading
│   │   ├── useInspectionCountdown.ts  # Live countdown timer
│   │   └── useSellForm.ts         # Multi-step sell form state
│   │
│   ├── lib/               # Utilities and client config
│   │   ├── stripe.ts       # Server-only Stripe client
│   │   ├── supabaseClient.ts  # Browser singleton (backward compat shim)
│   │   ├── imeiValidator.ts   # Luhn algorithm + mock blacklist check
│   │   ├── utils.ts           # cn(), formatPrice(), getConditionStyle()
│   │   ├── seo.ts             # SEO utilities + JSON-LD builders
│   │   └── supabase/
│   │       ├── client.ts   # Browser Supabase client (@supabase/ssr)
│   │       ├── server.ts   # SSR Supabase client (cookie-aware)
│   │       └── admin.ts    # Service role client (bypasses RLS)
│   │
│   ├── services/          # Data access layer
│   │   ├── deviceService.ts       # Read: getDevices, getDeviceById, etc.
│   │   ├── deviceWriteService.ts  # Write: createDevice, updateDevice, etc.
│   │   ├── categoryService.ts     # Categories, brands, models
│   │   ├── orderService.ts        # Read: getOrderById, getUserOrders, etc.
│   │   ├── orderWriteService.ts   # Write: createOrder, markShipped, etc.
│   │   ├── reviewService.ts       # Read: getProductReviews, etc.
│   │   ├── reviewWriteService.ts  # Write: createReview
│   │   ├── profileService.ts      # getUserProfile
│   │   ├── modelSpecService.ts    # Sell form: categories, brands, models, pricing
│   │   ├── searchService.ts       # Autocomplete: models + listings
│   │   └── storageService.ts      # Supabase Storage: device images, avatars
│   │
│   ├── types/             # TypeScript type definitions
│   │   ├── device.ts       # Device, Seller, Review (display types)
│   │   ├── deviceInput.ts  # CreateDeviceInput, UpdateDeviceInput
│   │   ├── order.ts        # Order, OrderStatus, ShippingAddress
│   │   ├── review.ts       # Review, ReviewStats, DisplayReview
│   │   └── index.ts        # Legacy types (Condition, Category)
│   │
│   └── proxy.ts           # Next.js middleware (session refresh + route protection)
│
├── public/                # Static assets
├── vercel.json            # Vercel config with cron schedule
├── next.config.ts         # Next.js config (image domains, React compiler)
├── tailwind.config.ts     # Tailwind config
├── tsconfig.json          # TypeScript config
└── package.json
```

---

## Prerequisites

Make sure you have these installed before starting:

- **Node.js** 20+ ([download](https://nodejs.org))
- **npm** 10+ (comes with Node.js)
- **Git** ([download](https://git-scm.com))

You'll also need accounts on:
- [Supabase](https://supabase.com) — free tier works for development
- [Stripe](https://stripe.com) — free test account
- [Vercel](https://vercel.com) — for deployment (optional for local dev)

---

## Environment Variables

Create a `.env.local` file in the project root. Never commit this file — it's in `.gitignore`.

```bash
# ─── Supabase ────────────────────────────────────────────────────
# Found in: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key — bypasses RLS. Used ONLY in server-side code.
# Found in: Supabase Dashboard → Project Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ─── Stripe ──────────────────────────────────────────────────────
# Found in: Stripe Dashboard → Developers → API keys
# Use sk_test_... for development, sk_live_... for production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Found in: Stripe Dashboard → Developers → API keys → Publishable key
# NEXT_PUBLIC prefix because it's used client-side to load Stripe.js
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Webhook secret — generated when you set up the Stripe webhook endpoint
# For local dev: run `stripe listen` and copy the whsec_... secret it shows
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ─── Cron job security ────────────────────────────────────────────
# Any random string — used to authenticate Vercel cron calls
# Generate one: openssl rand -hex 32
CRON_SECRET=your-random-secret-here
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/go2hand.git
cd go2hand

# 2. Install dependencies
npm install

# 3. Copy environment template and fill in your values
cp .env.example .env.local
# (then edit .env.local with your Supabase and Stripe credentials)

# 4. Run the development server
npm run dev

# 5. Open the app
open http://localhost:3000
```

---

## Database Setup

### 1. Create the Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and wait for it to provision (~2 minutes).

### 2. Run the schema SQL

Open the **SQL Editor** in your Supabase dashboard and run the following in order:

#### Users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  verified TEXT DEFAULT NULL CHECK (verified IN ('verified', 'pending', NULL)),
  seller_rating NUMERIC(3, 1) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public reads (needed so product queries can join seller info)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_public_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_own_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Categories table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  device_type TEXT NOT NULL DEFAULT 'smartphone'
    CHECK (device_type IN ('smartphone', 'laptop', 'tablet', 'watch', 'audio', 'desktop', 'other')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, device_type, sort_order) VALUES
  ('Smartphones', 'smartphones', 'smartphone', 1),
  ('Laptops',     'laptops',     'laptop',     2),
  ('Tablets',     'tablets',     'tablet',     3),
  ('Smartwatches','watches',     'watch',      4),
  ('Audio',       'audio',       'other',      5),
  ('Desktops',    'desktops',    'desktop',    6);
```

#### Brands table
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed popular brands
INSERT INTO brands (name, slug, is_popular) VALUES
  ('Apple',   'apple',   true),
  ('Samsung', 'samsung', true),
  ('Google',  'google',  false),
  ('Xiaomi',  'xiaomi',  true),
  ('OPPO',    'oppo',    false),
  ('Vivo',    'vivo',    false),
  ('OnePlus', 'oneplus', false),
  ('Sony',    'sony',    false),
  ('Dell',    'dell',    false),
  ('HP',      'hp',      false),
  ('Lenovo',  'lenovo',  true),
  ('ASUS',    'asus',    false);
```

#### Device models table
```sql
CREATE TABLE device_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  model_name TEXT NOT NULL,
  specs JSONB DEFAULT '{}',
  suggested_retail_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_models_brand ON device_models(brand_id);
```

#### Products table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  device_model_id UUID REFERENCES device_models(id),

  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  original_price NUMERIC(10, 2),

  condition TEXT NOT NULL CHECK (condition IN ('like_new', 'excellent', 'good', 'fair')),
  color TEXT,
  storage_capacity TEXT,
  battery_health INTEGER CHECK (battery_health BETWEEN 0 AND 100),

  images TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',

  imei_status TEXT DEFAULT 'clean' CHECK (imei_status IN ('clean', 'flagged')),
  icloud_status TEXT DEFAULT 'unlocked' CHECK (icloud_status IN ('unlocked', 'locked')),
  carrier_status TEXT DEFAULT 'unlocked' CHECK (carrier_status IN ('unlocked', 'locked')),

  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'sold', 'pending_review')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_seller_insert" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_seller_update" ON products FOR UPDATE USING (auth.uid() = seller_id);
```

#### Watchlist table
```sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_own" ON watchlist USING (auth.uid() = user_id);
```

#### Orders table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),

  amount NUMERIC(10, 2) NOT NULL,
  shipping_fee NUMERIC(10, 2) DEFAULT 0,
  platform_fee NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','shipped','in_inspection','completed','disputed','refunded','cancelled')),

  stripe_payment_intent_id TEXT,

  shipping_address JSONB,
  tracking_number TEXT,
  shipping_provider TEXT,

  dispute_reason TEXT,

  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  inspection_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_buyer_seller" ON orders
  FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

#### Reviews table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  reviewed_user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),

  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  seller_rating INTEGER NOT NULL CHECK (seller_rating BETWEEN 1 AND 5),
  accuracy_rating INTEGER NOT NULL CHECK (accuracy_rating BETWEEN 1 AND 5),

  title TEXT,
  body TEXT,
  comment TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_buyer_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = buyer_id);
```

#### Verification logs table
```sql
CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('imei', 'serial')),
  identifier_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  method TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Notify PostgREST to reload schema

After running any schema changes, always run this in the SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

---

## Supabase Storage Setup

### 1. Create the `device-images` bucket

In your Supabase dashboard, go to **Storage** and create a bucket:
- Name: `device-images`
- **Public bucket**: ✅ Yes

### 2. Set RLS policies for device-images

In the SQL Editor:

```sql
-- Allow authenticated users to upload device images
CREATE POLICY "allow_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'device-images');

-- Allow public reads
CREATE POLICY "allow_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'device-images');

-- Allow owners to update/delete their own uploads
CREATE POLICY "allow_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Create the `avatars` bucket

Create a second public bucket named `avatars` and apply the same policies (replacing `device-images` with `avatars`).

---

## Stripe Setup

### 1. Create a Stripe account

Sign up at [stripe.com](https://stripe.com) and stay in **test mode** during development.

### 2. Get your API keys

In the Stripe Dashboard → **Developers** → **API keys**:
- Copy the **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Copy the **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

### 3. Set up webhook (local development)

Install the Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows / Linux — see https://stripe.com/docs/stripe-cli

# Login
stripe login
```

Start forwarding webhook events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret shown in the terminal → `STRIPE_WEBHOOK_SECRET`.

**Critical:** The webhook must handle `payment_intent.amount_capturable_updated` (not `payment_intent.succeeded`) to transition orders from `pending` to `paid` in the escrow flow.

### 4. Test card numbers

| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date and any 3-digit CVC.

---

## Running Locally

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Start the Stripe webhook listener (required for checkout)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test the cron job locally

```bash
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/release-expired-inspections
```

### Build for production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Key Architectural Patterns

### Supabase Client Usage

This is the most important pattern to understand. Using the wrong client causes silent RLS failures where `auth.uid()` resolves to `null`.

| Context | Import | Why |
|---|---|---|
| Client Components, hooks | `@/lib/supabase/client` | Browser-side, reads cookies automatically |
| Server Components, Server Actions, Route Handlers | `@/lib/supabase/server` | Cookie-aware SSR client |
| Webhooks, cron jobs, admin operations | `@/lib/supabase/admin` | Service role, bypasses RLS |
| Legacy code (backward compat) | `@/lib/supabaseClient` | Browser singleton shim — do not use in new code |

```typescript
// ✅ Correct — Server Action
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// ✅ Correct — Client Component
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// ❌ Wrong — using browser client in a Server Action
import { supabase } from '@/lib/supabaseClient' // auth.uid() will be null!
```

### RLS Policy Requirements

The `users` table must have a public `SELECT` policy. `PRODUCT_SELECT` joins seller info via an implicit `INNER JOIN`, so without a public `SELECT` policy on `users`, product rows are silently dropped from queries.

```sql
-- Always required — without this, product listings disappear
CREATE POLICY "users_public_select" ON users FOR SELECT USING (true);
```

### Next.js 15+ Async Params

Dynamic route `params` must be typed as `Promise<{ id: string }>` and awaited:

```typescript
// ✅ Correct
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}

// ❌ Wrong — params is not a plain object in Next.js 15+
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params // TypeScript error
}
```

### Schema Changes

After any `ALTER TABLE` or `CREATE TABLE` in Supabase:

```sql
-- Always run this after schema changes
NOTIFY pgrst, 'reload schema';
```

---

## API Reference

### Device Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/devices` | Public | List devices with filters |
| `POST` | `/api/devices` | Required | Create a new listing |
| `GET` | `/api/devices/:id` | Public | Get single device |
| `PUT` | `/api/devices/:id` | Seller | Update listing |
| `DELETE` | `/api/devices/:id` | Seller | Soft-delete listing |

**GET /api/devices query params:**

```
?category=smartphones
&brand=apple
&condition=excellent
&min_price=200
&max_price=800
&search=iphone
&sort=price_asc|price_desc|newest|popular
&page=1
&limit=20
```

### Order Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/checkout` | Required | Create PaymentIntent + pending order |
| `POST` | `/api/orders/:id/release` | Buyer | Capture payment (approve device) |
| `POST` | `/api/orders/:id/refund` | Admin | Cancel hold / issue refund |

### Review Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reviews?product_id=X` | Public | Reviews for a device |
| `GET` | `/api/reviews?seller_id=X` | Public | Reviews for a seller |
| `GET` | `/api/reviews?order_id=X&check=eligible` | Required | Check review eligibility |
| `POST` | `/api/reviews` | Buyer | Submit a review |

### Cron Endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cron/release-expired-inspections` | `Authorization: Bearer CRON_SECRET` | Auto-release expired escrow |

---

## Escrow Payment Flow

```
Buyer places order
      │
      ▼
POST /api/checkout
      │
      ├─ Validates device is still available
      ├─ Creates Stripe PaymentIntent (capture_method: 'manual')
      │   → Funds are HELD on buyer's card but NOT charged
      └─ Creates order with status: 'pending'
            │
            ▼
Buyer submits payment (Stripe Elements)
      │
      ▼
Stripe webhook: payment_intent.amount_capturable_updated
      │
      └─ Order status: 'pending' → 'paid'
         Product status: 'active' → 'sold'
            │
            ▼
Seller marks as shipped (tracking number required)
      │
      └─ Order status: 'paid' → 'shipped'
            │
            ▼
Buyer confirms delivery
      │
      └─ Order status: 'shipped' → 'in_inspection'
         5-day countdown starts
            │
            ├─ Buyer approves → stripe.paymentIntents.capture()
            │   Order status: 'in_inspection' → 'completed'
            │   Money moves to Go2Hand Stripe balance
            │
            ├─ Buyer disputes → Order status: 'disputed'
            │   Admin reviews → stripe.paymentIntents.cancel()
            │   Order status: 'disputed' → 'refunded'
            │
            └─ 5 days expire → Cron job runs
                stripe.paymentIntents.capture() (auto)
                Order status: 'in_inspection' → 'completed'
```

**Important:** Stripe enforces a 7-day window for manual capture. Ensure shipping + inspection time stays under 7 days total. For MVP, the 5-day inspection window + ~1 day shipping fits within this constraint.

---

## Order Lifecycle

```
pending → paid → shipped → in_inspection → completed
                                         → disputed → refunded
Any stage before "shipped" → cancelled
```

| Status | Trigger | Who |
|---|---|---|
| `pending` | Order created before Stripe confirms | System |
| `paid` | Stripe webhook confirms authorization | System (webhook) |
| `shipped` | Seller adds tracking number | Seller |
| `in_inspection` | Buyer confirms delivery | Buyer |
| `completed` | Buyer approves OR 5-day window expires | Buyer / Cron |
| `disputed` | Buyer opens dispute during inspection | Buyer |
| `refunded` | Admin resolves dispute in buyer's favour | Admin |
| `cancelled` | Buyer cancels before shipping | Buyer |

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add CRON_SECRET
```

### Configure Stripe webhook for production

In Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**:

- URL: `https://your-domain.vercel.app/api/webhooks/stripe`
- Events to listen for:
  - `payment_intent.amount_capturable_updated` ← **critical for escrow**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`

Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel.

### Vercel Cron (auto-configured)

The `vercel.json` file already configures the cron job to run every hour:

```json
{
  "crons": [
    {
      "path": "/api/cron/release-expired-inspections",
      "schedule": "0 * * * *"
    }
  ]
}
```

Vercel automatically sends `Authorization: Bearer CRON_SECRET` with each cron request.

### Add Supabase Storage URL to Next.js

In `next.config.ts`, the Supabase Storage domain is already whitelisted:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ],
}
```

---

## Common Issues & Fixes

### Products not appearing / returning empty arrays

**Root cause:** Missing `SELECT` RLS policy on the `users` table.

`PRODUCT_SELECT` in `deviceService.ts` joins seller info. If the `users` table blocks reads, the join produces no rows, and Supabase returns an empty array instead of an error.

```sql
-- Fix: add public SELECT policy
CREATE POLICY "users_public_select" ON users FOR SELECT USING (true);
```

### "NOT NULL constraint" errors on insert

**Diagnosis:** Run this to find all NOT NULL columns without defaults:

```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND is_nullable = 'NO'
  AND column_default IS NULL;
```

**Fix:** Either provide a value in your insert, add a default to the column, or make the column nullable.

### Stripe webhook not updating order status

**Root cause:** Listening for `payment_intent.succeeded` instead of `payment_intent.amount_capturable_updated`.

With `capture_method: 'manual'`, the payment is authorized (not succeeded) immediately. The correct event is `payment_intent.amount_capturable_updated`.

```bash
# Verify webhook is receiving events
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Auth session not updating after sign-in

**Root cause:** Calling `supabase.auth.getSession()` after the server sets the cookie — the client SDK still has the old session cached in memory.

**Fix:** After `actionSignIn()` resolves, call `await reloadSession()` from `AuthContext` before navigating.

### Upload stuck at 5% / timing out

**Root cause:** RLS policy on `storage.objects` is blocking the upload, or the `device-images` bucket doesn't exist.

**Checks:**
1. Bucket `device-images` exists and is set to **public**
2. RLS policy allows authenticated users to insert into the bucket
3. Check browser DevTools Network tab for the actual error response

### PostgREST returning stale schema

After any `ALTER TABLE`:

```sql
NOTIFY pgrst, 'reload schema';
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the existing code patterns
4. Run lint: `npm run lint`
5. Run type check: `npx tsc --noEmit`
6. Commit with a descriptive message
7. Open a pull request

### Code conventions

- **Supabase client:** Always use the correct client for the context (see [Key Architectural Patterns](#key-architectural-patterns))
- **Server Actions vs API Routes:** Use Server Actions for form submissions and UI interactions. Use API Routes for external integrations (mobile apps, webhooks)
- **Error handling:** Services throw errors; Server Actions catch them and return `{ success: boolean; error?: string }`
- **Styling:** Tailwind utility classes only. Custom component classes defined in `globals.css` under `@layer components`
- **Comments:** Add comments for complex business logic, especially around escrow flow and RLS

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for Vietnam's second-hand tech community.