'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequest } from '../state/request-context';
const steps=[{href:'/',name:'Describe your problem'},{href:'/preferences',name:'Confirm your needs'},{href:'/comparison',name:'Compare solutions'},{href:'/solution',name:'Review your choice'}];
export function JourneyNav(){
 const path=usePathname();const {state,ready}=useRequest();
 return <nav className="journey" aria-label="Shopping steps"><ol>{steps.map((s,i)=><li key={s.href}><Link href={s.href} aria-current={path===s.href?'step':undefined}><span>Step {i+1}: </span>{s.name}{ready&&i===0&&state.extraction?<span className="step-note"> Analysis saved</span>:null}{ready&&i===3&&state.selectedId?<span className="step-note"> Choice saved</span>:null}</Link></li>)}</ol></nav>;
}
