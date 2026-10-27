import { getMetaConfig } from '@/ai/meta/config';
import { analyzeWithMeta } from '@/ai/meta/client';
import { handleAnalysis } from '@/ai/request-handler';
export const runtime = 'nodejs';
export async function POST(request: Request) {
 return handleAnalysis(request, input => analyzeWithMeta(input, getMetaConfig()));
}
