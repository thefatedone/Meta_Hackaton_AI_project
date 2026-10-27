import { DateTime } from 'luxon';
export const DEMO_ZONE = 'America/New_York';
export function localDate(now: string, days = 0) { return DateTime.fromISO(now, { zone: DEMO_ZONE }).plus({ days }).toISODate()!; }
export function localInstant(now: string, days: number, hour: number) {
 const date = DateTime.fromISO(now, { zone: DEMO_ZONE }).plus({ days }).startOf('day').set({ hour });
 if (!date.isValid) throw new Error('Invalid demo date');
 return date.toUTC().toISO()!;
}
export function deadline(date: string | null) {
 if (!date) return null;
 const parsed = DateTime.fromISO(date, { zone: DEMO_ZONE });
 if (!parsed.isValid || parsed.toISODate() !== date) throw new Error('Invalid deadline date');
 return parsed.endOf('day').toMillis();
}
export function displayTime(iso: string) { return DateTime.fromISO(iso, { zone: DEMO_ZONE }).toFormat('MMM dd, yyyy HH:mm ZZZZ'); }

// After the daily cutoff, the next processing day anchors ALL generated slots.
export function demoScheduleAnchor(now:string){
 const local=DateTime.fromISO(now,{zone:DEMO_ZONE});
 if(!local.isValid)throw new Error('Invalid demo date');
 return local.startOf('day').plus({days:local.hour>=23?1:0}).toUTC().toISO()!;
}
export function demoOrderCutoff(anchor:string){
 return localInstant(demoScheduleAnchor(anchor),0,23);
}
export function isDemoExpired(anchor:string,now:string){
 return Date.parse(now)>=Date.parse(demoOrderCutoff(anchor));
}
