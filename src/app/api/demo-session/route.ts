import { getDemoGuardConfig } from '@/security/config';
import { issueDemoSession, readDemoSession } from '@/security/demo-guard';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const config = getDemoGuardConfig();
  if (!config) return Response.json({ error: 'Public AI demo protection has not been configured.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (request.headers.get('sec-fetch-site') === 'cross-site') return new Response(null, { status: 403 });
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (!readDemoSession(request, config)) headers['Set-Cookie'] = issueDemoSession(config);
  return Response.json({ ready: true }, { headers });
}
