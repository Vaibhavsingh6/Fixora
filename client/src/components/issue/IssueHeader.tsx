import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Wrench, CheckCircle2, Camera, AlertCircle, ZoomIn } from 'lucide-react';
import type { Issue } from '@fixora/shared';
import { StatusBadge } from '../StatusBadge';
import { SeverityBadge } from '../SeverityBadge';
import { fetchIssueImageBlob } from '../../services/issueService';
import { LoadingSpinner } from '../LoadingSpinner';
import { ImageLightbox } from '../common/ImageLightbox';

interface IssueHeaderProps {
  issue: Issue;
}

export const IssueHeader: React.FC<IssueHeaderProps> = ({ issue }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(Boolean(issue.hasImage));
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    if (issue.hasImage) {
      setImageLoading(true);
      setImageError(null);

      fetchIssueImageBlob(issue.id)
        .then((blob) => {
          if (active) {
            createdBlobUrl = URL.createObjectURL(blob);
            setImageUrl(createdBlobUrl);
            setImageLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setImageError((err as Error).message || 'Failed to load photograph');
            setImageLoading(false);
          }
        });
    }

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [issue.id, issue.hasImage]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusBadge status={issue.status} />
        <SeverityBadge severity={issue.severity} showIcon />
        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          {issue.department}
        </span>
        {issue.hasImage && (
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Photo Attached</span>
          </span>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{issue.title}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-800">Location:</strong> {issue.locationType}
            {issue.academicBlock ? ` • ${issue.academicBlock}` : ''}
            {issue.hostelBlock ? ` • ${issue.hostelBlock}` : ''} - {issue.specificLocation}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-800">Reported:</strong>{' '}
            {new Date(Number(issue.createdAt)).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-slate-800">Reporter:</strong> {issue.reporterName} ({issue.reporterEmail})
          </span>
        </div>
        {issue.assignedToName && (
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-slate-800">Assigned Tech:</strong> {issue.assignedToName}
            </span>
          </div>
        )}
      </div>

      {/* Attached Photograph Section */}
      {issue.hasImage && (
        <section aria-label="Attached issue photograph" className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span>Attached Problem Photograph</span>
          </span>

          {imageLoading && (
            <div className="h-48 bg-slate-100 rounded-xl flex items-center justify-center">
              <LoadingSpinner size="md" label="Loading issue photograph..." />
            </div>
          )}

          {imageError && (
            <div
              role="alert"
              className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>Could not load attached photo: {imageError}</span>
            </div>
          )}

          {imageUrl && !imageLoading && (
            <div className="space-y-2">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  aria-label="View full-resolution photograph"
                  className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center relative cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
                >
                  <img
                    src={imageUrl}
                    alt={`Photograph of reported issue: ${issue.title}`}
                    className="max-h-80 w-full object-contain transition duration-200 group-hover:scale-[1.01]"
                  />
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm border border-slate-700 shadow-md pointer-events-none">
                    <ZoomIn className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                    <span>Click to enlarge</span>
                  </div>
                </button>
              </div>

              <ImageLightbox
                isOpen={isLightboxOpen}
                imageUrl={imageUrl}
                altText={`Full-resolution photograph of reported issue: ${issue.title}`}
                title={`Photograph: ${issue.title} (${issue.ticketId})`}
                onClose={() => setIsLightboxOpen(false)}
              />
            </div>
          )}
        </section>
      )}

      {/* Resolution Banner */}
      {issue.status === 'Resolved' && issue.resolutionNote && (
        <section
          aria-label="Resolution details"
          className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1 mt-2"
        >
          <div className="font-semibold text-emerald-950 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span>Official Resolution Summary</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed pl-6">{issue.resolutionNote}</p>
        </section>
      )}
    </div>
  );
};
