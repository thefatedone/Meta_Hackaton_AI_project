'use client';
import { Icon } from './icon';
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
 const [preview,setPreview]=useState<string|null>(null);const [photoName,setPhotoName]=useState('');const photoInput=useRef<HTMLInputElement>(null);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
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
 return <><form className="panel assistant-panel" onSubmit={submit} aria-labelledby="request-title" aria-busy={loading}>
<div className="card-kicker"><p className="eyebrow">Your AI shopping assistant</p><span className="subtle-pill">Powered by Meta</span></div><h2 id="request-title">What can we help with?</h2>
 <p className="helper">A few words or a photo is enough to start. We’ll ask when something needs checking.</p>
 <label htmlFor="description">Describe your problem</label><textarea id="description" disabled={loading} name="text" value={state.description} onChange={e=>describe(e.target.value)} rows={5} maxLength={6000} placeholder="I need a new Wi-Fi router. My total budget is $150, including delivery and installation. I need it tomorrow." />
 <div className="upload-surface"><div className="upload-heading"><Icon name="upload"/><label htmlFor="photo">Photo of your current router (optional)</label></div><input id="photo" ref={photoInput} onChange={event=>{const file=event.target.files?.[0];setPhotoName(file?.name??'');setPreview(file&&file.size<=5*1024*1024&&['image/jpeg','image/png','image/webp'].includes(file.type)?URL.createObjectURL(file):null);}} disabled={loading} name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" />
 {preview&&<figure className="photo-preview"><img src={preview} alt="Your selected device photo"/><figcaption>{photoName}<br/>Ready to analyze. Not uploaded yet.</figcaption><button type="button" disabled={loading} onClick={()=>{if(photoInput.current)photoInput.current.value='';setPreview(null);setPhotoName('');photoInput.current?.focus();}}>Remove photo</button></figure>}
 <p id="photo-help" className="muted">JPEG, PNG or WebP, up to 5 MB and 20 megapixels. Cover passwords and personal information. The image is sent to Meta for analysis, without being saved by MatchCart. Metadata is removed.</p></div>
 {protectedMode&&<DemoChallenge attempt={attempt} onToken={setChallengeToken}/>}
 <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
 <button className="button wide-button" type="submit" disabled={loading||(protectedMode&&!challengeToken)}>{loading ? 'Analyzing with Meta…' : 'Analyze request'}<Icon name={loading?'clock':'arrow'}/></button>
 <p className={loading?"processing":"analysis-status"} role="status" aria-live="polite">{loading ? 'Please wait while Meta analyzes your request.' : result ? (result.clarificationQuestions.length ? 'Analysis received. More information is needed.' : 'Analysis received.') : ''}</p>
 {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
 </form>
 {displayedResult && <section ref={resultRef} tabIndex={-1} className="panel result-panel" aria-labelledby="result-title"><p className="eyebrow">Your request, understood</p><h2 id="result-title">{displayedResult.clarificationQuestions.length ? 'Let’s check a few details' : 'Your extracted requirements'}</h2><p>{displayedResult.summary}</p><dl className="requirements-summary"><div><dt>Total budget</dt><dd>{displayedResult.budget.amountCents===null?'Needs your input':(displayedResult.budget.amountCents/100).toLocaleString('en-US',{style:'currency',currency:displayedResult.budget.currency??'USD'})}{displayedResult.budget.amountCents!==null&&displayedResult.budget.currency===null?' (currency unconfirmed)':''}</dd></div><div><dt>Delivery request</dt><dd>{displayedResult.delivery.requested??'Not specified'}</dd></div><div><dt>Installation</dt><dd>{displayedResult.installationRequired===null?'Needs your input':displayedResult.installationRequired?'Help requested':'Not requested'}</dd></div><div><dt>Shopping mode</dt><dd>{displayedResult.mode===null?'Choose in next step':displayedResult.mode==='budget'?'Budget Mode':'Best Technical Solution'}</dd></div></dl>
 <div className="model-readout"><Icon name="router"/><p><small>Model mentioned or read · unverified</small><strong>{displayedResult.deviceModel??'Model not yet identified'}</strong></p></div>
 <p className="muted">This is your last successful analysis. If you edit the request, analyze it again to update these observations.</p><div className="review-note"><Icon name="help"/><p><strong>Technical information is unverified.</strong> Compatibility has not been checked. You stay in control of what gets confirmed.</p></div>
 <p>Next, review your budget and tell us what is connected to your router. You can answer “I do not know”; we will show what still needs checking.</p>
 <details><summary>AI observations and questions</summary><ul>{displayedResult.clarificationQuestions.map((q,i)=><li key={i}>{q}</li>)}</ul><p>These are observations, not confirmed facts. The next step uses simple fields to check your requirements.</p></details>
 <nav className="question-links" aria-label="Where to answer AI questions"><p>Choose a topic to answer the questions above in Preferences. Your existing answers stay saved.</p><ul><li><Link href="/preferences#budget">Budget, delivery and installation dates</Link></li><li><Link href="/preferences#protocol">Provider connection method and other internet settings</Link></li><li><Link href="/preferences#speedMbps">Internet speed, connected devices and Wi-Fi needs</Link></li></ul></nav>
 <Link className="button" href="/preferences">Review and confirm requirements</Link><details><summary>Technical JSON details</summary><pre className="structured-result">{JSON.stringify(displayedResult, null, 2)}</pre></details></section>}
 <p><Link href="/preferences">Continue without AI — enter requirements yourself</Link></p>
 </>;
}
