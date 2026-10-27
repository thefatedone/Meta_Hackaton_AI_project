import { getMetaConfig } from '@/ai/meta/config';
import { analyzeWithMeta } from '@/ai/meta/client';
import { handleAnalysis } from '@/ai/request-handler';
import { getDemoGuardConfig } from '@/security/config';
import { authorizeDemo } from '@/security/demo-guard';
export const runtime = 'nodejs';
export async function POST(request: Request) {
 const protectedMode = process.env.NODE_ENV === 'production' || process.env.DEMO_PROTECTION === 'enabled';
 const guard = protectedMode ? getDemoGuardConfig() : null;
 if (protectedMode && !guard) return Response.json({error:{code:'PUBLIC_LAUNCH_BLOCKED',message:'The public AI demo is not configured yet. You can still enter your requirements manually.'}}, {status:503,headers:{'Cache-Control':'no-store'}});
 return handleAnalysis(request, input => analyzeWithMeta(input, getMetaConfig()), guard ? form => authorizeDemo(request, form, guard) : undefined, guard?.appOrigin);
}
