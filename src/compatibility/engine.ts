import type { Product } from '../domain/models';
import type { Requirements } from '../domain/requirements';
export type CompatibilityStatus = 'COMPATIBLE' | 'INCOMPATIBLE' | 'NEEDS_VERIFICATION';
export interface Check { field: string; status: 'pass' | 'fail' | 'unknown'; reason: string }
export interface Compatibility { status: CompatibilityStatus; checks: Check[] }
export function checkCompatibility(product: Product, r: Requirements): Compatibility {
 const checks: Check[] = [];
 const add = (field: string, known: boolean, ok: boolean, pass: string, fail: string) => checks.push({ field, status: !known || !r.confirmed ? 'unknown' : ok ? 'pass' : 'fail', reason: !r.confirmed ? 'Confirm the connection requirements in Preferences.' : !known ? 'Please confirm ' + field + '.' : ok ? pass : fail });
 add('upstream equipment', r.upstream !== 'unknown' && r.upstream !== 'gateway', ['modem','ont'].includes(r.upstream), 'Separate modem/ONT is retained.', r.upstream === 'gateway' ? 'Gateway bridge/AP configuration is outside the supported MVP topology.' : 'An Ethernet router cannot replace a DSL/cable modem directly.');
 add('other ISP requirements', r.ispRestrictions === 'none', r.ispRestrictions === 'none', 'No additional ISP restrictions declared.', 'Additional ISP restrictions require a provider-specific verification outside this MVP.');
 add('Ethernet handoff', r.ethernet !== 'unknown', r.ethernet === 'yes', 'Ethernet WAN matches the confirmed handoff.', 'No Ethernet handoff is available.');
 add('WAN protocol', r.protocol !== 'unknown', r.protocol !== 'unknown' && product.specs.wanProtocols.includes(r.protocol), 'WAN protocol is supported.', 'Required WAN protocol is unsupported.');
 add('ISP VLAN requirement', r.vlan !== 'unknown' && (r.vlan !== 'required' || product.specs.vlan !== null), r.vlan !== 'required' || product.specs.vlan === true, 'ISP VLAN requirement is satisfied.', 'Required VLAN tagging is unsupported.');
 add('minimum port speed', r.speedMbps !== null, product.specs.wanSpeedMbps >= (r.speedMbps ?? 0), 'WAN port meets the minimum speed. Actual Wi-Fi throughput is not guaranteed.', 'WAN port is below your minimum speed.');
 add('LAN ports', r.lanPorts !== null, product.specs.lanPorts >= (r.lanPorts ?? 0), 'Enough wired LAN ports.', 'Not enough LAN ports.');
 add('required Wi-Fi band', r.band !== 'unknown', product.specs.bandsGhz.includes(Number(r.band) as 2.4 | 5 | 6), 'Required Wi-Fi band is supported.', 'Required Wi-Fi band is unsupported.');
 return { status: checks.some(c => c.status === 'fail') ? 'INCOMPATIBLE' : checks.some(c => c.status === 'unknown') ? 'NEEDS_VERIFICATION' : 'COMPATIBLE', checks };
}
