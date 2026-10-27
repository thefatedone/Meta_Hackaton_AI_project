import 'server-only';
export function getMetaConfig() {
 const apiKey = process.env.META_MODEL_API_KEY;
 const baseUrl = process.env.META_MODEL_API_BASE_URL ?? 'https://api.meta.ai/v1';
 if (new URL(baseUrl).protocol !== 'https:') throw new Error('Meta API requires HTTPS');
 return { apiKey, baseUrl, model: process.env.META_MODEL_ID ?? 'muse-spark-1.3', configured: Boolean(apiKey?.trim()) };
}

