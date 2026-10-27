import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorizeDemo,issueDemoSession,readDemoSession,reserveQuota, type DemoGuardConfig} from '../src/security/demo-guard';
import {AnalysisError} from '../src/ai/meta/client';
import {handleAnalysis} from '../src/ai/request-handler';
const config:DemoGuardConfig={redisUrl:'https://example.upstash.io',redisToken:'test-only-redis-credential',turnstileSecret:'test-only-turnstile-secret',siteKey:'test-widget',appOrigin:'https://matchcart.example',namespace:'test'};
function request(){return new Request(config.appOrigin+'/api/analyze',{headers:{origin:config.appOrigin,cookie:issueDemoSession(config).split(';')[0]}});}
function form(){const f=new FormData();f.set('cf-turnstile-response','test-token');return f;}
const errorCode=(code:string)=>(e:unknown)=>e instanceof AnalysisError&&e.code===code;
test('signed session refuses tampering and expiration',()=>{const req=request();assert.ok(readDemoSession(req,config));const cookie=req.headers.get('cookie')!;const tampered=new Request(req,{headers:{cookie:cookie.slice(0,-1)+(cookie.endsWith('a')?'b':'a')}});assert.equal(readDemoSession(tampered,config),null);assert.equal(readDemoSession(req,config,Date.now()+90000000),null);});
test('missing token, session, hostile origin and honeypot never contact external services',async()=>{
 const never=async()=>{throw new Error('Unexpected external call');};
 await assert.rejects(authorizeDemo(new Request(config.appOrigin),form(),config,never),errorCode('ORIGIN'));
 await assert.rejects(authorizeDemo(new Request(config.appOrigin,{headers:{origin:config.appOrigin}}),form(),config,never),errorCode('DEMO_SESSION'));
 await assert.rejects(authorizeDemo(request(),new FormData(),config,never),errorCode('BOT_CHECK'));
 const f=form();f.set('website','spam');await assert.rejects(authorizeDemo(request(),f,config,never),errorCode('BOT_CHECK'));
});
test('invalid challenge hostname, action or replay rejection cannot consume AI quota',async()=>{
 for(const verdict of [{success:false},{success:true,hostname:'other.example',action:'analyze'},{success:true,hostname:'matchcart.example',action:'login'}]){
 let calls=0;await assert.rejects(authorizeDemo(request(),form(),config,async url=>{calls++;assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');return Response.json(verdict);}),errorCode('BOT_CHECK'));assert.equal(calls,1);
 }
});
test('valid challenge reserves shared quotas with a single atomic EVAL',async()=>{
 const calls:string[]=[];await authorizeDemo(request(),form(),config,async(url,init)=>{calls.push(String(url));if(calls.length===1)return Response.json({success:true,hostname:'matchcart.example',action:'analyze'});const command=JSON.parse(init?.body as string);assert.equal(command[0],'EVAL');assert.equal(command[2],'4');assert.equal(command[7],'2');assert.equal(command[10],'100');return Response.json({result:0});});assert.equal(calls.length,2);
});
test('shared minute/day/lifetime limit or failed Redis blocks before model',async()=>{
 for(const [result,code] of [[1,'DEMO_RATE_LIMIT'],[2,'DEMO_RATE_LIMIT'],[3,'DEMO_QUOTA'],[4,'DEMO_QUOTA']] as const)await assert.rejects(reserveQuota('session',config,async()=>Response.json({result})),errorCode(code));
 for(const response of [new Response('private',{status:500}),Response.json({error:'private'}),Response.json({result:'bad'})])await assert.rejects(reserveQuota('session',config,async()=>response),errorCode('PROTECTION_UNAVAILABLE'));
 await assert.rejects(reserveQuota('session',config,async()=>{throw new Error('private');}),errorCode('PROTECTION_UNAVAILABLE'));
});
test('request handler enforces authorization before any paid call',async()=>{
 const f=new FormData();f.set('text','router');let paid=0;
 const response=await handleAnalysis(new Request('https://matchcart.example/api/analyze',{method:'POST',body:f}),async()=>{paid++;throw new Error();},async()=>{throw new AnalysisError('DEMO_QUOTA','Quota exhausted',429);});
 assert.equal(response.status,429);assert.equal(paid,0);
});

test('configured HTTPS origin works behind an internal HTTP proxy without trusting forwarded origin',async()=>{
 const f=new FormData();f.set('text','router');let authorized=false;
 const response=await handleAnalysis(new Request('http://internal:3000/api/analyze',{method:'POST',body:f,headers:{origin:'https://matchcart.example',host:'internal:3000'}}),async()=>{throw new AnalysisError('TEST_REACHED_MODEL','Validated request',503);},async()=>{authorized=true;},'https://matchcart.example');
 assert.equal(authorized,true);assert.equal((await response.json()).error.code,'TEST_REACHED_MODEL');
});
