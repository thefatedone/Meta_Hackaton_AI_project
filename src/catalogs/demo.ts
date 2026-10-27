import type { Product, Seller, Offer, Technician } from '@/domain/models';
// All names, specifications, prices and availability below are fictional fixtures.
export const sellers: Seller[] = [
 { id: 'north', name: 'Demo North Electronics', country: 'US', isDemo: true },
 { id: 'metro', name: 'Demo Metro Tech', country: 'US', isDemo: true },
 { id: 'harbor', name: 'Demo Harbor Digital', country: 'US', isDemo: true },
];
export const products: Product[] = [
 { id: 'home', name: 'Demo Home AX1800', category: 'wifi-router', hardwareVersion: 'Demo v1', specs: { wanInterface: 'ethernet', wanSpeedMbps: 1000, lanPorts: 4, bandsGhz: [2.4, 5], wanProtocols: ['dhcp', 'pppoe', 'static'] }, isDemo: true },
 { id: 'plus', name: 'Demo Home AX3000', category: 'wifi-router', hardwareVersion: 'Demo v1', specs: { wanInterface: 'ethernet', wanSpeedMbps: 1000, lanPorts: 4, bandsGhz: [2.4, 5], wanProtocols: ['dhcp', 'pppoe', 'static'] }, isDemo: true },
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

