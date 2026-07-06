/**
 * src/lib/supabase/client.ts
 *
 * HMR-SAFE BROWSER SINGLETON + SELF-HEALING AUTH LOCK
 * ───────────────────────────────────────────────────────────────────────────
 * WHY globalThis instead of a module-level variable:
 *
 * Under Next.js Turbopack (dev mode), every file edit causes the module to
 * be re-executed from scratch. A plain `let client` gets reset to `undefined`
 * on each HMR cycle, so `createClient()` silently spawns a SECOND
 * GoTrueClient. Storing the instance on `globalThis` survives module
 * re-execution, so repeated HMR cycles always return the SAME instance.
 *
 * WHY THAT ALONE ISN'T ENOUGH — the real cause of the recurring
 * "Auth session check timed out" error:
 *
 * GoTrueClient serialises token refreshes using the browser's
 * `navigator.locks` API, keyed to this Supabase project's URL. That lock is
 * global to the TAB, not to any one GoTrueClient instance. Caching the
 * client on globalThis does nothing to protect against a lock acquisition
 * that gets abandoned mid-flight — which happens routinely under Turbopack
 * Fast Refresh: a component unmounts while `auth.getSession()` is still
 * waiting on `navigator.locks.request(...)`, the callback that would have
 * released the lock never runs, and the lock is now held forever by
 * nothing. Every future auth.getSession()/getUser() call then queues
 * behind a lock that will never free — the exact "auth session unhealthy"
 * error you're hitting during photo upload. Previously the only fix was a
 * full browser refresh, because that's the only thing that clears the
 * lock table for the tab.
 *
 * THE FIX: `selfHealingLock` below races the real navigator.locks
 * acquisition against a hard timeout. If a stale/abandoned holder never
 * frees the lock in time, we abort waiting and just run the callback
 * anyway instead of hanging forever. Worst case we skip cross-tab
 * de-duplication of one token refresh (harmless) — but we never deadlock
 * again.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { createBrowserClient } from "@supabase/ssr";

// ── Fetch wrapper: every request gets a 30s hard timeout so a stalled
// network call never silently hangs the UI forever.
function fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
        clearTimeout(timer)
    );
}

// ── Self-healing lock — see the file header above for why this exists.
async function selfHealingLock<R>(
    name: string,
    _acquireTimeout: number,
    fn: () => Promise<R>
): Promise<R> {
    // SSR / unsupported browsers — no locks API, just run directly.
    if (typeof navigator === "undefined" || !("locks" in navigator)) {
        return fn();
    }

    const HARD_TIMEOUT_MS = 8_000;
    const controller = new AbortController();

    return new Promise<R>((resolve, reject) => {
        let settled = false;

        // If the real lock hasn't been granted within HARD_TIMEOUT_MS, assume
        // its previous holder is stale (abandoned by an HMR cycle) and just
        // proceed without the lock instead of waiting forever.
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            controller.abort();
            console.warn(
                `[supabase lock] "${name}" did not acquire within ${HARD_TIMEOUT_MS}ms — ` +
                "proceeding without it to avoid a permanent deadlock (likely a stale " +
                "lock left over from a Turbopack hot-reload)."
            );
            fn().then(resolve, reject);
        }, HARD_TIMEOUT_MS);

        navigator.locks
            .request(name, { signal: controller.signal }, async () => {
                // Hard timeout already fired and ran fn() itself — ignore this
                // late grant so we don't run the callback twice.
                if (settled) return;
                clearTimeout(timer);
                settled = true;
                try {
                    resolve(await fn());
                } catch (err) {
                    reject(err);
                }
            })
            .catch((err) => {
                // AbortError here is expected once our own timeout fires —
                // fn() is already running/resolved via that path.
                if (settled) return;
                clearTimeout(timer);
                settled = true;
                reject(err);
            });
    });
}

// ── Augment the global namespace so TypeScript is happy with our cache key.
declare global {
    // eslint-disable-next-line no-var
    var __go2hand_supabase_client__:
        | ReturnType<typeof createBrowserClient>
        | undefined;
}

/**
 * Returns the singleton Supabase browser client.
 * Safe to call many times — always returns the same instance.
 */
export function createClient() {
    if (!globalThis.__go2hand_supabase_client__) {
        globalThis.__go2hand_supabase_client__ = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: { fetch: fetchWithTimeout },
                auth: {
                    // This is the actual fix for the recurring deadlock —
                    // see selfHealingLock() above.
                    lock: selfHealingLock,
                },
            }
        );
    }
    return globalThis.__go2hand_supabase_client__;
}

// ────────────────────────────────────────────────────────────────────────────
// SESSION HEALTH CHECK
// ────────────────────────────────────────────────────────────────────────────
/**
 * Runs a fast pre-flight check that auth.getSession() resolves within
 * `timeoutMs`. Call this before any Storage upload to catch problems early.
 *
 * Bumped from 5s → 10s: the self-healing lock above has its own internal
 * 8s hard timeout before it proceeds without a stuck lock. If this check's
 * timeout were shorter than that, we'd throw a false "unhealthy" error
 * right as the self-heal was about to succeed. 10s gives the self-heal
 * room to kick in and actually resolve, and this outer check now only
 * fires for genuinely dead scenarios (e.g. Supabase project paused,
 * no network at all).
 *
 * @throws Error with a human-readable message when the session hangs.
 */
export async function assertSessionHealthy(timeoutMs = 10_000): Promise<void> {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(
            () =>
                reject(
                    new Error(
                        "Auth session check timed out. This usually means a lost network " +
                        "connection, or your Supabase project is paused (free-tier projects " +
                        "auto-pause after inactivity — check the Supabase dashboard). " +
                        "If this keeps happening every time regardless, do a full browser " +
                        "refresh (Ctrl/Cmd + Shift + R)."
                    )
                ),
            timeoutMs
        );
    });

    try {
        await Promise.race([supabase.auth.getSession(), timeoutPromise]);
    } finally {
        clearTimeout(timer!);
    }
}