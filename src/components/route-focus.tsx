'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
// Announce a new step at its heading, without stealing focus on first load or field links.
export function RouteFocus(){
 const path=usePathname();const previous=useRef(path);
 useEffect(()=>{
 if(previous.current===path)return;previous.current=path;
 if(window.location.hash)return;
 const frame=requestAnimationFrame(()=>{const heading=document.querySelector<HTMLElement>('main h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}});
 return()=>cancelAnimationFrame(frame);
 },[path]);
 return null;
}
