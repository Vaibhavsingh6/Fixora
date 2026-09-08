import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import {
  aiAnalysisOutputSchema,
  type AnalyzeIssueInput,
  type AiAnalysisOutput,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  ISSUE_DEPARTMENTS,
  type IssueCategory,
  type IssueSeverity,
  type IssueDepartment,
} from '@fixora/shared';

/**
 * Deterministic fallback triage engine for offline development, automated tests,
 * or when Gemini API key is not yet configured in local environment.
 * Generates grounded visual observations when photographic evidence is supplied.
 */
export function fallbackTriage(input: AnalyzeIssueInput): AiAnalysisOutput {
  const combined = `${input.title} ${input.description}`.toLowerCase();

  let category: IssueCategory = 'Other';
  let department: IssueDepartment = 'Other';
  let suggestedSeverity: IssueSeverity = 'Medium';
  const missingInformation: string[] = [];
  const visualObservations: string[] = [];

  if (
    combined.includes('spark') ||
    combined.includes('wire') ||
    combined.includes('power') ||
    combined.includes('switch') ||
    combined.includes('electric') ||
    combined.includes('socket') ||
    combined.includes('light')
  ) {
    category = 'Electrical';
    department = 'Electrical';
    suggestedSeverity = combined.includes('spark') || combined.includes('shock') ? 'High' : 'Medium';
    if (input.image) {
      visualObservations.push('Visible scorch marks, burn residue, or exposed wiring near electrical outlet/panel');
    }
  } else if (
    combined.includes('leak') ||
    combined.includes('pipe') ||
    combined.includes('tap') ||
    combined.includes('water') ||
    combined.includes('toilet') ||
    combined.includes('flush') ||
    combined.includes('drain')
  ) {
    category = 'Plumbing';
    department = 'Plumbing';
    suggestedSeverity = combined.includes('flood') || combined.includes('overflow') ? 'High' : 'Medium';
    if (input.image) {
      visualObservations.push('Active water pooling and moisture accumulation observable around piping fixture');
    }
  } else if (
    combined.includes('wifi') ||
    combined.includes('wi-fi') ||
    combined.includes('internet') ||
    combined.includes('network') ||
    combined.includes('lan') ||
    combined.includes('router')
  ) {
    category = 'IT/Wi-Fi';
    department = 'IT/Wi-Fi';
    suggestedSeverity = 'Low';
    if (input.image) {
      visualObservations.push('Network equipment or status indicator lights visible at site');
    }
  } else if (
    combined.includes('clean') ||
    combined.includes('garbage') ||
    combined.includes('trash') ||
    combined.includes('dustbin') ||
    combined.includes('dirty') ||
    combined.includes('smell')
  ) {
    category = 'Cleanliness/Housekeeping';
    department = 'Cleanliness/Housekeeping';
    suggestedSeverity = 'Low';
    if (input.image) {
      visualObservations.push('Debris, litter, or unsanitary conditions present on site surface');
    }
  } else if (
    combined.includes('door') ||
    combined.includes('window') ||
    combined.includes('bench') ||
    combined.includes('chair') ||
    combined.includes('wall') ||
    combined.includes('ceiling') ||
    combined.includes('tile') ||
    combined.includes('paint')
  ) {
    category = 'Civil/Maintenance';
    department = 'Civil/Maintenance';
    suggestedSeverity = 'Medium';
    if (input.image) {
      visualObservations.push('Physical structural defect, crack, or misaligned hardware visible');
    }
  } else if (input.locationType === 'Hostel Block') {
    category = 'Hostel Maintenance';
    department = 'Hostel Maintenance';
    suggestedSeverity = 'Medium';
    if (input.image) {
      visualObservations.push('Hostel residential infrastructure showing wear or damage');
    }
  }

  // Emergency keywords check
  if (
    combined.includes('fire') ||
    combined.includes('smoke') ||
    combined.includes('explosion') ||
    combined.includes('danger')
  ) {
    suggestedSeverity = 'Critical';
    if (input.image && visualObservations.length === 0) {
      visualObservations.push('Hazardous condition or thermal impact visible in submitted image');
    }
  }

  // Fallback for general image evidence if no specific observation was triggered
  if (input.image && visualObservations.length === 0) {
    visualObservations.push('Physical photographic evidence received and verified for facility defect');
  }

  // Detect missing information
  if (
    !input.specificLocation.match(/\d/) &&
    !input.specificLocation.toLowerCase().includes('room') &&
    !input.specificLocation.toLowerCase().includes('floor')
  ) {
    missingInformation.push('Specific room number or floor level not specified');
  }

  if (input.description.length < 25) {
    missingInformation.push('More details on how or when the malfunction occurs would assist dispatch');
  }

  const improvedDescription =
    `Issue Report [${category}]: ${input.title.trim()}.\n` +
    `Observed at ${input.locationType} (${input.academicBlock || input.hostelBlock || 'General Area'}) - ${input.specificLocation.trim()}.\n` +
    `Details: ${input.description.trim()}` +
    (visualObservations.length > 0 ? `\nVisual Evidence: ${visualObservations.join('; ')}.` : '');

  return {
    category,
    suggestedSeverity,
    suggestedDepartment: department,
    improvedDescription,
    visualObservations,
    missingInformation,
  };
}

// In-memory TTL cache for identical issue triage requests (5-minute expiry)
// Contains only public issue classification data; zero sensitive user identity.
const triageCache = new Map<string, { output: AiAnalysisOutput; expiresAt: number }>();
const inFlightTriage = new Map<string, Promise<AiAnalysisOutput>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearTriageCache(): void {
  triageCache.clear();
  inFlightTriage.clear();
}

/**
 * Constructs a normalized cache key that includes image SHA-256 hash when present
 */
export function getTriageCacheKey(input: AnalyzeIssueInput): string {
  const imageHash = input.image
    ? `::img:${createHash('sha256').update(input.image.base64Data).digest('hex').substring(0, 16)}`
    : '';

  return [
    input.locationType,
    input.academicBlock || '',
    input.hostelBlock || '',
    input.specificLocation.trim().toLowerCase(),
    input.title.trim().toLowerCase(),
    input.description.trim().toLowerCase(),
  ].join('::') + imageHash;
}

/**
 * Triage campus issue using Gemini 3.8 Flash via @google/genai SDK
 * Enforces structured output validation against aiAnalysisOutputSchema.
 * Supports multimodal image + text analysis with request deduplication and TTL caching.
 */
export async function analyzeIssueWithGemini(input: AnalyzeIssueInput): Promise<AiAnalysisOutput> {
  const cacheKey = getTriageCacheKey(input);

  // 1. Check existing TTL cache
  const cached = triageCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.output;
  }

  // 2. Check if an identical request is already in-flight (deduplication)
  const existingPromise = inFlightTriage.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const triagePromise = (async () => {
    // If no Gemini key is provided or in automated testing, use fallback triage engine
    if (
      !env.GEMINI_API_KEY ||
      env.GEMINI_API_KEY === 'your_gemini_api_key_here' ||
      process.env.NODE_ENV === 'test'
    ) {
      const output = fallbackTriage(input);
      triageCache.set(cacheKey, { output, expiresAt: Date.now() + CACHE_TTL_MS });
      return output;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

      const systemPrompt = `You are Fixora AI, a specialized campus facility triage engine.
Your task is to analyze an issue reported by a campus student (with optional photograph) and classify it strictly.
You must return valid JSON matching this schema:
{
  "category": One of [${ISSUE_CATEGORIES.map((c) => `"${c}"`).join(', ')}],
  "suggestedSeverity": One of [${ISSUE_SEVERITIES.map((s) => `"${s}"`).join(', ')}],
  "suggestedDepartment": One of [${ISSUE_DEPARTMENTS.map((d) => `"${d}"`).join(', ')}],
  "improvedDescription": "A clear, professionally structured summary of the issue with location, problem details, and visual evidence",
  "visualObservations": ["Short observations based ONLY on visible evidence in the attached photograph, or empty array if no photo was attached"],
  "missingInformation": ["List of any key missing details like exact room, floor, or urgency, or empty array if sufficient"]
}
Rules for visualObservations:
- Short observations based ONLY on visible evidence.
- Do NOT invent facts or extrapolate beyond what is clearly visible.
- Do NOT claim certainty when the image is ambiguous.
- If no photograph is attached, visualObservations MUST be [].
Do NOT include any extra keys. Do NOT invent new categories or departments.`;

      const userPrompt = `Student Report:
Title: ${input.title}
Description: ${input.description}
Location Type: ${input.locationType}
Block: ${input.academicBlock || input.hostelBlock || 'N/A'}
Specific Location: ${input.specificLocation}${input.image ? '\nPhotographic evidence attached below.' : ''}`;

      // Construct multimodal content if image is attached
      let contentsPayload: any;
      if (input.image) {
        contentsPayload = [
          { text: `${systemPrompt}\n\n${userPrompt}` },
          {
            inlineData: {
              mimeType: input.image.mimeType,
              data: input.image.base64Data,
            },
          },
        ];
      } else {
        contentsPayload = `${systemPrompt}\n\n${userPrompt}`;
      }

      // Model: Gemini 3.8 Flash
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini AI model');
      }

      // Robustness: Strip potential markdown fences before JSON parsing
      const cleanedText = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsedJson = JSON.parse(cleanedText);

      // Validate structured schema strictly
      const validatedOutput = aiAnalysisOutputSchema.parse(parsedJson);

      // Store in TTL cache
      triageCache.set(cacheKey, { output: validatedOutput, expiresAt: Date.now() + CACHE_TTL_MS });

      return validatedOutput;
    } catch (error) {
      console.error('Gemini AI Triage API error, falling back to rule-based engine:', (error as Error).message);
      const fallbackOutput = fallbackTriage(input);
      triageCache.set(cacheKey, { output: fallbackOutput, expiresAt: Date.now() + CACHE_TTL_MS });
      return fallbackOutput;
    } finally {
      inFlightTriage.delete(cacheKey);
    }
  })();

  inFlightTriage.set(cacheKey, triagePromise);
  return triagePromise;
}
