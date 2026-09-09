import { z } from 'zod';
import {
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  ISSUE_DEPARTMENTS,
  ISSUE_STATUSES,
} from '../types/issue.js';
import {
  ALL_LOCATION_TYPES,
  ACADEMIC_BUILDINGS,
  HOSTEL_BLOCKS,
  isForbiddenLocationBlock,
} from '../config/locations.js';

export const imagePayloadSchema = z.object({
  base64Data: z.string().min(1, 'Image data is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  storagePath: z.string().optional(),
});

export type ImagePayload = z.infer<typeof imagePayloadSchema>;

function validateIssueLocation(
  data: {
    locationType: string;
    buildingOrBlock?: string;
    academicBlock?: string;
    hostelBlock?: string;
    specificArea?: string;
    floor?: string;
  },
  ctx: z.RefinementCtx
) {
  const block = data.buildingOrBlock || data.academicBlock || data.hostelBlock;

  // 1. Explicitly check for forbidden blocks (AB3, AB4, AB5, Academic Block 3/4/5, Hostel Block 7/8/9, Block 7/8/9 undivided, etc.)
  if (block && isForbiddenLocationBlock(block)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid campus building or block "${block}". Only approved VIT Bhopal campus locations are accepted.`,
      path: ['buildingOrBlock'],
    });
    return;
  }

  // 2. Strict check for Academic Area:
  if (data.locationType === 'Academic Area') {
    if (block && !ACADEMIC_BUILDINGS.includes(block as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid Academic Area building "${block}". Approved options: ${ACADEMIC_BUILDINGS.join(', ')}.`,
        path: ['buildingOrBlock'],
      });
    }
  }

  // 3. Strict check for Hostel:
  if (data.locationType === 'Hostel') {
    if (block && !HOSTEL_BLOCKS.includes(block as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid Hostel block "${block}". Approved options: ${HOSTEL_BLOCKS.join(', ')}.`,
        path: ['buildingOrBlock'],
      });
    }
  }
}

export const analyzeIssueSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description cannot exceed 2000 characters'),
    locationType: z.enum(ALL_LOCATION_TYPES),
    buildingOrBlock: z.string().optional(),
    specificArea: z.string().optional(),
    floor: z.string().optional(),
    academicBlock: z.string().optional(),
    hostelBlock: z.string().optional(),
    specificLocation: z
      .string()
      .trim()
      .min(2, 'Specific location must be at least 2 characters')
      .max(150, 'Specific location cannot exceed 150 characters'),
    image: imagePayloadSchema.optional(),
  })
  .superRefine(validateIssueLocation);

export type AnalyzeIssueInput = z.infer<typeof analyzeIssueSchema>;

/**
 * Strict schema for Gemini 3.8 Flash structured response
 */
export const aiAnalysisOutputSchema = z.object({
  category: z.enum(ISSUE_CATEGORIES),
  suggestedSeverity: z.enum(ISSUE_SEVERITIES),
  suggestedDepartment: z.enum(ISSUE_DEPARTMENTS),
  improvedDescription: z.string().min(5).max(3000),
  visualObservations: z.array(z.string().max(250)).default([]),
  missingInformation: z.array(z.string().max(250)).default([]),
});

export type AiAnalysisOutput = z.infer<typeof aiAnalysisOutputSchema>;

export const createIssueSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description cannot exceed 2000 characters'),
    improvedDescription: z.string().max(3000).optional(),
    category: z.enum(ISSUE_CATEGORIES),
    aiSuggestedSeverity: z.enum(ISSUE_SEVERITIES),
    severity: z.enum(ISSUE_SEVERITIES),
    aiSuggestedDepartment: z.enum(ISSUE_DEPARTMENTS),
    department: z.enum(ISSUE_DEPARTMENTS),
    locationType: z.enum(ALL_LOCATION_TYPES),
    buildingOrBlock: z.string().optional(),
    specificArea: z.string().optional(),
    floor: z.string().optional(),
    academicBlock: z.string().optional(),
    hostelBlock: z.string().optional(),
    specificLocation: z
      .string()
      .trim()
      .min(2, 'Specific location is required')
      .max(150, 'Specific location cannot exceed 150 characters'),
    hasImage: z.boolean().default(false),
    imageStoragePath: z.string().optional(),
    imageContentType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
    visualObservations: z.array(z.string().max(250)).default([]),
  })
  .superRefine(validateIssueLocation);

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  note: z.string().trim().min(1, 'Status note is required').max(500),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>;

export const overrideIssueDetailsSchema = z.object({
  category: z.enum(ISSUE_CATEGORIES).optional(),
  severity: z.enum(ISSUE_SEVERITIES).optional(),
  department: z.enum(ISSUE_DEPARTMENTS).optional(),
  note: z.string().trim().max(500).optional(),
});

export type OverrideIssueDetailsInput = z.infer<typeof overrideIssueDetailsSchema>;

export const assignPersonSchema = z.object({
  personId: z.string().min(1, 'Responsible person ID is required'),
});

export type AssignPersonInput = z.infer<typeof assignPersonSchema>;
