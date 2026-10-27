import sharp from 'sharp';
import { AnalysisError } from './meta/client';
import type { ExtractedRequirements } from '../domain/extraction';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function handleAnalysis(request: Request, analyze: (input: { text: string; imageDataUrl?: string }) => Promise<ExtractedRequirements>, authorize?: (form:FormData)=>Promise<void>, expectedOrigin?: string) {
 try {
 const origin = request.headers.get('origin');
 // Next may normalize request.url to its bind address. Host preserves the address used by the browser.
 const requestUrl = new URL(request.url);
 const host = request.headers.get('host') ?? requestUrl.host;
 let sameOrigin = !origin;
 // In production the configured public HTTPS origin is authoritative behind TLS proxies.
 try { sameOrigin = !origin || new URL(origin).origin === (expectedOrigin ?? new URL(requestUrl.protocol + '//' + host).origin); }
 catch { sameOrigin = false; }
 if (!sameOrigin || request.headers.get('sec-fetch-site') === 'cross-site') throw new AnalysisError('ORIGIN', 'Cross-origin requests are not allowed.', 403);
 if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new AnalysisError('INPUT', 'Use a multipart form request.', 415);
 const reader = request.body?.getReader();
 if (!reader) throw new AnalysisError('INPUT', 'Request body is missing.', 400);
 const chunks: Uint8Array[] = []; let size = 0;
 while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new AnalysisError('TOO_LARGE', 'Photo must be 5 MB or smaller.', 413); } chunks.push(part.value); }
 let form: FormData;
 try { form = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': request.headers.get('content-type')! }, body: Buffer.concat(chunks) }).formData(); }
 catch { throw new AnalysisError('INPUT', 'The submitted form is invalid.', 400); }
 if (form.getAll('text').length > 1 || form.getAll('photo').length > 1) throw new AnalysisError('INPUT', 'Send one request and at most one photo.', 400);
 const rawText = form.get('text');
 if (rawText !== null && typeof rawText !== 'string') throw new AnalysisError('INPUT', 'Text must be a string.', 400);
 const text = (rawText ?? '').trim();
 if (text.length > 6000) throw new AnalysisError('INPUT', 'Keep your request under 6,000 characters.', 400);
 const photo = form.get('photo'); let imageDataUrl: string | undefined;
 if (photo !== null && !(photo instanceof File)) throw new AnalysisError('INPUT', 'Photo must be a file.', 400);
 if (photo instanceof File && photo.size > 0) {
 if (photo.size > MAX_IMAGE_BYTES) throw new AnalysisError('TOO_LARGE', 'Photo must be 5 MB or smaller.', 413);
 if (!['image/jpeg','image/png','image/webp'].includes(photo.type)) throw new AnalysisError('IMAGE_TYPE', 'Use a JPEG, PNG or WebP image.', 415);
 try {
 const bytes = Buffer.from(await photo.arrayBuffer());
 const metadata = await sharp(bytes, { limitInputPixels: 20000000, animated: false }).metadata();
 const expected = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' }[photo.type];
 if (metadata.format !== expected || (metadata.pages ?? 1) > 1) throw new Error('Image format mismatch');
 // Decode and re-encode to validate content, strip metadata, and bound upstream payload.
 const cleaned = await sharp(bytes, { limitInputPixels: 20000000 }).rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
 imageDataUrl = 'data:image/jpeg;base64,' + cleaned.toString('base64');
 } catch { throw new AnalysisError('IMAGE_INVALID', 'Image cannot be read. Use a valid, non-animated JPEG, PNG or WebP under 20 megapixels.', 415); }
 }
 if (!text && !imageDataUrl) throw new AnalysisError('INPUT', 'Describe your problem or attach a device photo.', 400);
 if (authorize) await authorize(form);
 const result = await analyze({ text, imageDataUrl });
 return reply({ status: result.clarificationQuestions.length ? 'needs_clarification' : 'success', result });
 } catch (error) {
 if (error instanceof AnalysisError) return reply({ error: { code: error.code, message: error.message } }, error.status);
 return reply({ error: { code: 'INTERNAL', message: 'The request could not be processed. Please try again.' } }, 500);
 }
}
