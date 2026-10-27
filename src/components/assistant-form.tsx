'use client';
import { DemoChallenge } from './demo-challenge';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRequest } from '../state/request-context';
import { extractionSchema, type ExtractedRequirements } from '@/domain/extraction';
export function AssistantForm() {
 const {state,ready,receive,describe}=useRequest();
 const protectedMode=process.env.NODE_ENV==='production'||process.env.NEXT_PUBLIC_DEMO_PROTECTION==='enabled';
 const [challengeToken,setChallengeToken]=useState('');const [attempt,setAttempt]=useState(0);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [result, setResult] = useState<ExtractedRequirements | null>(null);
 const pending=useRef<AbortController|null>(null);
 useEffect(()=>()=>pending.current?.abort(),[]);
 const resultRef=useRef<HTMLElement>(null);const errorRef=useRef<HTMLParagraphElement>(null);
 const displayedResult=result??state.extraction;
 async function submit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault(); if (loading) return;
 setError(''); setResult(null);
 const form = new FormData(event.currentTarget);
 if(protectedMode)form.set('cf-turnstile-response',challengeToken);
 const photo = form.get('photo');
 if (photo instanceof File && photo.size > 5 * 1024 * 1024) { setError('Photo must be 5 MB or smaller.');requestAnimationFrame(()=>errorRef.current?.focus()); return; }
 if(!String(form.get('text')??'').trim()&&(!(photo instanceof File)||photo.size===0)){setError('Describe your problem or attach a device photo.');requestAnimationFrame(()=>errorRef.current?.focus());return;}
 const controller=new AbortController();pending.current=controller;
 setLoading(true);
 try {
 const response = await fetch('/api/analyze', { method: 'POST', body: form, signal:AbortSignal.any([controller.signal,AbortSignal.timeout(60000)]) });
 const data = await response.json().catch(()=>null);
 if (!response.ok) throw new Error(typeof data?.error?.message==='string'?data.error.message:'The service could not process your request. Please retry.');
 const parsed=extractionSchema.safeParse(data?.result);
 if(!parsed.success)throw new Error('The service returned an invalid analysis. Please retry; your saved preferences are unchanged.');
 if(controller.signal.aborted)return;
 setResult(parsed.data); receive(parsed.data);requestAnimationFrame(()=>resultRef.current?.focus());
 } catch (err) { if(controller.signal.aborted)return;setError(err instanceof Error && err.name==='TimeoutError'?'Analysis took too long. Please try again.':err instanceof TypeError?'Could not connect to the service. Please try again.':err instanceof Error ? err.message : 'Connection failed. Please retry.');requestAnimationFrame(()=>errorRef.current?.focus()); }
 finally { if(!controller.signal.aborted){setLoading(false);setChallengeToken('');setAttempt(a=>a+1);} }
 }
 if(!ready)return <p role="status">Loading your request…</p>;
 return <><form className="panel" onSubmit={submit} aria-labelledby="request-title" aria-busy={loading}>
 <h2 id="request-title">Tell us what you need</h2>
 <p>Meta AI extracts your requirements. Technical details remain unverified until checked.</p>
 <label htmlFor="description">Describe your problem</label><textarea id="description" disabled={loading} name="text" value={state.description} onChange={e=>describe(e.target.value)} rows={5} maxLength={6000} placeholder="I need a new Wi-Fi router. My total budget is $150, including delivery and installation. I need it tomorrow." />
 <label htmlFor="photo">Photo of your current router (optional)</label><input id="photo" disabled={loading} name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" />
 <p id="photo-help" className="muted">JPEG, PNG or WebP, up to 5 MB and 20 megapixels. Cover passwords and personal information. The image is sent to Meta for analysis, without being saved by MatchCart. Metadata is removed.</p>
 {protectedMode&&<DemoChallenge attempt={attempt} onToken={setChallengeToken}/>}
 <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
 <button className="button" type="submit" disabled={loading||(protectedMode&&!challengeToken)}>{loading ? 'Analyzing with Meta…' : 'Analyze request'}</button>
 <p role="status" aria-live="polite">{loading ? 'Please wait while Meta analyzes your request.' : result ? (result.clarificationQuestions.length ? 'Analysis received. More information is needed.' : 'Analysis received.') : ''}</p>
 {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
 </form>
 {displayedResult && <section ref={resultRef} tabIndex={-1} className="panel" aria-labelledby="result-title"><h2 id="result-title">{displayedResult.clarificationQuestions.length ? 'Let’s check a few details' : 'Your extracted requirements'}</h2><p>{displayedResult.summary}</p><p className="muted">This is your last successful analysis. If you edit the request, analyze it again to update these observations.</p><p><strong>Technical information is unverified. Compatibility has not been checked.</strong></p>
 <p>Next, review your budget and tell us what is connected to your router. You can answer “I do not know”; we will show what still needs checking.</p>
 <details><summary>AI observations and questions</summary><ul>{displayedResult.clarificationQuestions.map((q,i)=><li key={i}>{q}</li>)}</ul><p>These are observations, not confirmed facts. The next step uses simple fields to check your requirements.</p></details>
 <nav aria-label="Where to answer AI questions"><p>Choose a topic to answer the questions above in Preferences. Your existing answers stay saved.</p><ul><li><Link href="/preferences#budget">Budget, delivery and installation dates</Link></li><li><Link href="/preferences#protocol">Provider connection method and other internet settings</Link></li><li><Link href="/preferences#speedMbps">Internet speed, connected devices and Wi-Fi needs</Link></li></ul></nav>
 <Link className="button" href="/preferences">Review and confirm requirements</Link><details><summary>Technical JSON details</summary><pre className="structured-result">{JSON.stringify(displayedResult, null, 2)}</pre></details></section>}
 <p><Link href="/preferences">Continue without AI — enter requirements yourself</Link></p>
 </>;
}
