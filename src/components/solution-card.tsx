'use client';
import { useId } from 'react';
import { clarificationHelp } from './clarification-help';
import { Icon } from './icon';
import { StatusBadge } from './status-badge';
import type { Solution } from '../recommendations/engine';
import { displayTime } from '../recommendations/time';
export const usd=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export function SolutionCard({solution:s,choose,titleLevel=3,selected=false}:{solution:Solution;choose?:()=>void;titleLevel?:2|3;selected?:boolean}){
 const title=useId();const Heading=titleLevel===2?'h2':'h3';
 return <article className={'panel solution-card'+(selected?' is-selected':'')} aria-labelledby={title}>
 <div className="solution-topline"><StatusBadge status={s.compatibility.status}/>{selected&&<span className="selection-chip"><Icon name="check"/> Your selected plan</span>}</div>
 <div className="product-heading"><span className="product-glyph"><Icon name="router"/></span><Heading id={title}>{s.product.name}</Heading></div>
 <p className="seller-line">{s.seller.name} · {s.technician?.name??'Self installation'}</p>
 <dl className="quote-total"><dt>{s.totalCents===null?'Known costs — incomplete total':'Total including test tax'}</dt><dd><strong className="total-amount">{usd(s.totalCents??s.lines.reduce((sum,line)=>sum+line.cents,0))}</strong></dd></dl>
 <div className="quote-schedule"><div className="schedule-row"><Icon name="truck"/><dl><dt>Delivery by</dt><dd>{displayTime(s.deliveryAt)}</dd></dl></div><div className="schedule-row"><Icon name="person"/><dl><dt>{s.technician?.name??'Installation'}</dt><dd>{s.slot?displayTime(s.slot.startsAt)+' – '+displayTime(s.slot.endsAt):'Self installation — not booked'}</dd></dl></div></div>
 {s.compatibility.status==='COMPATIBLE'&&<p className="compatibility-basis">Compatible with the answers you confirmed and the specifications in this demo catalog. This is not independent equipment certification.</p>}
 {s.uncertainties.length>0&&<div className="verification-callout"><strong>Cost or requirements need verification</strong><ul>{s.uncertainties.map(x=><li key={x}>{x}</li>)}</ul></div>}
 {s.compatibility.status==='NEEDS_VERIFICATION'&&<section className="verification-callout" aria-label="What to check next"><strong>We need a little more information</strong><ul>{[...new Set(s.compatibility.checks.filter(c=>c.status==='unknown').map(c=>clarificationHelp[c.field]??c.reason))].map(text=><li key={text}>{text}</li>)}</ul></section>}
 <details className="cost-breakdown" open={titleLevel===2}><summary>Cost breakdown · every required item</summary><dl>{s.lines.map(l=><div key={l.label}><dt>{l.label}</dt><dd>{usd(l.cents)}</dd></div>)}</dl></details>
 <details><summary>Compatibility checks and explanation</summary><ul className="explanation-list">{s.compatibility.checks.map(c=><li key={c.field}><strong>{c.field}: {c.status}</strong> — {c.reason}</li>)}{s.reasons.map(x=><li key={x}>{x}</li>)}</ul></details>
 <dl className="assurance-list"><div><dt>Warranty</dt><dd>{s.offer.warranty??'Not specified'}</dd></div><div><dt>Support</dt><dd>{s.offer.support??'Not specified'}</dd></div></dl>
 {choose&&<button type="button" className="button" aria-label={'Choose this plan from '+s.seller.name+' with '+(s.technician?.name??'self-installation')} onClick={choose}>Choose this plan<Icon name="arrow"/></button>}
 </article>;
}
