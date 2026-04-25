'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RiskModal({ onClose, onSuccess, initialData = null }) {
  const isEdit = !!initialData?.id;

  // Form state — raw inputs only. No derived values computed here.
  const [title, setTitle]             = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [capability, setCapability]   = useState(initialData?.jncsf_capability || '');
  const [likelihood, setLikelihood]   = useState(initialData?.likelihood || 1);
  const [impact, setImpact]           = useState(initialData?.impact || 1);
  const [formError, setFormError]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // ---------------------------------------------------------------------------
  // Submit — sends raw form data to the backend.
  // Score calculation and risk_level determination happen server-side.
  // We only display what the backend response contains.
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setFormError('Not authenticated. Please log in again.');
      setSubmitting(false);
      return;
    }

    const payload = {
      title,
      description,
      jncsf_capability: capability,
      likelihood: Number(likelihood),
      impact: Number(impact),
    };

    const url    = isEdit ? `/api/risks/${initialData.id}` : '/api/risks';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // The backend response contains the saved object with inherent_risk_score
        // and risk_level already calculated. onSuccess triggers a table refresh,
        // which will re-fetch and display the server values.
        onSuccess?.();
      } else {
        // Surface the error message exactly as the backend provides it.
        const contentType = res.headers.get('content-type') || '';
        const errorMsg = contentType.includes('application/json')
          ? (await res.json()).error
          : `Server error: ${res.status} ${res.statusText}`;

        if (res.status === 403) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'Permission Denied', type: 'error' },
          }));
        }
        setFormError(errorMsg || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error: could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEdit ? 'Edit Risk' : 'Add New Risk'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEdit ? 'Update the risk assessment details' : 'Quantitative risk assessment entry'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form className="px-8 pb-8" onSubmit={handleSubmit}>

            {/* Title */}
            <div className="mb-5">
              <label htmlFor="risk-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Risk Title
              </label>
              <input
                type="text"
                id="risk-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Breach Vulnerability"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-gray-400"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label htmlFor="risk-description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="risk-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the nature of the risk…"
                rows={3}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* JNCSF Capability */}
            <div className="mb-5">
              <label htmlFor="risk-capability" className="block text-sm font-semibold text-gray-700 mb-2">
                JNCSF Capability
              </label>
              <div className="relative">
                <select
                  id="risk-capability"
                  value={capability}
                  onChange={(e) => setCapability(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>Select a capability…</option>
                  <option value="Architecture & Portfolio">Architecture &amp; Portfolio</option>
                  <option value="Development">Development</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Operations">Operations</option>
                  <option value="Fundamental Capabilities">Fundamental Capabilities</option>
                  <option value="National Cyber Responsibility">National Cyber Responsibility</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                </div>
              </div>
            </div>

            {/* Likelihood & Impact — raw dropdowns, no derived value shown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="risk-likelihood" className="block text-sm font-semibold text-gray-700 mb-2">
                  Likelihood (1–5)
                </label>
                <div className="relative">
                  <select
                    id="risk-likelihood"
                    value={likelihood}
                    onChange={(e) => setLikelihood(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition appearance-none bg-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Probability of occurrence</p>
              </div>

              <div>
                <label htmlFor="risk-impact" className="block text-sm font-semibold text-gray-700 mb-2">
                  Impact (1–5)
                </label>
                <div className="relative">
                  <select
                    id="risk-impact"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition appearance-none bg-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Severity of consequences</p>
              </div>
            </div>

            {/* Info note — clarifies that score is calculated server-side */}
            <div className="flex items-start space-x-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-xs text-blue-600">
              <i className="fa-solid fa-circle-info mt-0.5 flex-shrink-0" />
              <span>
                The inherent risk score and risk level are calculated by the server after submission.
              </span>
            </div>

            {/* Error banner — raw message from backend, no custom parsing */}
            {formError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-2">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-700">{formError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving…</>
                ) : isEdit ? (
                  <><i className="fa-solid fa-floppy-disk mr-2" />Save Changes</>
                ) : (
                  <><i className="fa-solid fa-plus mr-2" />Add Risk</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
