import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AnalysisError } from '../ai/meta/client';

export interface DemoGuardConfig {
  redisUrl: string;
  redisToken: string;
  turnstileSecret: string;
  siteKey: string;
  appOrigin: string;
  namespace: string;
}

export const DEMO_LIMITS = { sessionMinute: 2, globalMinute: 5, globalDay: 50, total: 100 };
// All checks and reservations run atomically on the shared Redis instance.
export const QUOTA_SCRIPT = `local limits = {tonumber(ARGV[1]),tonumber(ARGV[2]),tonumber(ARGV[3]),tonumber(ARGV[4])}
for i=1,4 do
 local used=tonumber(redis.call('GET',KEYS[i]) or '0')
 if used>=limits[i] then return i end
end
for i=1,4 do
 local count=redis.call('INCR',KEYS[i])
 if count==1 and i<4 then
  local ttl=60
  if i==3 then ttl=86400 end
  redis.call('EXPIRE',KEYS[i],ttl)
 end
end
return 0`;

const cookieName = 'matchcart_demo';
function sign(value: string, key: string) {
  return createHmac('sha256', key).update(value).digest('hex');
}

export function issueDemoSession(config: DemoGuardConfig, now = Date.now()) {
  const payload = randomUUID() + '.' + Math.floor(now / 1000 + 86400);
  const value = payload + '.' + sign(payload, config.redisToken);
  return cookieName + '=' + value + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400';
}

export function readDemoSession(request: Request, config: DemoGuardConfig, now = Date.now()) {
  const value = request.headers.get('cookie')?.split(';').map(c => c.trim())
    .find(c => c.startsWith(cookieName + '='))?.slice(cookieName.length + 1) ?? '';
  const parts = value.split('.');
  if (parts.length !== 3 || !/^[0-9a-f-]{36}$/.test(parts[0]) ||
      !/^\d+$/.test(parts[1]) || !/^[0-9a-f]{64}$/.test(parts[2])) return null;
  const expected = sign(parts[0] + '.' + parts[1], config.redisToken);
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2])) || Number(parts[1]) * 1000 < now) return null;
  return parts[0];
}

export async function reserveQuota(session: string, config: DemoGuardConfig, transport: typeof fetch = fetch) {
  const prefix = 'matchcart:' + config.namespace + ':';
  const hashed = sign(session, config.redisToken);
  let response: Response;
  try {
    response = await transport(config.redisUrl, {
      method: 'POST', headers: { Authorization: 'Bearer ' + config.redisToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', QUOTA_SCRIPT, '4', prefix + 'session:' + hashed,
        prefix + 'minute', prefix + 'day', prefix + 'total', ...Object.values(DEMO_LIMITS).map(String)]),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AnalysisError('PROTECTION_UNAVAILABLE', 'Demo protection is temporarily unavailable. No AI request was sent.', 503);
  }
  try {
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.error || !Number.isInteger(data.result) || data.result < 0 || data.result > 4) throw new Error();
    if (data.result > 0) throw new AnalysisError(data.result >= 3 ? 'DEMO_QUOTA' : 'DEMO_RATE_LIMIT',
      data.result >= 3 ? 'The shared demo AI quota is exhausted. You can still enter your requirements manually.'
        : 'Too many demo requests. Wait one minute before trying again.', 429);
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    throw new AnalysisError('PROTECTION_UNAVAILABLE', 'Demo protection is temporarily unavailable. No AI request was sent.', 503);
  }
}

export async function authorizeDemo(request: Request, form: FormData, config: DemoGuardConfig, transport: typeof fetch = fetch) {
  if (request.headers.get('origin') !== config.appOrigin || request.headers.get('sec-fetch-site') === 'cross-site')
    throw new AnalysisError('ORIGIN', 'Please submit from the official demo page.', 403);
  const session = readDemoSession(request, config);
  if (!session) throw new AnalysisError('DEMO_SESSION', 'Refresh the page to start a secure demo session.', 403);
  const token = form.get('cf-turnstile-response');
  if (form.get('website')) throw new AnalysisError('BOT_CHECK', 'Please complete the visitor check.', 403);
  if (typeof token !== 'string' || !token || token.length > 2048)
    throw new AnalysisError('BOT_CHECK', 'Please complete the visitor check before analyzing.', 403);
  let verdict: { success?: boolean; hostname?: string; action?: string };
  try {
    const response = await transport('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: config.turnstileSecret, response: token }),
      signal: AbortSignal.timeout(8000), redirect: 'error', cache: 'no-store',
    });
    if (!response.ok) throw new Error();
    verdict = await response.json();
  } catch {
    throw new AnalysisError('PROTECTION_UNAVAILABLE', 'The visitor check is unavailable. Please try later or enter requirements manually.', 503);
  }
  if (verdict.success !== true || verdict.hostname !== new URL(config.appOrigin).hostname || verdict.action !== 'analyze')
    throw new AnalysisError('BOT_CHECK', 'Visitor check expired or failed. Complete it again and retry.', 403);
  // Reserve BEFORE Meta. Failed or timed-out Meta calls retain their reservation.
  await reserveQuota(session, config, transport);
}
