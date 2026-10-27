export type Money = { amountCents: number; currency: 'USD' };
export type WanProtocol = 'dhcp' | 'pppoe' | 'static';
export interface Product {
 id: string; name: string; category: 'wifi-router'; hardwareVersion: string | null;
 specs: { vlan: boolean | null; wanInterface: 'ethernet'; wanSpeedMbps: number; lanPorts: number; bandsGhz: (2.4 | 5 | 6)[]; wanProtocols: WanProtocol[] };
 isDemo: boolean;
}
export interface Seller { id: string; name: string; country: string; isDemo: boolean }
export interface DeliveryOption { id: string; label: string; price: Money; estimatedDays: number; arrivesAt?: string; orderBy?: string; serviceZipCodes: string[]; isDemo: boolean }
export interface Offer { id: string; productId: string; sellerId: string; price: Money; availability: 'in-stock' | 'out-of-stock'; deliveryOptions: DeliveryOption[]; warranty: string | null; support: string | null; isDemo: boolean }
export interface Technician { id: string; name: string; specialties: string[]; serviceZipCodes: string[]; installationPrice: Money; slots: { id: string; startsAt: string; endsAt: string; timeZone: string }[]; isDemo: boolean }
// Unified, validated requirements shared by Preferences and the deterministic engine.
export type { Requirements as UserRequest } from './requirements';


export interface Accessory { id: string; name: string; price: Money | null; isDemo: boolean }
export interface TaxPolicy { zip: string; rateBasisPoints: number | null; label: string; isDemo: boolean }
