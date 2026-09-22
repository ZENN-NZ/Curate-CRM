import { z } from "zod";

export const LeadSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  workspaceId: z.string().optional(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date of birth",
  }),
  residentialAddress: z.string().min(5, "Address is too short").max(255),
  postalCode: z.string().min(3, "Postal code is required").max(20),
  mobileNumber: z.string().min(5, "Mobile number is required").max(20),
  emailAddress: z.string().email("Invalid email address").max(255),
  companyName: z.string().max(100).optional().nullable(),
  partnerName: z.string().max(100).optional().nullable(),
  partnerDob: z.string().optional().nullable(),
  partnerPhone: z.string().max(20).optional().nullable(),
  partnerEmail: z.union([z.literal(''), z.string().email("Invalid email address")]).optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  isDeleted: z.boolean().optional(),
  syncStatus: z.enum(['synced', 'pending']).optional(),
});

export type Lead = z.infer<typeof LeadSchema>;

export interface Workspace {
  id: string;
  name: string;
  passkey: string;
  createdAt: string;
  lastSyncedAt?: string;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  issues?: z.ZodIssue[];
};
