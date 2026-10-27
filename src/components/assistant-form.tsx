'use client';
import { useState, type FormEvent } from 'react';
import type { ExtractedRequirements } from '@/domain/extraction';
export function AssistantForm() {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [result, setResult] = useState<ExtractedRequirements | null>(null);
 async function submit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault(); if (loading) return;
 setError(''); setResult(null);
 const form = new FormData(event.currentTarget);
 const photo = form.get('photo');
 if (photo instanceof File && photo.size > 5 * 1024 * 1024) { setError('Photo must be 5 MB or smaller.'); return; }
 setLoading(true);
 try {
 const response = await fetch('/api/analyze', { method: 'POST', body: form });
 const data = await response.json();
 if (!response.ok) throw new Error(data.error?.message || 'Request failed. Please retry.');
 setResult(data.result);
 } catch (err) { setError(err instanceof Error ? err.message : 'Connection failed. Please retry.'); }
 finally { setLoading(false); }
 }
 return <><form className="panel" onSubmit={submit} aria-labelledby="request-title" aria-busy={loading}>
 <h2 id="request-title">Tell us what you need</h2>
 <p>Meta AI extracts your requirements. Technical details remain unverified until checked.</p>
 <label htmlFor="description">Describe your problem</label><textarea id="description" name="text" rows={5} maxLength={6000} placeholder="I need a new Wi-Fi router. My total budget is $150, including delivery and installation. I need it tomorrow." />
 <label htmlFor="photo">Photo of your current router (optional)</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" />
 <p id="photo-help" className="muted">JPEG, PNG or WebP, up to 5 MB and 20 megapixels. Cover passwords and personal information. The image is sent to Meta for analysis, without being saved by MatchCart. Metadata is removed.</p>
 <button className="button" type="submit" disabled={loading}>{loading ? 'Analyzing with Meta…' : 'Analyze request'}</button>
 <p role="status" aria-live="polite">{loading ? 'Please wait while Meta analyzes your request.' : result ? (result.clarificationQuestions.length ? 'Analysis received. More information is needed.' : 'Analysis received.') : ''}</p>
 {error && <p role="alert">{error}</p>}
 </form>
 {result && <section className="panel" aria-labelledby="result-title"><h2 id="result-title">{result.clarificationQuestions.length ? 'A few details to clarify' : 'Your extracted requirements'}</h2><p>{result.summary}</p><p><strong>Technical information is unverified. Compatibility has not been checked.</strong></p>
 {result.clarificationQuestions.length > 0 && <><ul>{result.clarificationQuestions.map((q,i) => <li key={i}>{q}</li>)}</ul><p>Add the answers to your request above and analyze it again. Each submission is independent.</p></>}
 <h3>Structured result</h3><pre className="structured-result">{JSON.stringify(result, null, 2)}</pre></section>}
 </>;
}
