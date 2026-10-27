import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { validateExtraction } from '../src/domain/extraction';
import { analyzeWithMeta, AnalysisError } from '../src/ai/meta/client';
import { handleAnalysis, MAX_IMAGE_BYTES } from '../src/ai/request-handler';
const result = { category: 'wifi-router', budget: { amountCents: 15000, currency: 'USD', includes: ['device','delivery','installation'] }, mode: null, delivery: { requested: 'tomorrow', mandatory: true }, installationRequired: true, deviceModel: null, technicalParameters: [], imageAssessment: 'not_provided', clarificationQuestions: ['What WAN connection type does your ISP use?'], summary: 'Router replacement request.' };
const config = { apiKey: 'test-only-not-a-real-key', baseUrl: 'https://api.meta.ai/v1', model: 'muse-spark-1.3' };
const completion = (value: unknown, finish = 'stop') => Response.json({ choices: [{ finish_reason: finish, message: { content: JSON.stringify(value) } }] });
test('schema accepts partial requirements without inventing defaults', () => assert.equal(validateExtraction(result,false).mode,null));
test('rejects fractional/negative cents and unknown keys', () => { for(const cents of [-1,1.5]) assert.throws(() => validateExtraction({...result,budget:{...result.budget,amountCents:cents}},false)); assert.throws(() => validateExtraction({...result,confirmed:true},false)); });
test('rejects confirmed facts and false image provenance', () => { const fact={name:'WAN',value:'DHCP',source:'user_text',verification:'confirmed'}; assert.throws(() => validateExtraction({...result,technicalParameters:[fact]},false)); assert.throws(() => validateExtraction({...result,imageAssessment:'readable'},false)); });
test('uncertain image must request clarification', () => assert.throws(() => validateExtraction({...result,imageAssessment:'uncertain',clarificationQuestions:[]},true)));
test('missing key makes no upstream request', async () => { await assert.rejects(analyzeWithMeta({text:'router'}, {...config,apiKey:''}, async()=>{throw new Error('Must not call');}), (e: unknown) => e instanceof AnalysisError && e.code === 'NOT_CONFIGURED'); });
test('uses official endpoint, JSON schema and image payload', async () => {
 const imageResult={...result,imageAssessment:'uncertain'};
 const output=await analyzeWithMeta({text:'router',imageDataUrl:'data:image/jpeg;base64,eA=='},config,async(url,init)=>{ assert.equal(url,'https://api.meta.ai/v1/chat/completions'); const body=JSON.parse(init?.body as string); assert.equal(body.response_format.type,'json_schema'); assert.equal(body.reasoning_effort,'low'); assert.equal(body.max_completion_tokens,4096); assert.equal(body.messages[1].content[1].type,'image_url'); return completion(imageResult); });
 assert.equal(output.imageAssessment,'uncertain');
});
test('maps access, rate-limit and upstream errors without leaking body', async () => { for(const [status,code] of [[401,'ACCESS'],[403,'ACCESS'],[429,'RATE_LIMIT'],[500,'UPSTREAM']] as const) await assert.rejects(analyzeWithMeta({text:'router'},config,async()=>new Response('secret upstream body',{status})),(e: unknown)=>e instanceof AnalysisError && e.code===code && !e.message.includes('secret')); });
test('handles timeout, network, malformed and truncated output', async () => {
 for(const name of ['TimeoutError','Error']) await assert.rejects(analyzeWithMeta({text:'router'},config,async()=>{throw new DOMException('private',name);}), (e: unknown)=>e instanceof AnalysisError && e.code===(name==='TimeoutError'?'TIMEOUT':'NETWORK'));
 await assert.rejects(analyzeWithMeta({text:'router'},config,async()=>completion(result,'length')),(e:unknown)=>e instanceof AnalysisError && e.code==='INCOMPLETE_RESPONSE');
 for(const response of [completion({bad:true}),new Response('invalid json')]) await assert.rejects(analyzeWithMeta({text:'router'},config,async()=>response),(e: unknown)=>e instanceof AnalysisError && e.code==='INVALID_RESPONSE');
});
function request(form: FormData) { return new Request('http://localhost/api/analyze',{method:'POST',body:form}); }
test('empty request rejected before AI', async()=> { const r=await handleAnalysis(request(new FormData()),async()=>{throw new Error('Must not call');}); assert.equal(r.status,400); });
test('valid text request yields clarification status', async()=>{const f=new FormData();f.set('text','Router for $150');const r=await handleAnalysis(request(f),async input=>{assert.equal(input.text,'Router for $150');return validateExtraction(result,false);});assert.equal(r.status,200);assert.equal((await r.json()).status,'needs_clarification');});
test('rejects oversized images and disguised non-images', async()=>{for(const [bytes,status] of [[new Uint8Array(MAX_IMAGE_BYTES+1),413],[new TextEncoder().encode('not an image'),415]] as const){const f=new FormData();f.set('photo',new File([bytes],'router.png',{type:'image/png'}));const r=await handleAnalysis(request(f),async()=>{throw new Error('Must not call');});assert.equal(r.status,status);}});
test('valid photo is re-encoded in memory before AI',async()=>{const png=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).png().toBuffer();const f=new FormData();f.set('photo',new File([new Uint8Array(png)],'router.png',{type:'image/png'}));const r=await handleAnalysis(request(f),async input=>{assert.ok(input.imageDataUrl?.startsWith('data:image/jpeg;base64,'));return validateExtraction({...result,imageAssessment:'uncertain'},true);});assert.equal(r.status,200);});
test('cross-origin requests are rejected',async()=>{const f=new FormData();f.set('text','router');const r=await handleAnalysis(new Request('http://localhost/api/analyze',{method:'POST',body:f,headers:{origin:'https://other.example'}}),async()=>{throw new Error('Must not call');});assert.equal(r.status,403);});

test('browser Host is used when Next normalizes its internal URL', async()=>{
 const f=new FormData();f.set('text','router');
 const r=await handleAnalysis(new Request('http://127.0.0.1:3000/api/analyze',{method:'POST',body:f,headers:{host:'localhost:3000',origin:'http://localhost:3000','sec-fetch-site':'same-origin'}}),async()=>validateExtraction(result,false));
 assert.equal(r.status,200);
});
test('same host with different origin port remains blocked',async()=>{
 const f=new FormData();f.set('text','router');
 const r=await handleAnalysis(new Request('http://127.0.0.1:3000/api/analyze',{method:'POST',body:f,headers:{host:'localhost:3000',origin:'http://localhost:4000'}}),async()=>{throw new Error('Must not call');});assert.equal(r.status,403);
});
