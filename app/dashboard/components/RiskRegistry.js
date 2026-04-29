'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import RiskModal from './RiskModal';
import WaiverModal from './WaiverModal';
import ExceptionManagement from './ExceptionManagement';

// Maps the risk_level string returned by the backend to a badge colour class.
// No score calculation happens here — we purely style what the server tells us.
function getRiskLevelBadgeClass(level) {
  switch ((level || '').toLowerCase()) {
    case 'low':      return 'bg-green-100 text-green-800';
    case 'medium':   return 'bg-yellow-100 text-yellow-800';
    case 'high':     return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default:         return 'bg-gray-100 text-gray-600';
  }
}

export default function RiskRegistry({ userRole }) {
  const [isModalOpen, setIsModalOpen]               = useState(false);
  const [isWaiverModalOpen, setIsWaiverModalOpen]   = useState(false);
  const [selectedRisk, setSelectedRisk]             = useState(null);
  const [selectedRiskForWaiver, setSelectedRiskForWaiver] = useState(null);
  const [risks, setRisks]                           = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [searchQuery, setSearchQuery]               = useState('');
  const [sortField, setSortField]                   = useState('');
  const [sortDir, setSortDir]                       = useState('asc');

  // ---------------------------------------------------------------------------
  // Data fetching — all filtering & sorting delegated to the backend via query
  // params. The UI never touches the array directly.
  // ---------------------------------------------------------------------------
  const fetchRisks = useCallback(async ({ query = searchQuery, field = sortField, dir = sortDir } = {}) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (field) params.set('sort', field);
      if (field) params.set('dir', dir);

      const url = `/api/risks${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setRisks(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: errorData.error || `Failed to load risks (${res.status})`, type: 'error' },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch risks', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error while loading risks.', type: 'error' },
      }));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortField, sortDir]);

  useEffect(() => { fetchRisks(); }, []);  // initial load

  // ---------------------------------------------------------------------------
  // Search — debounced, sends the query string to the backend
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => fetchRisks({ query: searchQuery }), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Sort — clicking a header sends the field + direction to the backend
  // ---------------------------------------------------------------------------
  function handleSort(field) {
    const newDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDir(newDir);
    fetchRisks({ field, dir: newDir });
  }

  function SortIcon({ field: f }) {
    if (sortField !== f) return <i className="fa-solid fa-sort ml-1 text-gray-300 text-xs" />;
    return sortDir === 'asc'
      ? <i className="fa-solid fa-sort-up ml-1 text-blue-500 text-xs" />
      : <i className="fa-solid fa-sort-down ml-1 text-blue-500 text-xs" />;
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  const handleDelete = async (risk) => {
    if (!window.confirm(`Are you sure you want to delete "${risk.title}"?`)) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const res = await fetch(`/api/risks/${risk.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchRisks();
      } else {
        const errorData = await res.json().catch(() => ({}));
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: errorData.error || `Failed to delete risk (${res.status})`, type: 'error' },
        }));
      }
    } catch (err) {
      console.error('Delete error:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error while deleting risk.', type: 'error' },
      }));
    }
  };

  const handleEdit = (risk) => {
    setSelectedRisk(risk);
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-800">Risk Registry</h2>
            <button
              onClick={() => fetchRisks()}
              className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded transition"
              title="Refresh Risk Table"
            >
              <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} />
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-1">Quantitative risk analysis and management</p>
        </div>

        <button
          id="btn-add-risk"
          onClick={() => { setSelectedRisk(null); setIsModalOpen(true); }}
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          style={{ display: 'block' }}
        >
          <i className="fa-solid fa-plus mr-2" /> Add New Risk
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              id="riskSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search risks…"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600" id="risk-table">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Risk ID</th>
                <th
                  className="px-6 py-4 cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort('title')}
                >
                  Title <SortIcon field="title" />
                </th>
                <th className="px-6 py-4">Description</th>
                <th
                  className="px-6 py-4 cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  className="px-6 py-4 cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort('inherent_risk_score')}
                >
                  Inherent Risk Score <SortIcon field="inherent_risk_score" />
                </th>
                <th
                  className="px-6 py-4 cursor-pointer select-none hover:text-blue-600"
                  onClick={() => handleSort('risk_level')}
                >
                  Risk Level <SortIcon field="risk_level" />
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100" id="tableBody">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin mr-2" />Loading risks…
                  </td>
                </tr>
              ) : risks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <i className="fa-solid fa-shield-halved text-2xl text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">No risks registered</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {searchQuery ? 'No risks match your search.' : 'Add your first quantitative risk assessment to get started.'}
                      </p>
                      {!searchQuery && userRole && userRole !== 'Viewer' && (
                        <button
                          onClick={() => { setSelectedRisk(null); setIsModalOpen(true); }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <i className="fa-solid fa-plus mr-1" /> Add New Risk
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                risks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                    {/* Short UUID prefix for readability */}
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      {risk.id?.split('-')[0]}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900 max-w-[180px] truncate">
                      {risk.title}
                    </td>

                    {/* Description — truncated; full text on hover via title attribute */}
                    <td className="px-6 py-4 text-gray-500 max-w-[220px] truncate" title={risk.description}>
                      {risk.description || <span className="text-gray-300 italic">—</span>}
                    </td>

                    <td className="px-6 py-4 capitalize">
                      {risk.status || <span className="text-gray-300 italic">—</span>}
                    </td>

                    {/* Inherent risk score — rendered exactly as returned by the backend */}
                    <td className="px-6 py-4 font-semibold text-gray-800 tabular-nums">
                      {risk.inherent_risk_score ?? (
                        <span className="text-gray-300 italic">—</span>
                      )}
                    </td>

                    {/* Risk level badge — colour mapped from backend string, no calculation */}
                    <td className="px-6 py-4">
                      {risk.risk_level ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskLevelBadgeClass(risk.risk_level)}`}>
                          {risk.risk_level}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {userRole !== 'Viewer' && (
                        <>
                          <button
                            onClick={() => { setSelectedRiskForWaiver(risk); setIsWaiverModalOpen(true); }}
                            className="text-gray-400 hover:text-purple-600 transition p-1 mr-1"
                            title="Request Waiver"
                          >
                            <i className="fa-solid fa-file-shield" />
                          </button>
                          <button
                            onClick={() => handleEdit(risk)}
                            className="text-gray-400 hover:text-blue-600 transition p-1 mr-1"
                            title="Edit risk"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            onClick={() => handleDelete(risk)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Delete risk"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <RiskModal
          initialData={selectedRisk}
          onClose={() => { setIsModalOpen(false); setSelectedRisk(null); }}
          onSuccess={() => { setIsModalOpen(false); setSelectedRisk(null); fetchRisks(); }}
        />
      )}

      {isWaiverModalOpen && (
        <WaiverModal
          risk={selectedRiskForWaiver}
          onClose={() => { setIsWaiverModalOpen(false); setSelectedRiskForWaiver(null); }}
          onSuccess={() => {
            setIsWaiverModalOpen(false);
            setSelectedRiskForWaiver(null);
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: { message: 'Waiver requested successfully', type: 'success' },
            }));
          }}
        />
      )}

      <ExceptionManagement userRole={userRole} />
    </div>
  );
}
