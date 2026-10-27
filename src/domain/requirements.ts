import { z } from 'zod';
export const requirementsSchema = z.object({
 budgetCents: z.number().int().min(0).max(100000000).nullable(), currency: z.enum(['USD','unsupported']),
 mode: z.enum(['budget','technical']), zip: z.string().regex(/^\d{5}$/), installation: z.boolean(),
 deliveryDate: z.iso.date().nullable(), deliveryMandatory: z.boolean(),
 installationDate: z.iso.date().nullable(), installationMandatory: z.boolean(),
 ispRestrictions: z.enum(['unknown','none','special']),
 protocol: z.enum(['unknown','dhcp','pppoe','static']), upstream: z.enum(['unknown','modem','ont','gateway','direct-dsl-coax']),
 ethernet: z.enum(['unknown','yes','no']), vlan: z.enum(['unknown','not-required','required']),
 speedMbps: z.number().int().min(1).max(10000).nullable(), lanPorts: z.number().int().min(0).max(32).nullable(),
 band: z.enum(['unknown','2.4','5','6']), cable: z.enum(['unknown','have','need']), confirmed: z.boolean(),
}).strict();
export type Requirements = z.infer<typeof requirementsSchema>;
export const initialRequirements: Requirements = { budgetCents: 15000, currency: 'USD', mode: 'budget', zip: '10001', installation: true, deliveryDate: null, deliveryMandatory: false, installationDate: null, installationMandatory: false, ispRestrictions: 'unknown', protocol: 'unknown', upstream: 'unknown', ethernet: 'unknown', vlan: 'unknown', speedMbps: null, lanPorts: null, band: 'unknown', cable: 'unknown', confirmed: false };
