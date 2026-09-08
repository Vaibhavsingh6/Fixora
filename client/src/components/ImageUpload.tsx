import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface SelectedImageData {
  file: File;
  previewUrl: string;
}

interface ImageUploadProps {
  onImageSelected: (imageData: SelectedImageData | null) => void;
  selectedImage: SelectedImageData | null;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  selectedImage,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (file: File | undefined) => {
    setErrorMessage(null);
    if (!file) return;

    // 1. Validate MIME format
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage(
        `Unsupported format (${file.type || 'unknown'}). Please choose a JPEG, PNG, or WebP image.`
      );
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(
        `Selected file is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.`
      );
      return;
    }

    // 3. Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    onImageSelected({ file, previewUrl });
  };

  const handleRemove = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setErrorMessage(null);
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="issue-photo-input"
          className="block text-sm font-semibold text-slate-700"
        >
          Attach Photograph <span className="text-xs font-normal text-slate-500">(Optional)</span>
        </label>
        {selectedImage && (
          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Photo Selected</span>
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500" id="photo-instructions">
        Upload a clear photograph to assist Gemini AI and facility technicians in assessing damage.
        Supported: JPEG, PNG, WebP (Max 5 MB).
      </p>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="issue-photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-describedby="photo-instructions"
        disabled={disabled}
        onChange={(e) => handleFileChange(e.target.files?.[0])}
        className="sr-only"
      />

      {/* Preview or Dropzone State */}
      {selectedImage ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-900 flex justify-center items-center max-h-64">
            <img
              src={selectedImage.previewUrl}
              alt="Preview of uploaded campus issue photo"
              className="object-contain max-h-64 w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-1">
            <div className="truncate font-medium text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
              <span className="truncate">{selectedImage.file.name}</span>
              <span className="text-slate-500 text-[11px]">({formatFileSize(selectedImage.file.size)})</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                aria-label="Choose a different photo to replace current photo"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 transition text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                aria-label="Remove selected photo"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 font-semibold rounded-lg border border-red-200 transition text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Select an optional photo for issue report"
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 block">
            Click to upload photo or drag and drop
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            JPEG, PNG, or WebP up to 5 MB
          </span>
        </div>
      )}
    </div>
  );
};
