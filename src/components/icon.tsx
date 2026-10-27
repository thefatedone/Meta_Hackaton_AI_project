import type { CSSProperties } from 'react';
const paths={
 arrow:'M5 12h14m-5-5 5 5-5 5',
 check:'m5 12 4 4L19 6',
 help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01',
 close:'m6 6 12 12M18 6 6 18',
 router:'M4 14h16v6H4zM7 14V7m10 7V7M8 17h.01M12 17h.01M8 4a6 6 0 0 1 8 0',
 upload:'M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5',
 truck:'M3 6h11v11H3zM14 10h4l3 4v3h-7M6 17v3m12-3v3',
 shield:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6zM8 12l3 3 5-6',
 cart:'M3 4h2l3 12h11l2-8H6M9 20h.01M18 20h.01',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
 person:'M8 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-3a8 8 0 0 1 16 0v3',
};
export function Icon({name,className='',style}:{name:keyof typeof paths;className?:string;style?:CSSProperties}){return <svg className={'icon '+className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;}
