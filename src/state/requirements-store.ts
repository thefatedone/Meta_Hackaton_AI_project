import { z } from 'zod';
import { requirementsSchema, initialRequirements, type Requirements } from '../domain/requirements';
import { extractionSchema, type ExtractedRequirements } from '../domain/extraction';
import { localDate } from '../recommendations/time';
export const technicalKeys: (keyof Requirements)[] = ['protocol','upstream','ethernet','vlan','ispRestrictions','speedMbps','lanPorts','band'];
export const preferenceKeys: (keyof Requirements)[] = ['budgetCents','currency','mode','zip','installation','deliveryDate','deliveryMandatory','installationDate','installationMandatory','cable'];
export interface RequestState { version: 2; requirements: Requirements; edited: string[]; extraction: ExtractedRequirements | null; selectedId: string | null; catalogTime: string; description: string }
export function newState(now: string): RequestState { return {version:2,requirements:{...initialRequirements},edited:[],extraction:null,selectedId:null,catalogTime:now,description:''}; }
const baseStorage=z.object({version:z.union([z.literal(1),z.literal(2)]),requirements:requirementsSchema,edited:z.array(z.string()),extraction:extractionSchema.nullable(),selectedId:z.string().nullable(),catalogTime:z.iso.datetime(),description:z.string().max(6000)}).strict();
export function restoreState(raw: string | null, now: string): RequestState {
 try {
 const stored=baseStorage.parse(JSON.parse(raw??''));
 // Version 1 saved every form key as edited. Exact historical edits cannot be reconstructed.
 // Preserve non-default values and attested known technical facts, rather than perpetuate blanket locks.
 const edited=stored.version===1 ? stored.edited.filter(key=>{
 if(!(key in initialRequirements))return false;
 const k=key as keyof Requirements;
 return stored.requirements[k]!==initialRequirements[k] || (stored.requirements.confirmed && technicalKeys.includes(k) && stored.requirements[k]!==null && stored.requirements[k]!=='unknown');
 }) : stored.edited.filter(key=>key in initialRequirements);
 return {...stored,version:2,edited};
 } catch {return newState(now);}
}
export function editRequirements(state:RequestState, patch:Partial<Requirements>, explicitlyConfirmed:(keyof Requirements)[]=[]):RequestState {
 const changed=(Object.keys(patch) as (keyof Requirements)[]).filter(k=>patch[k]!==state.requirements[k]);
 const requirements={...state.requirements,...patch};
 // A technical edit requires fresh attestation, unless confirmation accompanies this save.
 if(changed.some(k=>technicalKeys.includes(k)) && patch.confirmed!==true) requirements.confirmed=false;
 const edited=[...new Set([...state.edited,...changed,...explicitlyConfirmed])];
 return {...state,requirements,edited,selectedId:changed.length ? null : state.selectedId};
}
export function applyExtraction(state:RequestState, extraction:ExtractedRequirements, now=state.catalogTime):RequestState {
 const patch:Partial<Requirements>={}; const r=extractionSchema.parse(extraction);
 if(r.budget.amountCents!==null) patch.budgetCents=r.budget.amountCents;
 if(r.budget.currency!==null) patch.currency=r.budget.currency==='USD'?'USD':'unsupported';
 if(r.mode!==null) patch.mode=r.mode;
 if(r.installationRequired!==null) patch.installation=r.installationRequired;
 const requested=r.delivery.requested?.trim().toLowerCase();
 if(requested==='tomorrow') patch.deliveryDate=localDate(now,1);
 else if(requested && z.iso.date().safeParse(requested).success) patch.deliveryDate=requested;
 if(r.delivery.mandatory!==null) patch.deliveryMandatory=r.delivery.mandatory;
 for(const key of Object.keys(patch) as (keyof Requirements)[]) if(state.edited.includes(key)) delete patch[key];
 // Technical observations never become confirmed connection requirements automatically.
 return {...state,requirements:{...state.requirements,...patch},extraction:r,selectedId:null};
}
export function refreshSchedule(state:RequestState, now:string):RequestState {
 // Do not silently move the user's deadline when regenerating the fictional catalog.
 return {...state,catalogTime:now,selectedId:null};
}

export function clearAnalysis(state:RequestState):RequestState {
 return {...state,extraction:null,selectedId:null,requirements:{...state.requirements,confirmed:false}};
}
