# Public AI demo: setup and acceptance

User decision (October 27, 2026): external onboarding and Vercel deployment are deliberately deferred. Continue local real-Meta development; retain all guards. Resume public setup only as a separate user-confirmed stage. No domain or credentials are required now.

Status: code is implemented; external protected production acceptance requires your real Upstash database, Turnstile widget and HTTPS deployment. Do not call this stage complete before those checks pass. No service has been created or purchased automatically.

## Services and cost

- Upstash Redis: choose the Free plan (currently 256 MB and 500K commands/month). Do not upgrade automatically to metered billing. Use one persistent database with eviction DISABLED. Do not delete counters during the event. Website: https://upstash.com/pricing/redis
- Cloudflare Turnstile: Free plan, a Managed widget restricted to the exact demo hostname. Website: https://developers.cloudflare.com/turnstile/plans/
- Hosting and Meta API usage are separate. The limiter caps paid attempts, not an exact dollar bill. Use a dedicated Meta key/project and configure an account spending ceiling if the provider exposes one. No fixed dollar cost is assumed by this code.

## Required deployment environment

META_MODEL_API_KEY: the existing real key, server only.
META_MODEL_API_BASE_URL: https://api.meta.ai/v1
META_MODEL_ID: muse-spark-1.3
UPSTASH_REDIS_REST_URL: database REST URL (https://...upstash.io).
UPSTASH_REDIS_REST_TOKEN: database write token, server only.
NEXT_PUBLIC_TURNSTILE_SITE_KEY: the public site key. This is safe to embed in browser code.
TURNSTILE_SECRET_KEY: private widget secret, server only.
DEMO_APP_ORIGIN: exact HTTPS origin, e.g. https://your-demo.example, no trailing slash.
DEMO_QUOTA_NAMESPACE: matchcart-hackathon-2026. Keep this identifier and database identical across replicas, previews and redeployments to share the same lifetime cap.

Set the public site key at BUILD time as well as server runtime. Rebuild after changing it. Turnstile hostname must match DEMO_APP_ORIGIN. Preview deployments with different origins must be separately configured or remain blocked. Always-pass test widgets are not accepted by production configuration.

Local development: npm run dev retains direct real Meta analysis without the public widget by default. Keep it local. To exercise the complete protection locally use a trusted HTTPS domain, both DEMO_PROTECTION=enabled and NEXT_PUBLIC_DEMO_PROTECTION=enabled, and the real service credentials; plain HTTP is not the acceptance environment because cookies are Secure.

## Enforcement

Production always enforces protection. Missing credentials retain PUBLIC_LAUNCH_BLOCKED. There is no production bypass flag or in-memory fallback.

1. /api/demo-session issues a signed, HttpOnly, Secure, SameSite=Strict, one-day cookie. No photo or API credential is stored in it.
2. A single-use Turnstile token is checked SERVER side, including expected hostname and action analyze. Stale/failed/replayed tokens block the request. A new challenge is rendered after each attempt.
3. Redis EVAL atomically checks and reserves four shared counters: 2 calls/session/minute, 5 global calls/minute, 50 global calls per 24-hour window starting with the first reservation, and 100 total calls for the event namespace. The total counter has NO TTL. Changing sessions cannot bypass global caps. Cookie reset can bypass a session limit but not the global caps.
4. Reservation happens before Meta, with no automatic retries or refunds. A timed-out/failed paid attempt still consumes quota. Redis/network errors fail closed and do not send a Meta request. No raw IP address or user prompt is stored in Redis counters.
5. Each model request has at most 4096 generated tokens; existing limits bound text, upload size and image dimensions. Counter limits plus bounded payloads control exposure, but are not a price quote. Meta account caps are an additional safeguard.

Request origin is checked against DEMO_APP_ORIGIN. Challenges and user cookies are never logged. Configure hosting/WAF body and traffic limits as well; this application limiter protects Meta spending, not unlimited hosting traffic. Keep the demo Redis DB persistent, single-primary and non-evicting; deleting/evicting counters would remove lifetime protection.

## Production acceptance (must be real services, not fixtures)

1. Deploy on the chosen HTTPS origin with all environment values and build-time site key. Open the Assistant, complete the visitor check, send the accepted text and then a redacted router photo. Verify both produce real structured Meta output.
2. Confirm all pages remain usable through Preferences, comparison and full quote. Complete a challenge for each AI submission.
3. More than two submissions in one minute in one session must return DEMO_RATE_LIMIT before Meta. Multiple clients must still share the global limit. Inspect Redis counters WITHOUT deleting them.
4. A failed/expired challenge, token replay, wrong hostname or action must be rejected. In a staging namespace, make Redis unreachable: request must return PROTECTION_UNAVAILABLE and make no Meta call.
5. Test daily/lifetime exhaustion in a separate staging namespace (never reset event counters): responses must return DEMO_QUOTA with a manual-entry alternative. Use a staging key if any test will invoke Meta.
6. Browser/network responses and rendered HTML must contain no Meta key, Redis token or Turnstile secret. Only the public site key belongs in browser code.

Automated tests use explicit transport stubs only inside tests. They verify fail-closed behavior and request contracts; they are not evidence that your live Redis/Turnstile account or deployed hostname works. Live cloud verification remains pending until credentials and a domain are available.
