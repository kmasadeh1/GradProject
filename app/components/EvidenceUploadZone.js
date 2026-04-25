'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Reusable drag-and-drop evidence upload zone.
 * Purely presentational - all validation and processing happens on the backend.
 *
 * @param {Object} props
 * @param {string} props.controlId - ID of the compliance control to link evidence to.
 * @param {string} [props.accent]   - Tailwind accent color prefix ('blue' | 'teal'). Default: 'blue'.
 * @param {Function} [props.onSuccess] - Callback when upload completes.
 */
export default function EvidenceUploadZone({ controlId, accent = 'blue', onSuccess }) {
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      const file = acceptedFiles[0];
      setUploadState('uploading');
      setProgress(0);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('control_id', controlId);

      try {
        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              // Extract exact error string from backend response
              reject(new Error(response.error || `Upload failed (HTTP ${xhr.status})`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error')));
          
          // Strict Requirement: Post to /api/evidence/upload
          xhr.open('POST', '/api/evidence/upload');
          
          // Note: Token handling would typically be here if the API requires it, 
          // but following the "dumb layer" instruction to keep it simple.
          xhr.send(formData);
        });

        const result = await uploadPromise;

        // Display returned metadata from backend
        setUploadedFiles((prev) => [...prev, { 
          name: result.filename || file.name, 
          url: result.url,
          size: result.size || file.size 
        }]);
        
        setUploadState('success');
        if (onSuccess) onSuccess(result);

        // Reset to idle after a moment
        setTimeout(() => setUploadState('idle'), 2000);
      } catch (err) {
        // Display exact error string from backend
        setErrorMsg(err.message);
        setUploadState('error');
        
        // Show toast for better visibility
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: err.message, type: 'error' } 
        }));
      }
    },
    [controlId, onSuccess]
  );

  // Basic HTML accept attributes for UX, but no complex JS validation here.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: uploadState === 'uploading',
  });

  const accentColor = accent === 'teal' ? 'teal' : 'blue';

  return (
    <div className="mt-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${uploadState === 'uploading' ? 'pointer-events-none opacity-60' : ''}
          ${isDragActive
            ? `border-${accentColor}-400 bg-${accentColor}-50/50 scale-[1.01]`
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
          }
        `}
      >
        <input {...getInputProps()} />

        {/* ── Idle / Result States ── */}
        {uploadState !== 'uploading' && (
          <div>
            <div className={`
              inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3
              ${isDragActive ? `bg-${accentColor}-100` : 'bg-gray-100'}
              transition-colors duration-200
            `}>
              <i className={`fa-solid fa-cloud-arrow-up text-lg ${
                isDragActive ? `text-${accentColor}-600` : 'text-gray-400'
              }`}></i>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {isDragActive
                ? 'Drop your file here…'
                : 'Drag & drop evidence here, or click to select files'}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              PDF, DOCX, PNG, JPG accepted
            </p>
          </div>
        )}

        {/* ── Uploading State ── */}
        {uploadState === 'uploading' && (
          <div className="py-2">
            <i className={`fa-solid fa-spinner fa-spin text-${accentColor}-600 text-xl mb-3`}></i>
            <p className="text-sm text-gray-600 font-medium">Uploading to secure storage…</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-3 mx-auto max-w-xs overflow-hidden">
              <div
                className={`h-full bg-${accentColor}-600 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{progress}%</p>
          </div>
        )}
      </div>

      {/* ── Error Message ── */}
      {uploadState === 'error' && errorMsg && (
        <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-2 animate-pulse">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-sm mt-0.5"></i>
          <span className="text-sm text-red-700">{errorMsg}</span>
        </div>
      )}

      {/* ── Uploaded Files List (from Backend Response) ── */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attached Evidence</p>
          {uploadedFiles.map((file, i) => (
            <a
              key={i}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-sm transition group"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition">
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-semibold truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Attached'}
                </p>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square text-gray-300 text-xs group-hover:text-emerald-500"></i>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
