import { z } from 'zod';
export const extractionSchema = z.object({
 category: z.enum(['wifi-router', 'other', 'unknown']),
 budget: z.object({ amountCents: z.number().int().min(0).max(100000000).nullable(), currency: z.string().regex(/^[A-Z]{3}$/).nullable(), includes: z.array(z.enum(['device','delivery','accessories','installation','tax'])).max(5) }).strict(),
 mode: z.enum(['budget','technical']).nullable(),
 delivery: z.object({ requested: z.string().max(200).nullable(), mandatory: z.boolean().nullable() }).strict(),
 installationRequired: z.boolean().nullable(),
 deviceModel: z.string().max(200).nullable(),
 technicalParameters: z.array(z.object({ name: z.string().min(1).max(100), value: z.string().min(1).max(300), source: z.enum(['user_text','image']), verification: z.literal('unverified') }).strict()).max(30),
 imageAssessment: z.enum(['not_provided','readable','uncertain']),
 clarificationQuestions: z.array(z.string().min(1).max(500)).max(12),
 summary: z.string().min(1).max(1500)
}).strict();
export type ExtractedRequirements = z.infer<typeof extractionSchema>;
export const extractionJsonSchema = z.toJSONSchema(extractionSchema);
export function validateExtraction(value: unknown, hasImage: boolean): ExtractedRequirements {
 const result = extractionSchema.parse(value);
 if (!hasImage && (result.imageAssessment !== 'not_provided' || result.technicalParameters.some(p => p.source === 'image'))) throw new Error('Invalid image provenance');
 if (hasImage && result.imageAssessment === 'not_provided') throw new Error('Missing image assessment');
 if (hasImage && (result.imageAssessment === 'uncertain' || result.deviceModel === null) && result.clarificationQuestions.length === 0) throw new Error('Uncertain image requires clarification');
 return result;
}
