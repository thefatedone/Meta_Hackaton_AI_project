'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRequest } from '../state/request-context';
import { isDemoExpired } from '../recommendations/time';
export function SessionNotice(){
 const {state,ready,refresh}=useRequest();const [clock,setClock]=useState(()=>new Date().toISOString());const [message,setMessage]=useState('');
 useEffect(()=>{const timer=setInterval(()=>setClock(new Date().toISOString()),30000);return ()=>clearInterval(timer);},[]);
 if(!ready)return null;
 const expired=isDemoExpired(state.catalogTime,clock);
 return <>{expired&&<section className="session-notice" aria-labelledby="expired-title"><p id="expired-title"><strong>Your test schedule has expired</strong></p><p>Refresh the fictional delivery and installation slots to compare again. Your budget and connection answers stay saved. Your chosen solution is cleared; your deadline dates will not move automatically.</p><button type="button" onClick={()=>{const now=new Date().toISOString();refresh(now);setClock(now);setMessage('Test schedules refreshed. Check your delivery and installation deadline dates.');}}>Refresh test schedules</button> <Link href="/preferences">Check deadline dates</Link></section>}{message&&<p role="status">{message}</p>}</>;
}
