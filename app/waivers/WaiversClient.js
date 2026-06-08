'use client';

import { useState, useEffect } from 'react';

const STATUS_BADGE = {
  Pending:  'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Denied:   'bg-red-100 text-red-800',
};

function formatDate(dateStr) {
  if (!dateStr) return <span className="text-gray-400 italic">—</span>;
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
}

export default function WaiversClient() {
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  async function fetchWaivers() {
    try {
      const res = await fetch('/api/risks/exceptions');
      if (res.status === 403) { setAccessDenied(true); return; }
      if (!res.ok) { showToast('Failed to load waiver requests.', 'error'); return; }
      setWaivers(await res.json());
    } catch {
      showToast('Network error while loading waivers.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWaivers(); }, []);

  async function handleAction(waiverId, status) {
    setActioningId(`${waiverId}-${status}`);
    try {
      const res = await fetch('/api/risks/exceptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exception_id: waiverId, status }),
      });
      if (res.status === 403) { showToast('Access denied.', 'error'); return; }
      if (!res.ok) { showToast(`Failed to ${status.toLowerCase()} waiver.`, 'error'); return; }
      showToast(`Waiver ${status.toLowerCase()} successfully.`);
      await fetchWaivers();
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setActioningId(null);
    }
  }

  function formatRequester(waiver) {
    if (waiver.requester_email) return waiver.requester_email;
    const id = waiver.requested_by || waiver.user_id;
    if (id) return `${id.slice(0, 8)}…`;
    return <span className="text-gray-400 italic">—</span>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <i className="fa-solid fa-spinner fa-spin text-gray-400 text-2xl"></i>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <i className="fa-solid fa-lock text-red-400 text-4xl"></i>
        <p className="text-gray-700 font-semibold text-lg">Access denied.</p>
        <p className="text-gray-400 text-sm">You do not have permission to view waiver requests.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Waiver Requests</h2>
        <p className="text-gray-500 text-sm mt-1">Review and action risk exception requests submitted by users.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">{waivers.length} waiver request{waivers.length !== 1 ? 's' : ''}</p>
        </div>

        {waivers.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            <i className="fa-solid fa-file-shield text-3xl mb-3 block text-gray-200"></i>
            No waiver requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Risk</th>
                  <th className="px-6 py-3">Justification</th>
                  <th className="px-6 py-3">Expiration</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Requested By</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {waivers.map((waiver) => (
                  <tr key={waiver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 max-w-[180px]">
                      {waiver.risks?.title || (
                        <span className="text-gray-400 text-xs font-mono">{waiver.risk_id?.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-[240px]">
                      <span className="line-clamp-2">{waiver.justification}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {formatDate(waiver.expiration_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[waiver.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {waiver.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{formatRequester(waiver)}</td>
                    <td className="px-6 py-4">
                      {waiver.status === 'Pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actioningId !== null}
                            onClick={() => handleAction(waiver.id, 'Approved')}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            {actioningId === `${waiver.id}-Approved`
                              ? <i className="fa-solid fa-spinner fa-spin"></i>
                              : <i className="fa-solid fa-check"></i>}
                            Approve
                          </button>
                          <button
                            disabled={actioningId !== null}
                            onClick={() => handleAction(waiver.id, 'Denied')}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            {actioningId === `${waiver.id}-Denied`
                              ? <i className="fa-solid fa-spinner fa-spin"></i>
                              : <i className="fa-solid fa-xmark"></i>}
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
