# MatchCart

Meta Global AI Developer Hackathon 2026, Startup Track. Internal deadline: November 4, 2026, 18:00 Asia/Tbilisi.

## Run locally
Requires Node.js 24 and npm. Install with npm install. Copy .env.example to .env.local and fill META_MODEL_API_KEY with your own Meta key. Keep META_MODEL_API_BASE_URL=https://api.meta.ai/v1 and META_MODEL_ID=muse-spark-1.3 unless selecting another documented compatible Meta model. Restart the server after editing environment variables. Never commit .env.local or use NEXT_PUBLIC_ for secrets.

Run npm run dev and open http://localhost:3000. Validation: npm test, npm run typecheck, npm run build. Production: npm run build then npm start.

## Stage 2: request extraction
AI Assistant submits multipart text and an optional photo to POST /api/analyze. Only the server calls the official Meta Chat Completions API with JSON Schema. No AI simulation or automatic fallback exists. Missing credentials produce a clear 503 error. Upstream authentication, quota, network, timeout and invalid-output errors are handled without exposing response bodies or keys.

Photos: one JPEG, PNG or WebP, at most 5 MB and 20 megapixels. Entire request capped at 5 MB + 64 KB, text at 6,000 characters. Server decodes images, rejects format mismatches, strips metadata and resizes to at most 2048x2048 before sending a JPEG data URL to Meta. Images are held in memory only, never written to disk or logged by MatchCart. Meta processing/retention is governed by its service policy. Cover passwords and personal information before upload.

Extracted requirements are provisional, not compatibility decisions. Technical parameters always remain unverified. Unknown values stay null; delivery wording is preserved without inventing a date or time zone. Uncertain model identification requires clarification. Each submission is independent: append clarification answers to the original text and resubmit. No conversation or photos are persisted.

## Manual verification (requires a real Meta key)
1. Submit: I need a new Wi-Fi router. My total budget is $150, including delivery and installation. I need it tomorrow.
2. Verify real output: wifi-router, 15000 cents, USD, installation required, delivery wording tomorrow, and clarification for missing technical information. Unspecified mode must remain null.
3. Attach a clear photo of a router label with passwords covered. Verify legible details are marked unverified. With an unclear image, expect a model clarification rather than invented specifications.
4. Remove the key and restart: expect a configuration error, not a fabricated result. Try an invalid or oversized photo: expect rejection before model processing.

## Architecture
- src/app: four routes, layout, styling, server API route
- src/components: semantic UI and client assistant form
- src/domain: catalog/request types and validated extraction schema
- src/catalogs: explicitly fictional stores, products, offers and technicians
- src/ai/meta: server configuration and official Meta HTTP adapter
- src/ai/request-handler.ts: bounded request parsing and image processing
- src/compatibility: rule contracts; engine deferred
- tests: schema, transport errors, request validation and image processing

Three comparison stores and two technicians remain fictional. Preferences now drive compatibility and full quotes. No real payments or bookings. No full WCAG audit has been performed.

## Official API references
- https://dev.meta.ai/docs/models
- https://dev.meta.ai/docs/image-understanding
- https://dev.meta.ai/docs/structured-output

Tests use stub transports only within tests and make no paid calls. A passing test suite does not confirm account access or real-model accuracy. Before public deployment add shared rate limiting, abuse protection and deployment-specific body/time limits.

## Stage 3: complete demo solutions

Shared React Context and versioned sessionStorage preserve requirements, text, AI extraction and selected solution across routes and reloads within the same tab. No image is stored. Storage failures show a notice. Invalid stored data resets safely. Manual saved fields override later AI suggestions. AI technical observations stay unverified; confirmation of connection requirements is an explicit user action. Confirmation is user attestation, not independent inspection. JSON details are collapsible.

Preferences must be saved before comparison. Changing saved requirements clears the selected solution. Selected solution is resolved against newly calculated eligible options; invalid or expired selections do not display as valid quotes. Only USD is supported. Unknown currency, tax, required cable cost or budget keeps a quote provisional. Missing deadlines marked mandatory also block complete quotes.

Compatibility: a separate retained modem/ONT with Ethernet handoff, confirmed DHCP/PPPoE/static IP, VLAN needs, other ISP restrictions, minimum WAN port speed, LAN ports and required Wi-Fi band. Unsupported gateway configurations and special ISP requirements need verification. Direct DSL/coax modem replacement is incompatible with these Ethernet-only routers. There is no real throughput or coverage guarantee. All fixture specs are fictional. Budget ranks by complete cost; Technical ranks by WAN headroom up to 2x the confirmed minimum, then cost. Higher price or AX marketing labels do not earn points.

The catalog uses one per-session UTC anchor and America/New_York calendar-day arithmetic (including DST). Deliveries are at noon one/two days after the session anchor; the demo order cutoff is 23:00 on the anchor day. Technicians have 14:00–15:00 and 16:00–17:00 New York intervals on the next three days. Delivery and installation completion deadlines are separate, at local end of day. Intervals before delivery, in the past, outside service ZIP or after mandatory deadlines are excluded. If a session expires, reset it in Preferences to regenerate dates. These are generated test schedules, never real availability promises.

Fictional tax assumption: ZIP 10001, 900 basis points (9%) on ALL line items, rounded once to the nearest cent. It is not a real tax calculation. Other ZIPs have unknown tax and no guaranteed final quote (delivery coverage is currently 10001 only). Required demo cable costs $5; if already owned it adds zero. Money is integer cents; invalid/negative catalog prices stop calculation.

### Manual end-to-end scenario
1. Run npm run dev. In AI Assistant send the accepted router request and optionally a redacted label photo. Open Review and confirm requirements.
2. Confirm $150, USD, ZIP 10001, Budget Mode, installation included. Set delivery and installation dates to tomorrow as shown in New York time and mark both mandatory.
3. For the TEST scenario only: select retained ONT, Ethernet yes, DHCP, VLAN not required, no other ISP requirements, minimum port speed 1000 Mbps, two LAN ports, 5 GHz and include cable. Check technical confirmation and save. Do not treat these fixture answers as facts about your home network.
4. Compare: Demo Metro Tech / Alex should offer $135.16 total (74 + 10 + 5 + 35 + 11.16 tax), noon delivery followed by 14:00 installation. Sam is another selectable option. The slower North delivery misses tomorrow; Harbor exceeds $150 with installation and tax.
5. Choose an option and review Complete Solution. Refresh: preferences and selection remain in the tab. Reduce budget to $50 and save: no confirmed solution, earlier selection cleared. Choose unknown protocol: options move to verification. Choose 6 GHz: devices fail the band requirement.
6. To compare mode ranking, increase budget or remove installation so both models fit. Technical Mode prioritizes the 2500 Mbps port's headroom for a confirmed 1000 Mbps minimum; Budget Mode prefers the cheaper complete quote.

Tests: npm test (AI transport/schema and business rules); npm run test:e2e (browser navigation, persistence, cost and selection); npm run typecheck; npm run build. For a new machine run npx playwright install chromium before browser tests. E2E does not call Meta; real API checks are separate.

### PUBLIC LAUNCH BLOCKER — required spending protection
A durable shared rate limiter plus authenticated quotas, trusted client identity and provider spending limits are NOT implemented. An in-memory counter is not adequate for distributed deployment. To prevent accidentally exposing the paid endpoint, /api/analyze returns PUBLIC_LAUNCH_BLOCKED whenever NODE_ENV=production. Local npm run dev retains real Meta analysis. npm start can preview deterministic features but cannot call Meta. Before public deployment implement and verify shared protection, then replace the guard with that enforcement. Do not remove the guard merely to publish. No production deployment is claimed.
