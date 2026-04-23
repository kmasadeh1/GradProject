'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WaiverModal({ risk, onClose, onSuccess }) {
  const [justification, setJustification] = useState('');
  const [expiration, setExpiration] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setFormError('Not authenticated.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/risks/exceptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ risk_id: risk.id, justification, expiration })
      });

      if (res.ok) {
        onSuccess?.();
      } else if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Permission Denied', type: 'error' } }));
        setFormError('Permission Denied.');
      } else {
         const contentType = res.headers.get("content-type");
         if (contentType && contentType.indexOf("application/json") !== -1) {
             const data = await res.json();
             setFormError(data.error || 'Failed to submit waiver.');
         } else {
             setFormError('Failed to submit waiver.');
         }
      }
    } catch (err) {
      console.error(err);
      setFormError('Network error.');
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
                <h2 className="text-xl font-bold text-gray-900">Request Waiver</h2>
                <p className="text-sm text-gray-500 mt-1">For risk: {risk.title}</p>
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <form className="px-8 pb-8" onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Justification</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why this risk should be waived..."
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-gray-400 min-h-[100px]"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date</label>
              <input
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              />
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-2">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-sm mt-0.5 flex-shrink-0"></i>
                <span className="text-sm text-red-700">{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Submitting…</>
                ) : (
                  <><i className="fa-solid fa-paper-plane mr-2"></i> Submit Request</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
