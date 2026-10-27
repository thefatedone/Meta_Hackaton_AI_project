import { getMetaConfig } from '@/ai/meta/config';
import { analyzeWithMeta } from '@/ai/meta/client';
import { handleAnalysis } from '@/ai/request-handler';
export const runtime = 'nodejs';
export async function POST(request: Request) {
 // PUBLIC LAUNCH BLOCKER: shared durable rate limiting and authenticated quotas are not yet installed.
 if (process.env.NODE_ENV === 'production') return Response.json({error:{code:'PUBLIC_LAUNCH_BLOCKED',message:'Meta analysis is disabled in production until shared API spending protection is configured. For local development use npm run dev.'}}, {status:503,headers:{'Cache-Control':'no-store'}});
 return handleAnalysis(request, input => analyzeWithMeta(input, getMetaConfig()));
}
