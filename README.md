# MatchCart

Meta Global AI Developer Hackathon 2026, Startup Track. Internal target: November 4, 2026, 18:00 Asia/Tbilisi.

## Run locally

Node.js 24 and npm. Run npm install, copy .env.example to .env.local, set the real META_MODEL_API_KEY and run npm run dev. Open http://localhost:3000. Never commit .env.local. No real key is included or stored in browser state.

Checks: npm test; npm run test:e2e; npm run typecheck; npm run build. Install Chromium on a new machine with npx playwright install chromium. Tests do not make paid API calls; the AI-to-UI E2E uses an explicitly named UI fixture. Real Meta acceptance is checked separately.

## Four-step experience

1. Describe the problem in AI Assistant, optionally upload a redacted photo, and Analyze request. Real Meta extraction uses the official Chat Completions endpoint and JSON Schema. Open Review and confirm requirements. Saved analysis and request text survive refresh; images do not.
2. Confirm your needs in Preferences. Budget, dates and installation are suggested without repeated entry. Simple connection fields offer I do not know. Advanced Settings contains provider-specific details and explanations. Unknown or unconfirmed answers never establish compatibility. Save before navigating away; unsaved changes are protected.
3. Choose Budget Mode or Best Technical Solution and compare complete test solutions. Compatibility and price calculations are deterministic. Unknown information is shown with next actions. No solution can exceed the saved budget; changing it always requires your action.
4. Choose a seller/delivery/technician interval, then review Complete Solution. Refresh preserves the selection as long as it remains valid. Editing requirements clears an affected selection. No order or booking is made.

## State and trust

React Context plus versioned sessionStorage, no external state framework. Only actual field changes and explicit confirmations lock values against future AI suggestions. Unchanged default values remain open to new suggestions. A separate shopping-preferences confirmation can lock unchanged values deliberately. Known technical answers require explicit attestation; image-derived observations never confirm a provider setup automatically.

Version 1 stored every form field as edited. Migration preserves requirements, analysis, selection and dates, and retains non-default and confirmed technical values. Exact historical edits to default-valued fields cannot be reconstructed: re-confirm those if you want them locked. Session storage contains no image or API credential. Storage failure is announced and memory-only operation remains possible.

## Test scenario

Use $150 / USD, ZIP 10001, Budget Mode, installation included. Set delivery and installation completion to the earliest express test delivery date displayed in Preferences; mark both mandatory. Before 23:00 New York time this is tomorrow; at/after 23:00 processing rolls to the next calendar day, so earliest delivery is the day after tomorrow. For this TEST only: retained ONT, Ethernet yes, Automatic/DHCP, no VLAN or other provider requirements, minimum port speed 1000 Mbps, 2 wired devices, required 5 GHz band, include $5 cable. Confirm technical answers and save.

Expected: Demo Metro Tech / Alex = $135.16 (74 router + 10 delivery + 5 cable + 35 installation + 11.16 TEST tax). Delivery noon, installation 14:00–15:00 New York time. Sam is another option at $146.06 with a later interval. Choose a solution, refresh, verify it persists. Set $50: no complete solutions. Restore $150 and choose unknown connection method: verification-only options, with plain instructions.

When the session expires, Refresh test schedules updates only fictional delivery/technician dates and clears the selection. Budget, connection answers and user deadlines remain unchanged. Review old deadlines rather than silently shifting them. All dates use America/New_York calendar arithmetic including DST.

## Boundaries

Three stores, two technicians, products, prices, slots and specs are fictional. TEST tax is a fictional 9% of all line items for ZIP 10001, not a real tax calculation. Unknown required accessory/tax costs cannot produce a guaranteed final quote. Quote lines use integer USD cents. Gateway bridge/AP setups and special ISP restrictions require verification. No real Wi-Fi throughput or coverage guarantee is derived from port speeds. Technical ranking scores port-speed headroom up to 2x the confirmed minimum, then price, not AX marketing labels.

JPEG/PNG/WebP only, at most 5 MB and 20 megapixels, text at most 6000 characters. Images are decoded, metadata-stripped and resized in memory before sending to Meta. MatchCart does not persist photos. Model replies are server-validated and all extracted technical facts stay unverified. No automatic retries or fake AI fallbacks.

Accessibility: semantic landmarks, step navigation, labels, visible focus, error/status announcements, keyboard path, large controls and 200% text checks. Automated axe checks do not establish full WCAG 2.2 AA conformance; no full audit is claimed. No disability information is required.

## Production AI demo

Read docs/PUBLIC_DEMO.md. Production requires Upstash Redis shared atomic quotas and a real Cloudflare Turnstile widget restricted to the demo HTTPS hostname. Missing configuration fails closed. No blanket removal of PUBLIC_LAUNCH_BLOCKED and no production bypass. Local npm run dev remains available with real Meta.

Public-service acceptance is pending until real credentials, a deployment hostname and live checks are supplied. No public deployment or cloud-account setup is claimed. npm start without protection credentials can preview deterministic features but cannot call Meta.

## Code map

- src/app: four routes, layout, analyze API and secure demo-session route
- src/components: Assistant, Preferences, journey navigation, expiry notice, cards, comparisons and visitor challenge
- src/state: shared request/progress state, merge policy and migration
- src/domain: validated requirements and extraction types
- src/catalogs: fictional commercial and technical fixture data
- src/compatibility: three-state technical rules
- src/recommendations: full quotes, ranking and New York time calculations
- src/ai: server Meta adapter, bounded request/image handling
- src/security: shared quota enforcement, signed demo session and server configuration
- tests: state, engine, API/errors, protection, UI journey and accessibility

Final local audit: docs/LOCAL_AUDIT_STAGE4.md. Public service onboarding and deployment are deliberately deferred by the user; existing protection remains in place.

Code review follow-up on b71564b: refreshed test schedules use the next processing day after the 23:00 New York cutoff. COMPATIBLE is based on user-confirmed answers and fictional catalog specs, not independent certification. AI question-topic links open the corresponding Preferences field, including Advanced Settings.

Stage 5 UI/UX report and visual checks: docs/STAGE5_UI_UX.md. Three-minute local demo outline: docs/DEMO_RUNBOOK.md. Visual baselines are versioned under tests/e2e/visual.spec.ts-snapshots; review exports are in ignored artifacts/stage5.
