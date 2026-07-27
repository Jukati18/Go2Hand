// src/lib/stripe.ts
// ─────────────────────────────────────────────────────────────────
// Server-only Stripe client. Never import this in client components.
// Use process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY on the client.
//
// LAZY INIT — WHY:
//   Next.js's `next build` "Collecting page data" step imports every
//   route module (including ones that import this file) purely to
//   statically analyze them — it never calls any Stripe method.
//   The old version threw at module-evaluation time if
//   STRIPE_SECRET_KEY was missing, which meant `next build` failed
//   on ANY machine (CI runners, fresh clones, preview deploys)
//   that didn't have the env var set — even though Stripe was never
//   actually invoked.
//
//   This Proxy defers both the Stripe client construction AND the
//   missing-key check until the first time a Stripe method is
//   actually called at runtime. Every existing call site
//   (`stripe.paymentIntents.create(...)`, `stripe.webhooks.constructEvent(...)`,
//   etc.) keeps working unchanged — no call sites need to be touched.
// ─────────────────────────────────────────────────────────────────
import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripeInstance(): Stripe {
    if (_stripe) return _stripe

    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
        throw new Error(
            'STRIPE_SECRET_KEY is missing. Set it in .env.local for local dev, ' +
            'or in your deployment/CI platform\'s environment variables ' +
            '(e.g. Vercel → Project Settings → Environment Variables, or ' +
            'GitHub → Settings → Secrets and variables → Actions) before ' +
            'any code path that actually calls Stripe runs.'
        )
    }

    _stripe = new Stripe(key, { typescript: true })
    return _stripe
}


export const stripe: Stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        const instance = getStripeInstance()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (instance as any)[prop]
        return typeof value === 'function' ? value.bind(instance) : value
    },
})