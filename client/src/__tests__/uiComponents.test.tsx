import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { ImageLightbox } from '../components/common/ImageLightbox';
import { StatusFilterChips } from '../components/common/StatusFilterChips';
import { AiTriageCard } from '../components/issue/AiTriageCard';
import { AccessStatusBanner } from '../components/common/AccessStatusBanner';
import type { Issue } from '@fixora/shared';

describe('Phase 4B UI Components Verification', () => {
  describe('ImageLightbox Component', () => {
    it('does not render markup when isOpen is false', () => {
      const html = ReactDOMServer.renderToString(
        <ImageLightbox
          isOpen={false}
          imageUrl="https://storage.googleapis.com/test.jpg"
          altText="Test photo"
          onClose={() => {}}
        />
      );
      expect(html).toBe('');
    });

    it('renders accessible modal dialog when isOpen is true', () => {
      const html = ReactDOMServer.renderToString(
        <ImageLightbox
          isOpen={true}
          imageUrl="https://storage.googleapis.com/test.jpg"
          altText="Damaged projector in lab"
          title="Photograph: Damaged projector (FIX-123456)"
          onClose={() => {}}
        />
      );

      // ARIA and accessibility
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="Image viewer: Photograph: Damaged projector (FIX-123456)"');
      expect(html).toContain('aria-label="Close image viewer (Press Escape)"');
      expect(html).toContain('Close (Esc)');

      // Image properly contained
      expect(html).toContain('src="https://storage.googleapis.com/test.jpg"');
      expect(html).toContain('alt="Damaged projector in lab"');
      expect(html).toContain('object-contain');
    });
  });

  describe('StatusFilterChips Component', () => {
    it('renders All and all 6 campus issue statuses', () => {
      const html = ReactDOMServer.renderToString(
        <StatusFilterChips selectedStatus="" onSelectStatus={() => {}} />
      );

      expect(html).toContain('role="tablist"');
      expect(html).toContain('All');
      expect(html).toContain('Submitted');
      expect(html).toContain('Under Review');
      expect(html).toContain('Assigned');
      expect(html).toContain('In Progress');
      expect(html).toContain('Resolved');
      expect(html).toContain('Reopened');
    });

    it('sets aria-selected="true" on the selected chip and false on others', () => {
      const html = ReactDOMServer.renderToString(
        <StatusFilterChips selectedStatus="In Progress" onSelectStatus={() => {}} />
      );

      // In Progress is selected
      expect(html).toMatch(/aria-selected="true"[^>]*>.*In Progress/);
      // All is unselected
      expect(html).toMatch(/aria-selected="false"[^>]*>.*All/);
    });
  });

  describe('AiTriageCard - Gemini Vision Insights & Description Comparison', () => {
    const mockIssue: Issue = {
      id: 'issue-101',
      ticketId: 'FIX-100101',
      title: 'Water leaking from overhead AC unit',
      description: 'Water is dripping on student desks in Room 401.',
      improvedDescription:
        'Active water leakage detected from the overhead AC unit dripping directly onto student desks in Room 401, creating an electrical and slip hazard.',
      category: 'Plumbing',
      severity: 'High',
      department: 'Plumbing',
      aiSuggestedSeverity: 'High',
      aiSuggestedDepartment: 'Plumbing',
      status: 'In Progress',
      locationType: 'Academic Block',
      academicBlock: 'Block A',
      specificLocation: 'Room 401, 4th Floor',
      reporterId: 'student-uid-1',
      reporterName: 'John Doe',
      reporterEmail: 'student@campus.edu',
      assignedToId: 'tech-1',
      assignedToName: 'Mark Vance',
      hasImage: true,
      imageStoragePath: 'issues/student-uid-1/test.jpg',
      imageContentType: 'image/jpeg',
      visualObservations: [
        'Visible pool of water accumulating on wooden desk surface',
        'Overhead AC vent shows condensation droplets and staining',
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('renders dedicated AI Vision Insights section when visual observations exist', () => {
      const html = ReactDOMServer.renderToString(<AiTriageCard issue={mockIssue} />);

      expect(html).toContain('AI Vision Insights');
      expect(html).toContain('Analyzed by Gemini 3.8 Flash');
      expect(html).toContain('Visual Evidence Analyzed');
      expect(html).toContain('Visible pool of water accumulating on wooden desk surface');
      expect(html).toContain('Overhead AC vent shows condensation droplets and staining');
    });

    it('renders qualitative advisory tags and does NOT display fake confidence percentages', () => {
      const html = ReactDOMServer.renderToString(<AiTriageCard issue={mockIssue} />);

      expect(html).toContain('AI Suggested (Advisory Only)');
      expect(html).toContain('Decision Transparency');
      expect(html).toContain('strictly reviewed and approved by human campus administrators');

      // Zero fake confidence percentages
      expect(html).not.toMatch(/\b\d{2,3}%\b/);
      expect(html).not.toMatch(/confidence/i);
    });

    it('renders clean side-by-side comparison of Original Description vs AI Improved Draft', () => {
      const html = ReactDOMServer.renderToString(<AiTriageCard issue={mockIssue} />);

      expect(html).toContain('Original Description');
      expect(html).toContain('Student Report');
      expect(html).toContain('Water is dripping on student desks in Room 401.');

      expect(html).toContain('AI Improved Draft');
      expect(html).toContain('Gemini Structured');
      expect(html).toContain(
        'Active water leakage detected from the overhead AC unit dripping directly onto student desks in Room 401'
      );
    });

    it('handles issues without visual observations gracefully', () => {
      const noPhotoIssue: Issue = {
        ...mockIssue,
        hasImage: false,
        visualObservations: [],
        improvedDescription: undefined,
      };
      const html = ReactDOMServer.renderToString(<AiTriageCard issue={noPhotoIssue} />);

      expect(html).not.toContain('AI Vision Insights');
      expect(html).toContain('Student Description');
      expect(html).toContain('Water is dripping on student desks in Room 401.');
    });
  });

  describe('VIT Bhopal Email Domain Access Control (Client)', () => {
    it('isAllowedInstitutionalEmail accepts valid @vitbhopal.ac.in addresses', async () => {
      const { isAllowedInstitutionalEmail } = await import('@fixora/shared');
      expect(isAllowedInstitutionalEmail('student@vitbhopal.ac.in')).toBe(true);
      expect(isAllowedInstitutionalEmail('admin@vitbhopal.ac.in')).toBe(true);
      expect(isAllowedInstitutionalEmail('FACULTY@VITBHOPAL.AC.IN')).toBe(true);
    });

    it('isAllowedInstitutionalEmail rejects non-VIT domains', async () => {
      const { isAllowedInstitutionalEmail } = await import('@fixora/shared');
      expect(isAllowedInstitutionalEmail('student@gmail.com')).toBe(false);
      expect(isAllowedInstitutionalEmail('student@vit.ac.in')).toBe(false);
      expect(isAllowedInstitutionalEmail('student@vitbhopal.com')).toBe(false);
      expect(isAllowedInstitutionalEmail('student@vitbhopal.ac.in.evil.com')).toBe(false);
      expect(isAllowedInstitutionalEmail('student@sub.vitbhopal.ac.in')).toBe(false);
    });

    it('loginSchema enforces @vitbhopal.ac.in and rejects other emails', async () => {
      const { loginSchema } = await import('@fixora/shared');
      const valid = loginSchema.safeParse({
        email: 'student@vitbhopal.ac.in',
        password: 'password123',
      });
      expect(valid.success).toBe(true);

      const invalid = loginSchema.safeParse({
        email: 'student@gmail.com',
        password: 'password123',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('vitbhopal.ac.in');
      }
    });

    it('registerSchema enforces @vitbhopal.ac.in and rejects other emails', async () => {
      const { registerSchema } = await import('@fixora/shared');
      const valid = registerSchema.safeParse({
        name: 'Aryan Verma',
        email: 'aryan@vitbhopal.ac.in',
        password: 'securepassword',
        role: 'student',
      });
      expect(valid.success).toBe(true);

      const invalid = registerSchema.safeParse({
        name: 'Aryan Verma',
        email: 'aryan@outlook.com',
        password: 'securepassword',
        role: 'student',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toContain('vitbhopal.ac.in');
      }
    });
  });

  describe('AccessStatusBanner - Institutional Access Feedback', () => {
    it('renders granted state with checkmark, VIT acceptance message, and secondary instructions', () => {
      const html = ReactDOMServer.renderToString(
        <AccessStatusBanner
          status="granted"
          title="ACCESS GRANTED"
          message="VIT Bhopal email accepted."
          secondaryMessage="Please verify your institutional email before signing in."
          action={<a href="/login">Proceed to Sign In</a>}
        />
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('ACCESS GRANTED');
      expect(html).toContain('✓');
      expect(html).toContain('VIT Bhopal email accepted.');
      expect(html).toContain('Please verify your institutional email before signing in.');
      expect(html).toContain('Proceed to Sign In');
    });

    it('renders domain denied state with cross marker and institutional policy message', () => {
      const html = ReactDOMServer.renderToString(
        <AccessStatusBanner
          status="denied"
          title="ACCESS DENIED"
          message="Fixora is restricted to verified VIT Bhopal email accounts (@vitbhopal.ac.in)."
        />
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('ACCESS DENIED');
      expect(html).toContain('✕');
      expect(html).toContain('Fixora is restricted to verified VIT Bhopal email accounts (@vitbhopal.ac.in).');
    });

    it('renders unverified VIT account denied state with resend verification action', () => {
      const html = ReactDOMServer.renderToString(
        <AccessStatusBanner
          status="denied"
          title="ACCESS DENIED"
          message="Please verify your VIT Bhopal email before accessing Fixora."
          action={<button type="button">Resend verification email</button>}
        />
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('ACCESS DENIED');
      expect(html).toContain('✕');
      expect(html).toContain('Please verify your VIT Bhopal email before accessing Fixora.');
      expect(html).toContain('Resend verification email');
    });
  });

  describe('API URL Configuration for Vercel and Localhost', () => {
    it('buildApiUrl returns relative path when base URL is empty or undefined', async () => {
      const { buildApiUrl } = await import('../config/api');
      expect(buildApiUrl('', '/api/issues')).toBe('/api/issues');
      expect(buildApiUrl(undefined, 'api/issues')).toBe('/api/issues');
      expect(buildApiUrl('', '/api/health')).toBe('/api/health');
    });

    it('buildApiUrl prepends remote Vercel base URL and normalizes trailing slashes', async () => {
      const { buildApiUrl } = await import('../config/api');
      expect(buildApiUrl('https://fixora-backend.vercel.app', '/api/issues')).toBe(
        'https://fixora-backend.vercel.app/api/issues'
      );
      expect(buildApiUrl('https://fixora-backend.vercel.app/', 'api/issues')).toBe(
        'https://fixora-backend.vercel.app/api/issues'
      );
      expect(buildApiUrl('  https://fixora-backend.vercel.app/  ', '/api/health')).toBe(
        'https://fixora-backend.vercel.app/api/health'
      );
    });

    it('apiUrl helper formats paths correctly', async () => {
      const { apiUrl } = await import('../config/api');
      expect(apiUrl('/api/issues')).toMatch(/\/api\/issues$/);
    });
  });

  describe('LandingPage - Professional Profile Footer', () => {
    it('renders Built by Vaibhav Singh with academic info and verified social links', async () => {
      const { MemoryRouter } = await import('react-router-dom');
      const { AuthProvider } = await import('../context/AuthContext');
      const { LandingPage } = await import('../pages/LandingPage');

      const html = ReactDOMServer.renderToString(
        <AuthProvider>
          <MemoryRouter>
            <LandingPage />
          </MemoryRouter>
        </AuthProvider>
      );

      // Verify creator identity and institutional background
      expect(html).toContain('Built by Vaibhav Singh');
      expect(html).toContain('Integrated M.Tech Artificial Intelligence — VIT Bhopal');

      // Verify GitHub link attributes
      expect(html).toContain('href="https://github.com/Vaibhavsingh6"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');

      // Verify LinkedIn link attributes
      expect(html).toContain('href="https://www.linkedin.com/in/vaibhavsingh-ai/"');
    });
  });
});
