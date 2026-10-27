export type Money = { amountCents: number; currency: 'USD' };
export type WanProtocol = 'dhcp' | 'pppoe' | 'static';
export interface Product {
 id: string; name: string; category: 'wifi-router'; hardwareVersion: string | null;
 specs: { wanInterface: 'ethernet'; wanSpeedMbps: number; lanPorts: number; bandsGhz: (2.4 | 5 | 6)[]; wanProtocols: WanProtocol[] };
 isDemo: boolean;
}
export interface Seller { id: string; name: string; country: string; isDemo: boolean }
export interface DeliveryOption { id: string; label: string; price: Money; estimatedDays: number; serviceZipCodes: string[]; isDemo: boolean }
export interface Offer { id: string; productId: string; sellerId: string; price: Money; availability: 'in-stock' | 'out-of-stock'; deliveryOptions: DeliveryOption[]; warranty: string | null; support: string | null; isDemo: boolean }
export interface Technician { id: string; name: string; specialties: string[]; serviceZipCodes: string[]; installationPrice: Money; slots: { id: string; startsAt: string; endsAt: string; timeZone: string }[]; isDemo: boolean }
export interface UserRequest {
 description: string; mode: 'budget' | 'technical'; maxBudget: Money; country: string; zipCode: string; installationRequired: boolean;
 deliveryDeadline: { date: string; timeZone: string; required: boolean } | null;
 equipment: { wanProtocol: WanProtocol | null; upstreamDevice: 'modem' | 'ont' | 'gateway' | 'unknown'; ethernetOutputConfirmed: boolean | null };
}

