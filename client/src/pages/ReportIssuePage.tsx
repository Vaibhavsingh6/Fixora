import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  FileText,
  Tag,
  ShieldAlert,
  Building,
  ArrowRight,
  Info,
  RotateCcw,
  Camera,
  Eye,
  Check,
} from 'lucide-react';
import {
  LOCATION_TYPES,
  ACADEMIC_BLOCKS,
  HOSTEL_BLOCKS,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  type LocationType,
  type IssueCategory,
  type IssueSeverity,
  type IssueDepartment,
  type AiAnalysisOutput,
  type Issue,
} from '@fixora/shared';
import {
  analyzeIssueWithAI,
  reportIssue,
  uploadIssueImage,
} from '../services/issueService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ImageUpload, type SelectedImageData } from '../components/ImageUpload';

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('Academic Block');
  const [academicBlock, setAcademicBlock] = useState<string>(ACADEMIC_BLOCKS[0]);
  const [hostelBlock, setHostelBlock] = useState<string>(HOSTEL_BLOCKS[0]);
  const [specificLocation, setSpecificLocation] = useState('');

  // Optional Photo State
  const [selectedImage, setSelectedImage] = useState<SelectedImageData | null>(null);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);
  const [uploadedContentType, setUploadedContentType] = useState<
    'image/jpeg' | 'image/png' | 'image/webp' | null
  >(null);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);

  // AI Triage State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisOutput | null>(null);
  const [useImprovedDesc, setUseImprovedDesc] = useState(false);

  // Overridable Category and Severity (prefilled from AI)
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>('Other');
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity>('Medium');
  const [selectedDepartment, setSelectedDepartment] = useState<IssueDepartment>('Other');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedIssue, setSubmittedIssue] = useState<Issue | null>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  // Helper to read/upload file
  const ensureImageUploaded = async (): Promise<{
    storagePath: string;
    contentType: 'image/jpeg' | 'image/png' | 'image/webp';
    base64Data: string;
  } | null> => {
    if (!selectedImage) return null;

    if (uploadedStoragePath && uploadedContentType && cachedBase64) {
      return {
        storagePath: uploadedStoragePath,
        contentType: uploadedContentType,
        base64Data: cachedBase64,
      };
    }

    const uploaded = await uploadIssueImage(selectedImage.file);
    setUploadedStoragePath(uploaded.storagePath);
    setUploadedContentType(uploaded.contentType);
    setCachedBase64(uploaded.base64Data);
    return uploaded;
  };

  // Trigger AI Analysis
  const handleAnalyzeWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Please provide a title with at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide a description with at least 10 characters.');
      return;
    }
    if (specificLocation.trim().length < 2) {
      setError('Please specify the exact location (e.g. Room number or floor).');
      return;
    }

    setIsAnalyzing(true);
    try {
      let imagePayload:
        | {
            base64Data: string;
            mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
            storagePath?: string;
          }
        | undefined;

      if (selectedImage) {
        const uploaded = await ensureImageUploaded();
        if (uploaded) {
          imagePayload = {
            base64Data: uploaded.base64Data,
            mimeType: uploaded.contentType,
            storagePath: uploaded.storagePath,
          };
        }
      }

      const result = await analyzeIssueWithAI({
        title,
        description,
        locationType,
        academicBlock: locationType === 'Academic Block' ? academicBlock : undefined,
        hostelBlock: locationType === 'Hostel Block' ? hostelBlock : undefined,
        specificLocation,
        image: imagePayload,
      });

      setAiAnalysis(result);
      setSelectedCategory(result.category);
      setSelectedSeverity(result.suggestedSeverity);
      setSelectedDepartment(result.suggestedDepartment);
      setUseImprovedDesc(true);
      setTimeout(() => {
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError((err as Error).message || 'Failed to analyze issue with AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Final Ticket
  const handleSubmitTicket = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      let imageStoragePath: string | undefined = uploadedStoragePath || undefined;
      let imageContentType: 'image/jpeg' | 'image/png' | 'image/webp' | undefined =
        uploadedContentType || undefined;

      if (selectedImage && (!imageStoragePath || !imageContentType)) {
        const uploaded = await ensureImageUploaded();
        if (uploaded) {
          imageStoragePath = uploaded.storagePath;
          imageContentType = uploaded.contentType;
        }
      }

      const finalDescription =
        useImprovedDesc && aiAnalysis?.improvedDescription
          ? aiAnalysis.improvedDescription
          : description;

      const issue = await reportIssue({
        title,
        description: finalDescription,
        improvedDescription: aiAnalysis?.improvedDescription,
        category: selectedCategory,
        aiSuggestedSeverity: aiAnalysis ? aiAnalysis.suggestedSeverity : selectedSeverity,
        severity: selectedSeverity,
        aiSuggestedDepartment: aiAnalysis ? aiAnalysis.suggestedDepartment : selectedDepartment,
        department: selectedDepartment,
        locationType,
        academicBlock: locationType === 'Academic Block' ? academicBlock : undefined,
        hostelBlock: locationType === 'Hostel Block' ? hostelBlock : undefined,
        specificLocation,
        hasImage: Boolean(selectedImage && imageStoragePath),
        imageStoragePath,
        imageContentType,
        visualObservations: aiAnalysis?.visualObservations || [],
      });

      setSubmittedIssue(issue);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit issue ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Success Screen upon submission
  if (submittedIssue) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 sm:p-10">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Ticket Submitted Successfully!
          </h1>
          <p className="text-slate-600 mb-6">
            Your issue has been logged and routed to campus facilities for immediate action.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-sm font-medium text-slate-600">Ticket ID</span>
              <span className="font-mono text-lg font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">
                {submittedIssue.ticketId}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Title</span>
              <span className="font-semibold text-slate-800">{submittedIssue.title}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Assigned Department</span>
              <span className="font-semibold text-slate-800">{submittedIssue.department}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Severity</span>
              <SeverityBadge severity={submittedIssue.severity} size="sm" />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Initial Status</span>
              <StatusBadge status={submittedIssue.status} />
            </div>
            {submittedIssue.hasImage && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>Attached Photo</span>
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified & Stored
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/issues/${submittedIssue.id}`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span>View Ticket Details</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <Link
              to="/my-issues"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Go to My Issues
            </Link>
            <button
              onClick={() => {
                setSubmittedIssue(null);
                setAiAnalysis(null);
                setSelectedImage(null);
                setUploadedStoragePath(null);
                setUploadedContentType(null);
                setCachedBase64(null);
                setTitle('');
                setDescription('');
                setSpecificLocation('');
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Report Another</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
          <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
          <span>Fixora AI-Assisted Dispatch</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report a Campus Issue</h1>
        <p className="text-slate-600 mt-1">
          Describe the problem and optionally attach a photo. Gemini 3.8 Flash will inspect visual evidence, categorize, evaluate severity, and assist facilities staff.
        </p>
      </div>

      {/* 3-Step Progress Stepper */}
      <nav aria-label="Issue reporting progress" className="mb-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <ol className="flex items-center justify-between text-xs font-semibold max-w-xl mx-auto">
          <li className="flex items-center gap-2 text-indigo-700">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              1
            </span>
            <span className="hidden sm:inline">Details & Photo</span>
            <span className="sm:hidden">Details</span>
          </li>
          <li className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200" aria-hidden="true" />
          <li className={`flex items-center gap-2 ${aiAnalysis ? 'text-indigo-700' : 'text-slate-500'}`}>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                aiAnalysis ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              2
            </span>
            <span className="hidden sm:inline">AI Vision Triage</span>
            <span className="sm:hidden">AI Triage</span>
          </li>
          <li className="flex-1 h-0.5 mx-2 sm:mx-4 bg-slate-200" aria-hidden="true" />
          <li className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs border border-slate-200">
              3
            </span>
            <span>Dispatch</span>
          </li>
        </ol>
      </nav>

      {error && (
        <div className="mb-6" role="alert">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details & Photo Upload */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              <span>Step 1: Enter Issue Details</span>
            </h2>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1">
                Issue Title <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Water pipe leaking in 2nd floor washroom"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                required
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">
                Detailed Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is broken, what happens, and any immediate safety concerns..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                required
                maxLength={2000}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 characters.</p>
            </div>

            {/* Location Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="locationType" className="block text-sm font-semibold text-slate-700 mb-1">
                  Location Type <span className="text-red-600">*</span>
                </label>
                <select
                  id="locationType"
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as LocationType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                >
                  {LOCATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Block Selector */}
              {locationType === 'Academic Block' && (
                <div>
                  <label htmlFor="academicBlock" className="block text-sm font-semibold text-slate-700 mb-1">
                    Academic Block
                  </label>
                  <select
                    id="academicBlock"
                    value={academicBlock}
                    onChange={(e) => setAcademicBlock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                  >
                    {ACADEMIC_BLOCKS.map((block) => (
                      <option key={block} value={block}>
                        {block}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {locationType === 'Hostel Block' && (
                <div>
                  <label htmlFor="hostelBlock" className="block text-sm font-semibold text-slate-700 mb-1">
                    Hostel Block
                  </label>
                  <select
                    id="hostelBlock"
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                  >
                    {HOSTEL_BLOCKS.map((block) => (
                      <option key={block} value={block}>
                        {block}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Specific Location */}
            <div>
              <label htmlFor="specificLocation" className="block text-sm font-semibold text-slate-700 mb-1">
                Specific Location <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" aria-hidden="true" />
                <input
                  id="specificLocation"
                  type="text"
                  value={specificLocation}
                  onChange={(e) => setSpecificLocation(e.target.value)}
                  placeholder="e.g. Room 304, 3rd Floor East Wing or Corridor near Elevator"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                  required
                />
              </div>
            </div>

            {/* Optional Photo Upload */}
            <div className="pt-2 border-t border-slate-100">
              <ImageUpload
                selectedImage={selectedImage}
                onImageSelected={(img) => {
                  setSelectedImage(img);
                  setUploadedStoragePath(null);
                  setUploadedContentType(null);
                  setCachedBase64(null);
                }}
                disabled={isAnalyzing || isSubmitting}
              />
            </div>

            {/* Analyze Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl transition shadow-sm hover:shadow disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner inline size="sm" className="text-white" />
                    <span>Gemini 3.8 Flash Analyzing {selectedImage ? 'Photo & Issue' : 'Issue'}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" aria-hidden="true" />
                    <span>Analyze with AI (Gemini 3.8 Flash)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Submission Card */}
        <div ref={step2Ref} className="lg:col-span-5 space-y-6">
          <div
            aria-live="polite"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span>Step 2: AI Triage & Review</span>
              </h2>
              {aiAnalysis && (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  AI Suggested
                </span>
              )}
            </div>

            {aiAnalysis ? (
              <div className="space-y-4">
                {/* AI Badges */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Suggested Category</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{aiAnalysis.category}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Suggested Dept</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {aiAnalysis.suggestedDepartment}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>AI Evaluated Severity</span>
                    </span>
                    <SeverityBadge severity={aiAnalysis.suggestedSeverity} size="sm" />
                  </div>
                </div>

                {/* Grounded Visual Observations (AI Vision Insights) */}
                {aiAnalysis.visualObservations && aiAnalysis.visualObservations.length > 0 && (
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5 text-xs text-indigo-950 uppercase tracking-wider">
                        <Eye className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                        <span>AI Vision Insights</span>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                        Gemini 3.8 Flash
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {aiAnalysis.visualObservations.map((obs, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-indigo-950 font-medium bg-white/80 p-2 rounded-lg border border-indigo-100/80"
                        >
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="leading-relaxed">{obs}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Information warning if any */}
                {aiAnalysis.missingInformation && aiAnalysis.missingInformation.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>Helpful Tips for Dispatch:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
                      {aiAnalysis.missingInformation.map((info, idx) => (
                        <li key={idx}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Description Draft Comparison */}
                {aiAnalysis.improvedDescription && (
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                        <span>Description Comparison</span>
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                        <input
                          type="checkbox"
                          checked={useImprovedDesc}
                          onChange={(e) => setUseImprovedDesc(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Use AI Improved Draft</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div
                        className={`p-2.5 rounded-lg border transition ${
                          !useImprovedDesc
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-700 text-[11px]">
                            Original (Your Input)
                          </span>
                          {!useImprovedDesc && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 text-xs leading-relaxed">{description}</p>
                      </div>

                      <div
                        className={`p-2.5 rounded-lg border transition ${
                          useImprovedDesc
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-indigo-950 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                            <span>AI Improved Draft</span>
                          </span>
                          {useImprovedDesc && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-indigo-950 text-xs leading-relaxed italic">
                          "{aiAnalysis.improvedDescription}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overrides before submission */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Confirm or Adjust Before Submitting
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="confirmCategory" className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        id="confirmCategory"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as IssueCategory)}
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                      >
                        {ISSUE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="confirmSeverity" className="block text-xs font-semibold text-slate-700 mb-1">
                        Severity
                      </label>
                      <select
                        id="confirmSeverity"
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value as IssueSeverity)}
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                      >
                        {ISSUE_SEVERITIES.map((sev) => (
                          <option key={sev} value={sev}>
                            {sev}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitTicket}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow hover:shadow-md disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner inline size="sm" className="text-white" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                      <span>Confirm & Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 px-4 text-slate-600 space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                  <Sparkles className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-sm">
                  Fill in the issue details on the left, optionally attach a photo, then click{' '}
                  <strong className="text-slate-800">"Analyze with AI"</strong> to generate automated triage suggestions.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitTicket}
                    disabled={isSubmitting || title.trim().length < 3 || description.trim().length < 10}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span>Skip AI & Submit Directly</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
