// src/lib/stripe.ts
// ─────────────────────────────────────────────────────────────────
// Server-only Stripe client. Never import this in client components.
// Use process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY on the client.
// ─────────────────────────────────────────────────────────────────
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing — add it to .env.local')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Pin the API version so a Stripe dashboard upgrade never silently
    // changes the shape of objects your code depends on.
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
})