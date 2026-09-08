import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Server,
  Sparkles,
  Camera,
  Eye,
  Github,
  Linkedin,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <main id="main-content" className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 mb-6 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              <span>Fixora — Campus Issue Resolution Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Report it. Track it.{' '}
              <span className="text-indigo-600 underline decoration-indigo-400 decoration-wavy decoration-2">
                Fix it.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              Fixora connects students and campus facility administrators for swift, transparent campus
              maintenance powered by Google Gemini 3.8 Flash multimodal intelligence.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-md hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span>Go to My Dashboard ({user.role})</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-md hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Status Indicator */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>RBAC Security Active</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Multimodal Vision Triage</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Real-Time Ticket Audit</span>
              </span>
            </div>
          </div>

          {/* Interactive Flow Preview Showcase Card */}
          <div className="mt-14 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>FIXORA LIVE PIPELINE DEMO</span>
              </div>
              <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Gemini 3.8 Flash Multimodal</span>
              </span>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-xs uppercase tracking-wide">
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>1. Student Report</span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-900 mb-1">
                  Water Pipe Leak
                </div>
                <p className="text-xs text-slate-600">
                  Room 304, Academic Block A. Photograph attached and uploaded securely.
                </p>
              </div>

              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/60">
                <div className="flex items-center gap-2 mb-2 text-indigo-800 font-bold text-xs uppercase tracking-wide">
                  <Eye className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>2. AI Vision Triage</span>
                </div>
                <div className="text-xs font-semibold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <span>Plumbing • Severity: High</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Visual evidence detects exposed valve leak and floor accumulation near corridor.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-xs uppercase tracking-wide">
                  <Wrench className="w-4 h-4" aria-hidden="true" />
                  <span>3. Admin Dispatch</span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-900 mb-1">
                  Ticket: FIX-008214
                </div>
                <p className="text-xs text-slate-600">
                  Dispatched to Plumbing Team lead. Real-time audit timeline updated for student.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Campus Workflow Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The Fixora Campus Lifecycle
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              From the moment an issue occurs in a classroom, dorm, or lab to full resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Student Reports</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Students submit facility reports with optional photographs directly from their mobile
                device or desktop browser.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Multimodal AI Triage</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gemini 3.8 Flash inspects visual observations, evaluates urgency, validates schemas, and
                advises the dispatch team.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Admin Dispatch & Resolve</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Facility administrators dispatch technicians, override classifications if needed, and log
                resolution notes visible to students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Production Architecture & Security */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Enterprise-Grade Campus Architecture
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              Engineered with strict role-based access control, multimodal AI intelligence, and audited dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-indigo-600 mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Strict Authorization</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Role-based routing prevents unauthorized access. Firestore security rules enforce role
                immutability, data isolation, and ownership.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Server className="w-8 h-8 text-indigo-600 mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Hardened Express API</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Helmet security headers, strict CORS, request payload limits, and Zod input validation
                protect the backend boundary.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <Sparkles className="w-8 h-8 text-indigo-600 mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Gemini 3.8 Flash Integration</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Server-side multimodal visual and text issue analysis via @google/genai with zero client key
                leaks and complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Professional Profile / Built by Vaibhav Singh */}
          <div className="mb-6 p-6 max-w-lg mx-auto rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/30 border border-slate-200/80 shadow-xs text-center">
            <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-700 mb-1">
              Architect &amp; Lead Developer
            </p>
            <h3 className="text-base font-bold text-slate-900">
              Built by Vaibhav Singh
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Integrated M.Tech Artificial Intelligence — VIT Bhopal
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <a
                href="https://github.com/Vaibhavsingh6"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Vaibhav Singh's GitHub Profile (opens in new tab)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Github className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                <span>GitHub</span>
              </a>

              <a
                href="https://www.linkedin.com/in/vaibhavsingh-ai/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Vaibhav Singh's LinkedIn Profile (opens in new tab)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-semibold text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Linkedin className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          <p>© {new Date().getFullYear()} Fixora. All rights reserved. Prepared for PromptWars Community 2026.</p>
          <p className="mt-1">
            Built with React, TypeScript, Express, Cloud Firestore, and Google Gemini 3.8 Flash.
          </p>
        </div>
      </footer>
    </main>
  );
};
