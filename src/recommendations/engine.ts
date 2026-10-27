import type { Product, Seller, Offer, Technician, Accessory, TaxPolicy } from '../domain/models';
import { requirementsSchema, type Requirements } from '../domain/requirements';
import { checkCompatibility, type Compatibility } from '../compatibility/engine';
import { deadline } from './time';
export interface Catalog { products: Product[]; sellers: Seller[]; offers: Offer[]; technicians: Technician[]; accessories: Accessory[]; tax: TaxPolicy; generatedAt: string }
export interface QuoteLine { label: string; cents: number }
export interface Solution {
 id: string; product: Product; seller: Seller; offer: Offer; deliveryAt: string; technician: Technician | null;
 slot: Technician['slots'][number] | null; compatibility: Compatibility; lines: QuoteLine[]; subtotalCents: number;
 totalCents: number | null; uncertainties: string[]; reasons: string[]; score: number;
}
export interface EngineResult { eligible: Solution[]; verification: Solution[]; rejected: { label: string; reasons: string[] }[] }
function price(value: number) { if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid catalog price'); return value; }
export function recommend(input: Requirements, catalog: Catalog, now: string): EngineResult {
 const r = requirementsSchema.parse(input); const deliveryLimit = deadline(r.deliveryDate); const installLimit = deadline(r.installationDate);
 const current = Date.parse(now); if (!Number.isFinite(current)) throw new Error('Invalid current time');
 const out: EngineResult = { eligible: [], verification: [], rejected: [] };
 const reject = (label: string, reasons: string[]) => out.rejected.push({ label, reasons });
 const ids = (list: {id:string}[]) => { if (new Set(list.map(x=>x.id)).size !== list.length) throw new Error('Duplicate catalog IDs'); };
 [catalog.products,catalog.sellers,catalog.offers,catalog.technicians,catalog.accessories].forEach(ids);
 for (const offer of catalog.offers) {
 const product = catalog.products.find(p=>p.id===offer.productId); const seller = catalog.sellers.find(s=>s.id===offer.sellerId);
 if (!product || !seller) { reject(offer.id,['Unknown product or seller.']); continue; }
 price(offer.price.amountCents);
 const compatibility = checkCompatibility(product,r); const label = product.name + ' / ' + seller.name;
 if (compatibility.status === 'INCOMPATIBLE') { reject(label,compatibility.checks.filter(c=>c.status==='fail').map(c=>c.reason)); continue; }
 if (offer.availability !== 'in-stock') { reject(label,['Not in stock.']); continue; }
 for(const delivery of offer.deliveryOptions) {
 price(delivery.price.amountCents);
 const arrival = Date.parse(delivery.arrivesAt ?? '');
 if(!delivery.serviceZipCodes.includes(r.zip)) {reject(label,['Delivery unavailable for this ZIP.']);continue;}
 if(!Number.isFinite(arrival) || arrival <= current || Date.parse(delivery.orderBy ?? '') <= current || !Number.isFinite(Date.parse(delivery.orderBy ?? ''))) {reject(label,['Delivery schedule is missing, expired or past its order cutoff.']);continue;}
 if(r.deliveryMandatory && deliveryLimit !== null && arrival > deliveryLimit) {reject(label,['Mandatory delivery deadline cannot be met.']);continue;}
 const choices: {technician: Technician | null; slot: Technician['slots'][number] | null}[] = [];
 if(!r.installation) choices.push({technician:null,slot:null});
 else for(const tech of catalog.technicians) {
 price(tech.installationPrice.amountCents);
 if(!tech.serviceZipCodes.includes(r.zip) || !tech.specialties.includes('Home router installation')) continue;
 for(const slot of tech.slots) {
 const start=Date.parse(slot.startsAt), end=Date.parse(slot.endsAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start < arrival||start <= current||end<=start) continue;
 if(r.installationMandatory && installLimit !== null && end>installLimit) continue;
 choices.push({technician:tech,slot});
 }
 }
 if(!choices.length) {reject(label,['No qualified technician has an interval after delivery and within the mandatory installation deadline.']);continue;}
 for(const {technician,slot} of choices) {
 const uncertainties: string[] = [];
 if(r.budgetCents===null) uncertainties.push('Confirm the maximum budget.');
 if(r.currency!=='USD') uncertainties.push('Only USD quotes are supported. Confirm a USD budget.');
 if(r.deliveryMandatory && deliveryLimit===null) uncertainties.push('Confirm a delivery deadline date.');
 if(r.installation && r.installationMandatory && installLimit===null) uncertainties.push('Confirm an installation deadline date.');
 const lines: QuoteLine[] = [{label:'Router',cents:offer.price.amountCents},{label:'Delivery',cents:delivery.price.amountCents}];
 if(r.cable==='unknown') uncertainties.push('Confirm whether an Ethernet cable is needed.');
 if(r.cable==='need') {
 const cable=catalog.accessories.find(a=>a.id==='ethernet-cable');
 if(!cable || cable.price===null) uncertainties.push('Required Ethernet cable cost is unknown.');
 else {price(cable.price.amountCents);lines.push({label:cable.name,cents:cable.price.amountCents});}
 }
 if(technician) lines.push({label:'Installation — '+technician.name,cents:technician.installationPrice.amountCents});
 const subtotalCents=price(lines.reduce((sum,l)=>sum+l.cents,0));
 if(catalog.tax.rateBasisPoints===null || catalog.tax.zip!==r.zip) uncertainties.push('Applicable tax is unknown for this ZIP.');
 else {
 const rate=price(catalog.tax.rateBasisPoints);
 lines.push({label:catalog.tax.label,cents:Math.round(subtotalCents*rate/10000)});
 }
 const knownCost=price(lines.reduce((sum,l)=>sum+l.cents,0));
 const totalCents=uncertainties.length ? null : knownCost;
 if(knownCost > (r.budgetCents ?? Infinity)) {reject(label,['Required costs exceed the maximum budget.']);continue;}
 const reasons=['All listed costs use integer USD cents.','Demo specifications only; no real-world compatibility certification.'];
 if(deliveryLimit!==null && arrival>deliveryLimit) reasons.push('Preferred delivery date is missed (not mandatory).');
 if(slot && installLimit!==null && Date.parse(slot.endsAt)>installLimit) reasons.push('Preferred installation date is missed (not mandatory).');
 // Technical score measures headroom for the confirmed minimum, not purchase price or marketing AX labels.
 const score=r.confirmed && r.speedMbps!==null ? Math.min(product.specs.wanSpeedMbps/r.speedMbps,2) : 0;
 reasons.push(r.mode==='budget'?'Budget Mode: lowest complete cost first.':'Technical Mode: WAN speed headroom up to 2× the confirmed minimum, then lower cost. No Wi-Fi speed/coverage guarantee.');
 const solution: Solution={id:[offer.id,delivery.id,technician?.id??'self',slot?.id??'none'].join(':'),product,seller,offer,deliveryAt:delivery.arrivesAt!,technician,slot,compatibility,lines,subtotalCents,totalCents,uncertainties,reasons,score};
 (compatibility.status==='COMPATIBLE'&&totalCents!==null?out.eligible:out.verification).push(solution);
 }
 }
 }
 const sort=(a:Solution,b:Solution)=>(r.mode==='technical'?b.score-a.score:0)||(a.totalCents??Infinity)-(b.totalCents??Infinity)||a.id.localeCompare(b.id);
 out.eligible.sort(sort);out.verification.sort(sort);return out;
}
