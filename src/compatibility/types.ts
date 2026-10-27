import type { Product, UserRequest } from '@/domain/models';
export interface RuleResult { ruleId: string; status: 'pass' | 'fail' | 'unknown'; reason: string; missingFields: string[] }
export interface CompatibilityRule { id: string; evaluate(product: Product, request: UserRequest): RuleResult }
// The executable rule checks and aggregate status live in engine.ts.

