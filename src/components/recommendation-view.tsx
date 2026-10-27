'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRequest } from '../state/request-context';
import { createDemoCatalog } from '../catalogs/demo';
import { recommend } from '../recommendations/engine';
import { SolutionCard } from './solution-card';
export function RecommendationView({complete=false}:{complete?:boolean}){
 const {state,ready,select}=useRequest();const [notice,setNotice]=useState('');
 const [clock,setClock]=useState(()=>new Date().toISOString());
 useEffect(()=>{const timer=setInterval(()=>setClock(new Date().toISOString()),30000);return ()=>clearInterval(timer);},[]);
 const calculated=useMemo(()=>{try{return {result:recommend(state.requirements,createDemoCatalog(state.catalogTime),clock),error:''};}catch{return {result:null,error:'Cannot calculate: check deadline dates, preferences and catalog prices.'};}},[state.requirements,state.catalogTime,clock]);
 if(!ready)return <p role="status">Loading your saved requirements…</p>;
 if(!calculated.result)return <p role="alert">{calculated.error} <Link href="/preferences">Review preferences</Link></p>;
 const {eligible,verification,rejected}=calculated.result;
 const selected=eligible.find(s=>s.id===state.selectedId);
 if(complete)return <><p>Demonstration only. This is not an order or booking. All times are New York time.</p>{selected?<SolutionCard solution={selected}/>:<p role="status">No currently valid solution selected. A changed budget, deadline or expired schedule may invalidate an earlier selection. <Link href="/comparison">Choose a complete solution</Link>.</p>}<Link href="/preferences">Edit requirements</Link></>;
 return <><p>All sellers, technical specifications, delivery schedules, technician intervals and tax are TEST DATA. Quotes use a fictional 9% tax on all line items for ZIP 10001. No real availability or coverage guarantee.</p><p><Link href="/preferences">Edit and confirm requirements</Link></p><p role="status">{notice||eligible.length+' complete compatible option(s); '+verification.length+' option(s) need verification.'}</p>
 <h2>Compatible complete solutions</h2>{eligible.length===0&&<p>No confirmed solution satisfies the known constraints. Review the verification items and rejected alternatives below.</p>}
 <div className="offer-grid">{eligible.map(s=><SolutionCard key={s.id} solution={s} choose={()=>{select(s.id);setNotice('Solution selected. Open Complete Solution to review it.');}}/>)}</div>{state.selectedId&&<Link className="button" href="/solution">Review selected solution</Link>}
 <h2>Needs verification — not confirmed recommendations</h2><div className="offer-grid">{verification.map(s=><SolutionCard key={s.id} solution={s}/>)}</div>
 <h2>Rejected alternatives</h2>{rejected.length?<ul>{rejected.map((r,i)=><li key={i}><strong>{r.label}:</strong> {r.reasons.join(' ')}</li>)}</ul>:<p>None.</p>}</>;
}
