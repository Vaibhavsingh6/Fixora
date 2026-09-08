import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, userProfileSchema } from '@fixora/shared';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const valid = loginSchema.safeParse({
        email: 'student@vitbhopal.ac.in',
        password: 'password123',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const invalid = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('valid email');
      }
    });

    it('rejects password shorter than 6 characters', () => {
      const invalid = loginSchema.safeParse({
        email: 'student@vitbhopal.ac.in',
        password: '123',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('at least 6 characters');
      }
    });
  });

  describe('registerSchema', () => {
    it('accepts valid student registration', () => {
      const valid = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@vitbhopal.ac.in',
        password: 'securepassword',
        role: 'student',
      });
      expect(valid.success).toBe(true);
    });

    it('accepts registration and defaults role to student when omitted', () => {
      const valid = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@vitbhopal.ac.in',
        password: 'securepassword',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.role).toBe('student');
      }
    });

    it('rejects unauthorized or arbitrary roles', () => {
      const invalid = registerSchema.safeParse({
        name: 'Hacker',
        email: 'hacker@vitbhopal.ac.in',
        password: 'securepassword',
        role: 'superadmin',
      });
      expect(invalid.success).toBe(false);
    });

    it('rejects blank name', () => {
      const invalid = registerSchema.safeParse({
        name: '',
        email: 'jane@vitbhopal.ac.in',
        password: 'securepassword',
        role: 'student',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('userProfileSchema', () => {
    it('validates a complete user document profile', () => {
      const valid = userProfileSchema.safeParse({
        uid: 'user-12345',
        name: 'Alex Smith',
        email: 'alex@vitbhopal.ac.in',
        role: 'student',
        createdAt: Date.now(),
      });
      expect(valid.success).toBe(true);
    });

    it('rejects profiles missing required fields', () => {
      const invalid = userProfileSchema.safeParse({
        uid: 'user-12345',
        name: 'Alex Smith',
      });
      expect(invalid.success).toBe(false);
    });
  });
});
