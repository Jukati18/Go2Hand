// Sentry config for the BROWSER (client-side errors)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // from your Sentry project settings
    tracesSampleRate: 0.1, // 10% of transactions — keep low to control cost
    debug: false,
    replaysOnErrorSampleRate: 1.0, // record session replay when an error occurs
    replaysSessionSampleRate: 0.05, // sample 5% of normal sessions
    integrations: [Sentry.replayIntegration()],
});