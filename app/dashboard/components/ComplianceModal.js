'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Status options are static display values.
// The backend determines what is valid and returns errors if the value is wrong.
const STATUS_OPTIONS = [
  { value: 'Compliant',        label: 'Compliant' },
  { value: 'Non-Compliant',    label: 'Non-Compliant' },
  { value: 'Partial',          label: 'Partial' },
  { value: 'In Progress',      label: 'In Progress' },
  { value: 'Not Applicable',   label: 'Not Applicable' },
  { value: 'Implemented',      label: 'Implemented' },
  { value: 'Not Implemented',  label: 'Not Implemented' },
];

export default function ComplianceModal({ onClose, onSuccess, initialData = null }) {
  const isEdit = !!initialData?.id;

  // ── Form state — raw inputs only, no derived values ──────────────
  const [controlName, setControlName] = useState(initialData?.control_name || '');
  const [riskId, setRiskId]           = useState(initialData?.risk_id || initialData?.linked_risk_id || '');
  const [principle, setPrinciple]     = useState(initialData?.select_principle || '');
  // Status is the key field for updates; initialise from backend field
  const [status, setStatus]           = useState(
    initialData?.status ||
    (initialData?.is_compliant === true ? 'Compliant' : initialData?.is_compliant === false ? 'Non-Compliant' : '')
  );
  const [notes, setNotes]             = useState(initialData?.notes || '');

  const [risks, setRisks]             = useState([]);
  const [loadingRisks, setLoadingRisks] = useState(true);
  const [formError, setFormError]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // ── Fetch risks for the linked-risk dropdown ──────────────────────
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setLoadingRisks(false); return; }

        const res = await fetch('/api/risks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setRisks(await res.json());
      } catch (err) {
        console.error('Network error loading risks:', err);
      } finally {
        setLoadingRisks(false);
      }
    };
    fetchRisks();
  }, []);

  // ── Submit — sends raw form data. Score/status recalculation is server-side.
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

    // Payload — raw form values, no derived calculations
    const payload = isEdit
      ? { status, notes }                                            // update: only status & notes
      : { control_name: controlName, risk_id: riskId || null,       // create: full fields
          select_principle: principle, status, notes };

    // Route: spec says POST/PUT /api/compliance/controls/[id]
    // Fallback to /api/compliance for creation if the sub-route doesn't exist yet
    const url    = isEdit ? `/api/compliance/controls/${initialData.id}` : '/api/compliance/controls';
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
        // The backend response contains the saved object with any recalculated
        // scores. We hand off to onSuccess which triggers a full re-fetch so
        // the UI shows the backend's exact numbers — no optimistic updates.
        onSuccess?.();
      } else {
        // Surface the exact error string from the backend payload
        const contentType = res.headers.get('content-type') || '';
        const errorMsg = contentType.includes('application/json')
          ? (await res.json()).error
          : `Server error: ${res.status} ${res.statusText}`;

        if (res.status === 403) {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'Permission Denied', type: 'error' },
          }));
        } else {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: errorMsg || 'An unexpected error occurred.', type: 'error' },
          }));
        }
        setFormError(errorMsg || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error: could not reach the server.');
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error: could not reach the server.', type: 'error' },
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
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
                  {isEdit ? 'Update Control Status' : 'Add Compliance Control'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEdit
                    ? `Updating: ${initialData?.control_name}`
                    : 'Map a new control to the JNCF framework'}
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

          <form id="addComplianceForm" className="px-8 pb-8" onSubmit={handleSubmit}>

            {/* ── Create-only fields ───────────────────────────────── */}
            {!isEdit && (
              <>
                <div className="mb-5">
                  <label htmlFor="compliance-name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Control Name
                  </label>
                  <input
                    type="text"
                    id="compliance-name"
                    value={controlName}
                    onChange={(e) => setControlName(e.target.value)}
                    placeholder="e.g., Access Control Policy"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition placeholder:text-gray-400"
                  />
                </div>

                {/* Linked risk */}
                <div className="mb-5">
                  <label htmlFor="compliance-risk" className="block text-sm font-semibold text-gray-700 mb-2">
                    Linked Risk <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      id="compliance-risk"
                      value={riskId}
                      onChange={(e) => setRiskId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition appearance-none bg-white cursor-pointer"
                    >
                      <option value="">
                        {loadingRisks ? 'Loading risks…' : 'None (unlinked)'}
                      </option>
                      {risks.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <i className={`fa-solid ${loadingRisks ? 'fa-spinner fa-spin' : 'fa-chevron-down'} text-gray-400 text-xs`} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Link this control to an existing risk assessment</p>
                </div>

                {/* JNCF Principle / Domain */}
                <div className="mb-5">
                  <label htmlFor="compliance-principle" className="block text-sm font-semibold text-gray-700 mb-2">
                    JNCF / S.E.L.E.C.T Principle
                  </label>
                  <div className="relative">
                    <select
                      id="compliance-principle"
                      value={principle}
                      onChange={(e) => setPrinciple(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition appearance-none bg-white cursor-pointer"
                    >
                      <option value="" disabled>Select a principle…</option>
                      <option value="Strategic">Strategic</option>
                      <option value="Enterprise Driven">Enterprise Driven</option>
                      <option value="Livable">Livable</option>
                      <option value="Economical">Economical</option>
                      <option value="Capability Based">Capability Based</option>
                      <option value="Trustable">Trustable</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Status dropdown (shown for both create and update) ── */}
            <div className="mb-5">
              <label htmlFor="compliance-status" className="block text-sm font-semibold text-gray-700 mb-2">
                Compliance Status
              </label>
              <div className="relative">
                <select
                  id="compliance-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>Select status…</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                </div>
              </div>
            </div>

            {/* ── Notes textarea ─────────────────────────────────────── */}
            <div className="mb-6">
              <label htmlFor="compliance-notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="compliance-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any observations, remediation steps, or context…"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Info — clarifies that scores are server-side */}
            <div className="flex items-start space-x-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-5 text-xs text-teal-700">
              <i className="fa-solid fa-circle-info mt-0.5 flex-shrink-0" />
              <span>
                Compliance scores and pass/fail aggregations are calculated by the server after submission. The dashboard will reflect the updated values once the API responds.
              </span>
            </div>

            {/* Error banner — exact string from backend */}
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
                id="btn-submit-compliance"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving…</>
                ) : isEdit ? (
                  <><i className="fa-solid fa-floppy-disk mr-2" />Save Changes</>
                ) : (
                  <><i className="fa-solid fa-plus mr-2" />Add Control</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
