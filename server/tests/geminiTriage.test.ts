import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  fallbackTriage,
  analyzeIssueWithGemini,
  clearTriageCache,
  getTriageCacheKey,
} from '../src/services/geminiService.js';
import { aiAnalysisOutputSchema } from '@fixora/shared';

describe('Gemini AI Triage Engine & Analysis Endpoint', () => {
  const app = createApp();
  const studentToken = 'Bearer test-token:student-uid-triage:student';

  beforeEach(() => {
    clearTriageCache();
  });

  describe('Deterministic Rule-Based Triage Logic', () => {
    it('correctly classifies electrical hazards with high severity for sparks', () => {
      const result = fallbackTriage({
        title: 'Sparks coming out of switchboard',
        description: 'Large sparks observed when plugging in phone charger, smell of burning wire',
        locationType: 'Academic Block',
        academicBlock: 'Aryabhata Block',
        specificLocation: 'Room 304, 3rd Floor',
      });

      expect(result.category).toBe('Electrical');
      expect(result.suggestedDepartment).toBe('Electrical');
      expect(result.suggestedSeverity).toBe('High');
      expect(result.improvedDescription).toContain('Aryabhata Block');
      // Validates schema compliance
      expect(() => aiAnalysisOutputSchema.parse(result)).not.toThrow();
    });

    it('correctly classifies water leaks under Plumbing department', () => {
      const result = fallbackTriage({
        title: 'Water pipe leaking in restroom',
        description: 'Flush pipe is dripping water continuously on the bathroom floor',
        locationType: 'Hostel Block',
        hostelBlock: 'Bhabha Hostel (BH-2)',
        specificLocation: 'Floor 2 Washroom',
      });

      expect(result.category).toBe('Plumbing');
      expect(result.suggestedDepartment).toBe('Plumbing');
      expect(result.suggestedSeverity).toBe('Medium');
      expect(() => aiAnalysisOutputSchema.parse(result)).not.toThrow();
    });

    it('correctly flags emergency hazards as Critical', () => {
      const result = fallbackTriage({
        title: 'Smoke in chemistry lab',
        description: 'Thick smoke and danger of fire near chemical cabinet',
        locationType: 'Academic Block',
        academicBlock: 'Ramanujan Block',
        specificLocation: 'Chemistry Lab Room 101',
      });

      expect(result.suggestedSeverity).toBe('Critical');
      expect(() => aiAnalysisOutputSchema.parse(result)).not.toThrow();
    });

    it('detects missing room/floor numbers and short descriptions as missingInformation', () => {
      const result = fallbackTriage({
        title: 'Door handle broken',
        description: 'Handle is loose',
        locationType: 'Academic Block',
        academicBlock: 'Kalam Block',
        specificLocation: 'Near corridor',
      });

      expect(result.missingInformation.length).toBeGreaterThan(0);
      expect(
        result.missingInformation.some((info) => info.toLowerCase().includes('room') || info.toLowerCase().includes('floor'))
      ).toBe(true);
    });
  });

  describe('Efficiency: Caching & In-Flight Request Deduplication', () => {
    it('generates consistent cache keys based on normalized content', () => {
      const key1 = getTriageCacheKey({
        title: 'Broken AC unit',
        description: 'Room is very hot',
        locationType: 'Academic Block',
        specificLocation: 'Room 201',
      });

      const key2 = getTriageCacheKey({
        title: '  Broken AC unit  ',
        description: ' room is very hot ',
        locationType: 'Academic Block',
        specificLocation: 'room 201',
      });

      expect(key1).toBe(key2);
    });

    it('caches analysis outputs to eliminate duplicate processing', async () => {
      const input = {
        title: 'Internet disconnected',
        description: 'Wi-Fi router in lab is not providing IP addresses',
        locationType: 'Academic Block' as const,
        academicBlock: 'Aryabhata Block',
        specificLocation: 'CS Lab 3',
      };

      const firstCall = await analyzeIssueWithGemini(input);
      const secondCall = await analyzeIssueWithGemini(input);

      expect(firstCall).toEqual(secondCall);
      expect(firstCall.suggestedDepartment).toBe('IT/Wi-Fi');
    });

    it('deduplicates concurrent in-flight requests for the same issue', async () => {
      const input = {
        title: 'Flickering ceiling tube light',
        description: 'Light in the lecture hall keeps flickering rapidly causing headache',
        locationType: 'Academic Block' as const,
        academicBlock: 'Ramanujan Block',
        specificLocation: 'Lecture Hall 1',
      };

      // Fire 3 simultaneous calls
      const [res1, res2, res3] = await Promise.all([
        analyzeIssueWithGemini(input),
        analyzeIssueWithGemini(input),
        analyzeIssueWithGemini(input),
      ]);

      expect(res1).toEqual(res2);
      expect(res2).toEqual(res3);
      expect(res1.category).toBe('Electrical');
    });
  });

  describe('POST /api/analyze-issue Security & Execution', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .send({
          title: 'Wi-Fi not connecting',
          description: 'Cannot connect to campus wifi in library reading room',
          locationType: 'Central Library',
          specificLocation: 'Reading Room 2',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid request payloads with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', studentToken)
        .send({
          title: 'Hi', // Too short
          description: 'Bad', // Too short
          locationType: 'Invalid Location Type',
          specificLocation: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('successfully triages and returns structured JSON for valid authenticated request', async () => {
      const res = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', studentToken)
        .send({
          title: 'Wi-Fi down in library',
          description: 'Students unable to connect to campus network throughout the 2nd floor library reading area.',
          locationType: 'Common Area',
          specificLocation: 'Central Library Floor 2 Reading Hall',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('category', 'IT/Wi-Fi');
      expect(res.body.data).toHaveProperty('suggestedDepartment', 'IT/Wi-Fi');
      expect(res.body.data).toHaveProperty('suggestedSeverity');
      expect(res.body.data).toHaveProperty('improvedDescription');
      expect(Array.isArray(res.body.data.missingInformation)).toBe(true);
    });

    it('enforces AI rate limiting with HTTP 429 when max requests are exceeded', async () => {
      const payload = {
        title: 'Projector not displaying HDMI',
        description: 'The overhead projector displays No Signal when connected via HDMI.',
        locationType: 'Academic Block',
        academicBlock: 'Aryabhata Block',
        specificLocation: 'Classroom 101',
      };

      // Send 15 requests (allowed limit within 5m window)
      for (let i = 0; i < 15; i++) {
        const okRes = await request(app)
          .post('/api/analyze-issue')
          .set('Authorization', studentToken)
          .set('x-test-rate-limit', 'true')
          .send(payload);
        expect(okRes.status).toBe(200);
      }

      // 16th request must be throttled with HTTP 429
      const throttledRes = await request(app)
        .post('/api/analyze-issue')
        .set('Authorization', studentToken)
        .set('x-test-rate-limit', 'true')
        .send(payload);

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.body.success).toBe(false);
      expect(throttledRes.body.error).toContain('Too many AI issue analysis requests');
    });
  });
});
