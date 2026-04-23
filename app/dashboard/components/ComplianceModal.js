'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ComplianceModal({ onClose, onSuccess, initialData = null }) {
  const isEdit = !!initialData?.id;
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [controlName, setControlName] = useState(initialData?.control_name || '');
  const [riskId, setRiskId] = useState(initialData?.risk_id || initialData?.linked_risk_id || '');
  const [principle, setPrinciple] = useState(initialData?.select_principle || '');
  const [isCompliant, setIsCompliant] = useState(initialData?.is_compliant ?? true);
  const [risks, setRisks] = useState([]);
  const [loadingRisks, setLoadingRisks] = useState(true);

  // Fetch risks for the Linked Risk dropdown (with Authorization header)
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          setFormError('Not authenticated. Please log in again.');
          setLoadingRisks(false);
          return;
        }

        const res = await fetch('/api/risks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setRisks(data);
        } else {
          console.error('Failed to load risks for dropdown:', res.status);
        }
      } catch (err) {
        console.error('Network error loading risks:', err);
      } finally {
        setLoadingRisks(false);
      }
    };

    fetchRisks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const payload = {
      control_name: controlName,
      risk_id: riskId || null,
      select_principle: principle,
      is_compliant: isCompliant,
    };

    // Retrieve active session JWT before sending
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setFormError('Not authenticated. Please log in again.');
      setSubmitting(false);
      return;
    }

    const url = isEdit
      ? `/api/controls/${initialData.id}`
      : '/api/controls';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      console.log(`Control ${method} raw response:`, res);

      if (res.ok) {
        onSuccess?.();
      } else if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Permission Denied', type: 'error' } }));
        setFormError('Permission Denied.');
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          console.error('API Error Response:', errorData.error);
          setFormError(errorData.error || 'An unexpected error occurred.');
        } else {
          setFormError(`Server error: ${res.status} ${res.statusText}`);
        }
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error: could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEdit ? 'Edit Compliance Control' : 'Add Compliance Control'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Map a control to a S.E.L.E.C.T principle</p>
              </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <form id="addComplianceForm" className="px-8 pb-8" onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="compliance-name" className="block text-sm font-semibold text-gray-700 mb-2">Control Name</label>
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

            <div className="mb-5">
              <label htmlFor="compliance-risk" className="block text-sm font-semibold text-gray-700 mb-2">Linked Risk</label>
              <div className="relative">
                <select
                  id="compliance-risk"
                  value={riskId}
                  onChange={(e) => setRiskId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    {loadingRisks ? 'Loading risks…' : 'Select a risk...'}
                  </option>
                  {risks.map((risk) => (
                    <option key={risk.id} value={risk.id}>{risk.title}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <i className={`fa-solid ${loadingRisks ? 'fa-spinner fa-spin' : 'fa-chevron-down'} text-gray-400 text-xs`}></i>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Link this control to an existing risk assessment</p>
            </div>

            <div className="mb-5">
              <label htmlFor="compliance-principle" className="block text-sm font-semibold text-gray-700 mb-2">S.E.L.E.C.T Principle</label>
              <div className="relative">
                <select
                  id="compliance-principle"
                  value={principle}
                  onChange={(e) => setPrinciple(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>Select a principle...</option>
                  <option value="Strategic">Strategic</option>
                  <option value="Enterprise Driven">Enterprise Driven</option>
                  <option value="Livable">Livable</option>
                  <option value="Economical">Economical</option>
                  <option value="Capability Based">Capability Based</option>
                  <option value="Trustable">Trustable</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Compliance Status</label>
              <div className="flex items-center space-x-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="compliance-status"
                    checked={isCompliant}
                    onChange={(e) => setIsCompliant(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span className="text-sm font-medium" id="compliance-status-label">Compliant</span>
              </div>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-2">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
                <span className="text-sm text-red-700">{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-compliance"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Saving…</>
                ) : isEdit ? (
                  <><i className="fa-solid fa-floppy-disk mr-2"></i> Save Changes</>
                ) : (
                  <><i className="fa-solid fa-plus mr-2"></i> Add Control</>
                )}
              </button>
            </div>
          </form>

          <div id="compliance-upload-section" className="hidden px-8 pb-8">
            <div className="flex items-center mb-4">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center mr-3">
                <i className="fa-solid fa-circle-check text-emerald-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Control Created Successfully</h3>
                <p className="text-sm text-gray-500">Attach supporting evidence (optional)</p>
              </div>
            </div>

            <div id="compliance-dropzone" className="evidence-dropzone border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-200" data-entity-type="compliance">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 mb-3">
                <i className="fa-solid fa-cloud-arrow-up text-lg text-gray-400"></i>
              </div>
              <p className="text-sm text-gray-600 font-medium">Drag & drop supporting documentation here, or click to select files</p>
              <p className="text-xs text-gray-400 mt-1.5"><i className="fa-regular fa-file mr-1"></i>PDF, DOCX, PNG, JPG accepted</p>
              <input type="file" id="compliance-file-input" className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg" />
            </div>

            <div id="compliance-upload-progress" className="hidden mt-4">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-spinner fa-spin text-teal-600"></i>
                <span className="text-sm text-gray-600" id="compliance-upload-filename">Uploading…</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div id="compliance-upload-bar" className="h-full bg-teal-600 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
              </div>
            </div>

            <div id="compliance-uploaded-files" className="mt-3 space-y-2"></div>

            <div className="mt-6 flex justify-end">
              <button type="button" id="btn-done-compliance-upload" className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 inline-flex items-center">
                <i className="fa-solid fa-check mr-2"></i> Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
