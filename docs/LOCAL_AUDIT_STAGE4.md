# Stage 4 — final local audit

Date: October 27, 2026 (Asia/Tbilisi). Scope: local application and real Meta integration. Upstash, Cloudflare Turnstile and Vercel onboarding/deployment are intentionally deferred by the user. Their protection architecture and PUBLIC_LAUNCH_BLOCKED behavior are retained. No external service was registered and no public deployment was performed.

## Findings and fixes

| Finding | Fix and evidence |
| --- | --- |
| A malformed 200 response could enter React state and crash the result view/provider. HTML proxy errors also produced an unclear parsing message. | Validate extraction on the client before state updates; show readable API/network/invalid-result messages and focus the error. E2E covers quota errors, HTML 502 and malformed success without losing saved preferences. |
| Editing a technical field left the earlier attestation checkbox checked. | Clear the checkbox on technical edits; require fresh explicit attestation. E2E verifies that saving without re-confirmation persists confirmed=false. |
| Date validation accepted calendar-shaped but impossible dates. | Use ISO calendar-date validation, including AI date application and state restoration. Unit test covers February 30. |
| A different/unknown device category could reach the router-only comparison without an explicit scope check. | Stop comparison until the user updates the request or explicitly discards the analysis and starts manual router setup. Manual fallback clears technical attestation and solution selection. |
| An in-flight response could update shared state after leaving the Assistant. | Abort on unmount; add a client timeout; do not apply an aborted response. E2E delays a response and navigates away, then verifies unchanged extraction state. |
| The completed journey link displayed Choice saved, but its aria-label omitted that visible text (WCAG label-in-name). | Use the actual visible step text as the accessible name. Axe checks now include the selected full solution as well as initial pages. |
| A real photo run produced an incomplete/invalid Meta result. | A diagnostic repeat returned a valid stop response with 2478 reasoning tokens out of 2844 completion tokens; that does not prove the original failure cause. Set documented reasoning_effort=low for extraction while retaining the 4096-token ceiling; surface finish_reason=length separately as INCOMPLETE_RESPONSE. No automatic paid retry. A subsequent real photo-to-solution run passed. |

## Verification

- npm test: 45 passing unit/integration tests.
- npm run test:e2e: 10 passing browser tests.
- npm run typecheck: passing.
- npm run build: passing.
- Real Meta, no stub: submitted the accepted English text plus the user's manually redacted label photo through the actual browser form. Extracted model Archer AX10(US), readable image, budget 15000 USD cents. Continued through Preferences, confirmed TEST connection answers, selected Metro/Alex, saw $135.16 and verified persistence after reload.
- E2E fixtures are isolated to tests and do not replace the production adapter. Error injection tests intentionally use stubs; the real Meta run above is separate.
- Accessibility checks: axe WCAG 2 A/AA, 2.1 A/AA and available 2.2 AA rules on all routes and the selected solution; skip-link keyboard focus; a complete manual setup-to-selection journey using only Tab/keyboard controls; 200% text/reflow at a 640-pixel viewport; focused error messages.
- State checks: actual-edit vs explicit-confirmation priority, unchanged saves, unknown facts, expired fixture refresh, old-state migration, invalid JSON storage, unavailable storage and saved choice persistence.
- Business checks: insufficient budget, separate delivery/installation constraints, unknown technical facts, itemized accessory/tax/installation totals and excluded technicians remain covered.

## Limits and recommendations

Local acceptance of the main path is complete. This is not public production acceptance, a full security audit, independent hardware certification or a full WCAG conformance claim.

Before the recorded demo, run one human keyboard/screen-reader session (for example with NVDA on Windows), use the exact chosen browser and verify New York dates. AI is non-deterministic; readable model labels do not prove provider compatibility, and a failed analysis must remain a recoverable error. The successful live run is evidence of current operation, not a guarantee of every future response.

Keep test stores, tax, specifications and slots explicitly marked as fictional. Maintain the supported router-only scope. No real checkout or booking is enabled.

Production remains a separate user-approved stage: service registration, real shared Redis counters and persistence/no-eviction settings, Turnstile hostname/action/replay checks, HTTPS deployment and secure cookies, multi-client quota/exhaustion tests, Meta spending settings and secret inspection. Follow PUBLIC_DEMO.md when the user resumes that stage. Do not ask for domain/tokens now and do not remove the protection guard.

Relevant official parameter reference: https://dev.meta.ai/docs/protocols/chat-completions (reasoning_effort and max_completion_tokens).
