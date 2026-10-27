'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { newState, restoreState, editRequirements, applyExtraction, type RequestState } from './requirements-store';
import type { Requirements } from '../domain/requirements';
import type { ExtractedRequirements } from '../domain/extraction';
const KEY='matchcart-request-v1';
interface Store { state:RequestState; ready:boolean; storageError:string; edit:(patch:Partial<Requirements>)=>void; receive:(value:ExtractedRequirements)=>void; select:(id:string)=>void; describe:(text:string)=>void; reset:()=>void }
const Context=createContext<Store|null>(null);
export function RequestProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState(()=>newState('2026-01-01T00:00:00.000Z'));
 const [ready,setReady]=useState(false);const [storageError,setStorageError]=useState('');
 useEffect(()=>{try{setState(restoreState(sessionStorage.getItem(KEY),new Date().toISOString()));}catch{setState(newState(new Date().toISOString()));setStorageError('Browser storage unavailable. Your choices will only last until refresh.');}setReady(true);},[]);
 useEffect(()=>{if(ready)try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{setStorageError('Preferences cannot be saved in this browser. Keep this tab open.');}},[state,ready]);
 return <Context.Provider value={{state,ready,storageError,edit:patch=>setState(s=>editRequirements(s,patch)),receive:r=>setState(s=>applyExtraction(s,r)),select:id=>setState(s=>({...s,selectedId:id})),describe:text=>setState(s=>({...s,description:text})),reset:()=>setState(newState(new Date().toISOString()))}}>{storageError&&<p role="status">{storageError}</p>}{children}</Context.Provider>;
}
export function useRequest(){const value=useContext(Context);if(!value)throw new Error('RequestProvider missing');return value;}
