import { z } from 'zod';
import { requirementsSchema, initialRequirements, type Requirements } from '../domain/requirements';
import { extractionSchema, type ExtractedRequirements } from '../domain/extraction';
import { localDate } from '../recommendations/time';
export interface RequestState { version: 1; requirements: Requirements; edited: string[]; extraction: ExtractedRequirements | null; selectedId: string | null; catalogTime: string; description: string }
export function newState(now: string): RequestState { return {version:1,requirements:{...initialRequirements},edited:[],extraction:null,selectedId:null,catalogTime:now,description:''}; }
const storageSchema=z.object({version:z.literal(1),requirements:requirementsSchema,edited:z.array(z.string()),extraction:extractionSchema.nullable(),selectedId:z.string().nullable(),catalogTime:z.iso.datetime(),description:z.string().max(6000)}).strict();
export function restoreState(raw: string | null, now: string): RequestState { try {return storageSchema.parse(JSON.parse(raw??''));} catch {return newState(now);} }
export function editRequirements(state:RequestState, patch:Partial<Requirements>):RequestState {
 return {...state,requirements:{...state.requirements,...patch},edited:[...new Set([...state.edited,...Object.keys(patch)])],selectedId:null};
}
export function applyExtraction(state:RequestState, extraction:ExtractedRequirements):RequestState {
 const patch:Partial<Requirements>={}; const r=extraction;
 if(r.budget.amountCents!==null) patch.budgetCents=r.budget.amountCents;
 if(r.budget.currency!==null) patch.currency=r.budget.currency==='USD'?'USD':'unsupported';
 if(r.mode!==null) patch.mode=r.mode;
 if(r.installationRequired!==null) patch.installation=r.installationRequired;
 if(r.delivery.requested?.trim().toLowerCase()==='tomorrow') patch.deliveryDate=localDate(state.catalogTime,1);
 if(r.delivery.mandatory!==null) patch.deliveryMandatory=r.delivery.mandatory;
 for(const key of Object.keys(patch) as (keyof Requirements)[]) if(state.edited.includes(key)) delete patch[key];
 return {...state,requirements:{...state.requirements,...patch},extraction:r,selectedId:null};
}
