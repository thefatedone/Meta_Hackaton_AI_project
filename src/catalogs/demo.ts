import type { Catalog } from '../recommendations/engine';
import { localInstant, DEMO_ZONE } from '../recommendations/time';
import type { Product, Seller, Offer, Technician } from '@/domain/models';
// All names, specifications, prices and availability below are fictional fixtures.
export const sellers: Seller[] = [
 { id: 'north', name: 'Demo North Electronics', country: 'US', isDemo: true },
 { id: 'metro', name: 'Demo Metro Tech', country: 'US', isDemo: true },
 { id: 'harbor', name: 'Demo Harbor Digital', country: 'US', isDemo: true },
];
export const products: Product[] = [
 { id: 'home', name: 'Demo Home AX1800', category: 'wifi-router', hardwareVersion: 'Demo v1', specs: { vlan: false, wanInterface: 'ethernet', wanSpeedMbps: 1000, lanPorts: 4, bandsGhz: [2.4, 5], wanProtocols: ['dhcp', 'pppoe', 'static'] }, isDemo: true },
 { id: 'plus', name: 'Demo Home AX3000', category: 'wifi-router', hardwareVersion: 'Demo v1', specs: { vlan: true, wanInterface: 'ethernet', wanSpeedMbps: 2500, lanPorts: 4, bandsGhz: [2.4, 5], wanProtocols: ['dhcp', 'pppoe', 'static'] }, isDemo: true },
];
export const offers: Offer[] = [
 { id: 'north-home', productId: 'home', sellerId: 'north', price: { amountCents: 6900, currency: 'USD' }, availability: 'in-stock', deliveryOptions: [{ id: 'north-standard', label: 'Standard demo delivery', price: { amountCents: 500, currency: 'USD' }, estimatedDays: 2, serviceZipCodes: ['10001'], isDemo: true }], warranty: 'Demo: 12 months', support: 'Demo: email support', isDemo: true },
 { id: 'metro-home', productId: 'home', sellerId: 'metro', price: { amountCents: 7400, currency: 'USD' }, availability: 'in-stock', deliveryOptions: [{ id: 'metro-express', label: 'Express demo delivery', price: { amountCents: 1000, currency: 'USD' }, estimatedDays: 1, serviceZipCodes: ['10001'], isDemo: true }], warranty: 'Demo: 12 months', support: null, isDemo: true },
 { id: 'harbor-plus', productId: 'plus', sellerId: 'harbor', price: { amountCents: 9900, currency: 'USD' }, availability: 'in-stock', deliveryOptions: [{ id: 'harbor-express', label: 'Express demo delivery', price: { amountCents: 800, currency: 'USD' }, estimatedDays: 1, serviceZipCodes: ['10001'], isDemo: true }], warranty: null, support: 'Demo: phone support', isDemo: true },
];
export const technicians: Technician[] = [
 { id: 'alex', name: 'Demo technician Alex', specialties: ['Home router installation'], serviceZipCodes: ['10001'], installationPrice: { amountCents: 3500, currency: 'USD' }, slots: [], isDemo: true },
 { id: 'sam', name: 'Demo technician Sam', specialties: ['Home router installation', 'Wi-Fi setup'], serviceZipCodes: ['10001'], installationPrice: { amountCents: 4500, currency: 'USD' }, slots: [], isDemo: true },
];


// Dates are generated relative to one session anchor, using New York calendar days.
export function createDemoCatalog(now: string): Catalog {
 return structuredClone({ generatedAt: now, products, sellers,
 offers: offers.map(offer=>({...offer, deliveryOptions:offer.deliveryOptions.map(d=>({...d, arrivesAt:localInstant(now,d.estimatedDays,12), orderBy:localInstant(now,0,23)}))})),
 technicians:technicians.map((t,index)=>({...t,slots:[1,2,3].map(day=>({id:t.id+'-day-'+day,startsAt:localInstant(now,day,index===0?14:16),endsAt:localInstant(now,day,index===0?15:17),timeZone:DEMO_ZONE}))})),
 accessories:[{id:'ethernet-cable',name:'Demo Ethernet cable',price:{amountCents:500,currency:'USD'},isDemo:true}],
 tax:{zip:'10001',rateBasisPoints:900,label:'TEST tax: 9% of all line items (fictional)',isDemo:true}
 });
}
