'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Reusable drag-and-drop evidence upload zone.
 *
 * @param {Object} props
 * @param {number|string} props.entityId   - ID of the parent entity (risk or compliance control)
 * @param {string}        props.entityType - 'risk' | 'compliance'
 * @param {string}        [props.accent]   - Tailwind accent color prefix ('blue' | 'teal'). Default: 'blue'.
 */

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

export default function EvidenceUploadZone({ entityId, entityType, accent = 'blue' }) {
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
      formData.append('entity_id', entityId);
      formData.append('entity_type', entityType);

      try {
        // Simulated progress — XHR for real progress tracking
        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed (HTTP ${xhr.status})`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.open('POST', '/api/upload-evidence');
          xhr.send(formData);
        });

        await uploadPromise;

        setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size }]);
        setUploadState('success');

        // Reset to idle after a moment so user can upload more
        setTimeout(() => setUploadState('idle'), 2000);
      } catch (err) {
        setErrorMsg(err.message || 'Upload failed');
        setUploadState('error');
        setTimeout(() => setUploadState('idle'), 3000);
      }
    },
    [entityId, entityType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled: uploadState === 'uploading',
  });

  const accentColor = accent === 'teal' ? 'teal' : 'blue';

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      {/* Section Header */}
      <div className="flex items-center mb-3">
        <div className={`h-7 w-7 rounded-lg bg-${accentColor}-50 flex items-center justify-center mr-2.5`}>
          <i className={`fa-solid fa-paperclip text-${accentColor}-600 text-xs`}></i>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Evidence Documentation</h4>
          <p className="text-xs text-gray-400">Attach supporting files (optional)</p>
        </div>
      </div>

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

        {/* ── Idle State ── */}
        {(uploadState === 'idle' || uploadState === 'success' || uploadState === 'error') && (
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
                : 'Drag & drop supporting documentation here, or click to select files'}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              <i className="fa-regular fa-file mr-1"></i>
              PDF, DOCX, PNG, JPG accepted
            </p>
          </div>
        )}

        {/* ── Uploading State ── */}
        {uploadState === 'uploading' && (
          <div className="py-2">
            <i className={`fa-solid fa-spinner fa-spin text-${accentColor}-600 text-xl mb-3`}></i>
            <p className="text-sm text-gray-600 font-medium">Uploading…</p>
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
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 flex items-center space-x-2">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-xs"></i>
          <span className="text-xs text-red-700">{errorMsg}</span>
        </div>
      )}

      {/* ── Uploaded Files List ── */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center space-x-2.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2"
            >
              <i className="fa-solid fa-circle-check text-emerald-500 text-sm"></i>
              <span className="text-sm text-gray-700 font-medium truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-gray-400">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
