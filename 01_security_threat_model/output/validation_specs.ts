/**
 * validation_specs.ts
 * Stage 01 Output: Formal validation schemas and security sanitization functions for Curate Local-First CRM.
 */

import { z } from 'zod';

// Formula trigger characters recognized by spreadsheet processors (CWE-1236)
export const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r', '%'] as const;

/**
 * Strips dangerous null bytes and non-printable control characters.
 */
export function cleanString(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Sanitizes values to prevent Excel Formula Injection (CWE-1236).
 * Any cell value beginning with formula operators is safely prefixed with an apostrophe (').
 */
export function sanitizeForExcel(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = cleanString(val);
  if (str.length > 0 && FORMULA_TRIGGERS.some(trigger => str.startsWith(trigger))) {
    return "'" + str;
  }
  return str;
}

/**
 * Curate Lead / Contact validation schema (Local-First & Multi-Tenant)
 */
export const CurateLeadSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  workspaceId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required').max(100).transform(cleanString),
  lastName: z.string().min(1, 'Last name is required').max(100).transform(cleanString),
  dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date of birth',
  }),
  residentialAddress: z.string().min(5, 'Address is too short').max(255).transform(cleanString),
  postalCode: z.string().min(3, 'Postal code is required').max(20).transform(cleanString),
  mobileNumber: z.string().min(5, 'Mobile number is required').max(20).transform(cleanString),
  emailAddress: z.string().email('Invalid email address').max(255).transform(cleanString),
  companyName: z.string().max(100).optional().nullable().transform(val => val ? cleanString(val) : null),
  partnerName: z.string().max(100).optional().nullable().transform(val => val ? cleanString(val) : null),
  partnerDob: z.string().optional().nullable(),
  partnerPhone: z.string().max(20).optional().nullable().transform(val => val ? cleanString(val) : null),
  partnerEmail: z.union([z.literal(''), z.string().email('Invalid email address')]).optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  isDeleted: z.boolean().optional(),
  syncStatus: z.enum(['synced', 'pending']).optional(),
});

export type CurateLead = z.infer<typeof CurateLeadSchema>;
