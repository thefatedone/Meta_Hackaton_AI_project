import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDemoCatalog} from '../src/catalogs/demo';
import {demoOrderCutoff,isDemoExpired} from '../src/recommendations/time';
import {newState,refreshSchedule} from '../src/state/requirements-store';
import {initialRequirements, type Requirements} from '../src/domain/requirements';
import {recommend} from '../src/recommendations/engine';
const requirements:Requirements={...initialRequirements,budgetCents:20000,protocol:'dhcp',upstream:'ont',ethernet:'yes',vlan:'not-required',ispRestrictions:'none',speedMbps:1000,lanPorts:2,band:'5',cable:'need',confirmed:true};
test('refresh before, at and after 23:00 and across midnight creates future usable schedules',()=>{
 const anchors=['2026-10-28T02:59:59.999Z','2026-10-28T03:00:00.000Z','2026-10-28T03:30:00.000Z','2026-10-28T03:59:59.999Z','2026-10-28T04:00:00.000Z'];
 for(const now of anchors){
 const refreshed=refreshSchedule(newState('2026-10-27T16:00:00.000Z'),now);const catalog=createDemoCatalog(refreshed.catalogTime);
 assert.equal(isDemoExpired(refreshed.catalogTime,now),false);
 for(const offer of catalog.offers)for(const delivery of offer.deliveryOptions){assert.ok(Date.parse(delivery.orderBy!)>Date.parse(now));assert.ok(Date.parse(delivery.arrivesAt!)>Date.parse(delivery.orderBy!));}
 for(const tech of catalog.technicians)for(const slot of tech.slots)assert.ok(Date.parse(slot.startsAt)>Date.parse(now));
 const result=recommend(requirements,catalog,now);assert.ok(result.eligible.length>0);assert.ok(result.eligible.every(s=>Date.parse(s.slot!.startsAt)>=Date.parse(s.deliveryAt)));
 }
});
test('23:00 rolls processing day; 23:59 and next midnight have identical delivery/cutoff dates',()=>{
 const atCutoff=createDemoCatalog('2026-10-28T03:00:00.000Z');const late=createDemoCatalog('2026-10-28T03:59:59.999Z');const midnight=createDemoCatalog('2026-10-28T04:00:00.000Z');
 assert.equal(atCutoff.offers[1].deliveryOptions[0].arrivesAt,'2026-10-29T16:00:00.000Z');
 assert.deepEqual(late.offers,midnight.offers);assert.deepEqual(late.technicians,midnight.technicians);
 assert.equal(isDemoExpired('2026-10-27T16:00:00.000Z','2026-10-28T03:00:00.000Z'),true);
 assert.equal(recommend(requirements,createDemoCatalog('2026-10-27T16:00:00.000Z'),'2026-10-28T03:00:00.000Z').eligible.length,0);
});
test('late refresh respects New York DST and year boundaries, preserving user deadlines',()=>{
 const fall='2026-11-01T03:30:00.000Z';assert.equal(demoOrderCutoff(fall),'2026-11-02T04:00:00.000Z');
 assert.equal(createDemoCatalog(fall).offers[1].deliveryOptions[0].arrivesAt,'2026-11-02T17:00:00.000Z');
 const year='2027-01-01T04:30:00.000Z';assert.equal(demoOrderCutoff(year),'2027-01-02T04:00:00.000Z');
 const original={...newState('2026-10-27T16:00:00.000Z'),requirements:{...requirements,deliveryDate:'2026-10-28',deliveryMandatory:true},selectedId:'old'};
 const refreshed=refreshSchedule(original,'2026-10-28T03:30:00.000Z');assert.equal(refreshed.requirements.deliveryDate,'2026-10-28');assert.equal(refreshed.selectedId,null);
 assert.equal(recommend(refreshed.requirements,createDemoCatalog(refreshed.catalogTime),refreshed.catalogTime).eligible.length,0);
});
