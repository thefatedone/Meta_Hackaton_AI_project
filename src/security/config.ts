import 'server-only';
import type { DemoGuardConfig } from './demo-guard';

export function getDemoGuardConfig(): DemoGuardConfig | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const appOrigin = process.env.DEMO_APP_ORIGIN?.trim();
  const namespace = process.env.DEMO_QUOTA_NAMESPACE?.trim();
  if (!redisUrl || !redisToken || !turnstileSecret || !siteKey || !appOrigin || !namespace) return null;
  try {
    const redis = new URL(redisUrl);
    const origin = new URL(appOrigin);
    if (redis.protocol !== 'https:' || !redis.hostname.endsWith('.upstash.io') || redis.username || redis.password ||
        redis.pathname !== '/' || redis.search || redis.hash || origin.protocol !== 'https:' ||
        origin.origin !== appOrigin || !/^[a-z0-9-]{1,64}$/.test(namespace)) return null;
  } catch { return null; }
  // Always-pass testing credentials must not enable a public production demo.
  if (/^[123]x00000000000000000000/.test(siteKey)) return null;
  return { redisUrl, redisToken, turnstileSecret, siteKey, appOrigin, namespace };
}
