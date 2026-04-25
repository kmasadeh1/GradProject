'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ComplianceModal from './ComplianceModal';

// ---------------------------------------------------------------------------
// Helpers — purely presentational, no math
// ---------------------------------------------------------------------------

/** Maps a status string from the backend to a Tailwind badge class. */
function getStatusBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'compliant':
    case 'implemented':
      return 'bg-emerald-100 text-emerald-800';
    case 'partial':
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'non-compliant':
    case 'not implemented':
      return 'bg-red-100 text-red-800';
    case 'not applicable':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/** Clamps a 0-100 number for use as a progress-bar width style. */
function clampPct(val) {
  const n = Number(val);
  if (!isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

// ---------------------------------------------------------------------------
// Accordion section for a single JNCF domain / SELECT principle group
// ---------------------------------------------------------------------------
function DomainSection({ domainName, controls, onEditControl, userRole }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Domain header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <span className="font-semibold text-gray-800 text-sm">{domainName}</span>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400">{controls.length} control{controls.length !== 1 ? 's' : ''}</span>
          <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-gray-400 text-xs`} />
        </div>
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {controls.map((ctrl) => (
            <div
              key={ctrl.id}
              className="flex items-start justify-between px-5 py-4 hover:bg-gray-50/60 transition group"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-gray-900 truncate">{ctrl.control_name}</p>
                {ctrl.notes && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate" title={ctrl.notes}>
                    {ctrl.notes}
                  </p>
                )}
                {ctrl.risk_title && (
                  <p className="text-xs text-teal-600 mt-1">
                    <i className="fa-solid fa-link mr-1" />
                    {ctrl.risk_title}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                {/* Status badge — value comes straight from the backend */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ctrl.status || (ctrl.is_compliant ? 'compliant' : 'non-compliant'))}`}>
                  {ctrl.status || (ctrl.is_compliant ? 'Compliant' : 'Non-Compliant')}
                </span>

                {userRole !== 'Viewer' && (
                  <button
                    onClick={() => onEditControl(ctrl)}
                    className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-teal-600 p-1"
                    title="Update control status"
                  >
                    <i className="fa-solid fa-pen-to-square text-sm" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ComplianceManagement({ userRole }) {
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedControl, setSelectedControl] = useState(null);
  const [controls, setControls]           = useState([]);
  const [scores, setScores]               = useState(null);   // overall_score, domain_scores — from backend
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');

  // ---------------------------------------------------------------------------
  // Data fetching — no math in the browser.
  // The backend returns controls[] and optionally scores{} in the payload.
  // ---------------------------------------------------------------------------
  const fetchCompliance = useCallback(async ({ query = searchQuery } = {}) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const params = new URLSearchParams();
      if (query) params.set('search', query);

      const url = `/api/compliance${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();

        // The API may return either:
        //   { controls: [...], overall_score: 72, domain_scores: {...} }
        // or a plain array (legacy). Handle both without computing anything.
        if (Array.isArray(data)) {
          setControls(data);
          setScores(null);
        } else {
          setControls(data.controls ?? []);
          setScores({
            overall_score: data.overall_score,
            domain_scores: data.domain_scores ?? {},
            summary:       data.summary ?? {},
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: err.error || `Failed to load compliance data (${res.status})`, type: 'error' },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch compliance', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error while loading compliance data.', type: 'error' },
      }));
    } finally {
      setLoading(false);
    }
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCompliance(); }, []); // initial load

  // Debounced search → backend
  useEffect(() => {
    const t = setTimeout(() => fetchCompliance({ query: searchQuery }), 400);
    return () => clearTimeout(t);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Group controls by their principle/domain — purely for display.
  // No sorting or aggregation: we use the order the backend returned.
  // ---------------------------------------------------------------------------
  const groupedByPrinciple = controls.reduce((acc, ctrl) => {
    const key = ctrl.select_principle || ctrl.jncsf_domain || 'Uncategorised';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ctrl);
    return acc;
  }, {});

  const handleEditControl = (ctrl) => {
    setSelectedControl(ctrl);
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Compliance Controls</h2>
          <p className="text-gray-500 text-sm mt-1">JNCF framework mapping and compliance monitoring</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchCompliance()}
            className="p-2 text-gray-400 hover:text-teal-600 bg-gray-100 hover:bg-teal-50 rounded-lg transition"
            title="Refresh"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} />
          </button>

          {userRole !== 'Viewer' && (
            <button
              id="btn-add-compliance"
              onClick={() => { setSelectedControl(null); setIsModalOpen(true); }}
              className="inline-flex items-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <i className="fa-solid fa-plus mr-2" /> Add Control
            </button>
          )}
        </div>
      </div>

      {/* ── Score metrics — rendered from backend payload, no math ── */}
      {scores && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Overall score */}
          <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Compliance Score</p>
                {scores.overall_score != null && (
                  <p className="text-3xl font-bold text-teal-700 mt-1">{scores.overall_score}%</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <i className="fa-solid fa-gauge-high text-teal-600 text-xl" />
              </div>
            </div>
            {scores.overall_score != null && (
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${clampPct(scores.overall_score)}%` }}
                />
              </div>
            )}
          </div>

          {/* Summary counts — from backend summary object, if present */}
          {scores.summary && (
            <>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Total Controls</p>
                  <h3 className="text-2xl font-bold mt-1">{scores.summary.total ?? controls.length}</h3>
                </div>
                <div className="p-2 bg-teal-50 rounded-lg text-teal-600 h-10 w-10 flex items-center justify-center">
                  <i className="fa-solid fa-clipboard-check" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Compliant</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-600">{scores.summary.compliant ?? '—'}</h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 h-10 w-10 flex items-center justify-center">
                  <i className="fa-solid fa-circle-check" />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Non-Compliant</p>
                  <h3 className="text-2xl font-bold mt-1 text-red-600">{scores.summary.non_compliant ?? '—'}</h3>
                </div>
                <div className="p-2 bg-red-50 rounded-lg text-red-600 h-10 w-10 flex items-center justify-center">
                  <i className="fa-solid fa-circle-xmark" />
                </div>
              </div>
            </>
          )}

          {/* Per-domain score bars — rendered from domain_scores object returned by backend */}
          {scores.domain_scores && Object.keys(scores.domain_scores).length > 0 && (
            <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Domain Scores</p>
              <div className="space-y-4">
                {Object.entries(scores.domain_scores).map(([domain, pct]) => (
                  <div key={domain}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{domain}</span>
                      <span className="text-gray-500 tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${clampPct(pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback summary cards when backend returns flat array (no scores object) */}
      {!scores && !loading && controls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Controls</p>
              <h3 className="text-2xl font-bold mt-1">{controls.length}</h3>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600 h-10 w-10 flex items-center justify-center">
              <i className="fa-solid fa-clipboard-check" />
            </div>
          </div>
          {/* Other cards intentionally omitted — counts require backend calculation */}
        </div>
      )}

      {/* ── Controls accordion ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">

        {/* Search toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              id="complianceSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search controls…"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-2" />Loading controls…
            </div>
          ) : controls.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <i className="fa-solid fa-clipboard-check text-2xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No compliance controls</h3>
              <p className="text-gray-400 text-sm mb-4">
                {searchQuery ? 'No controls match your search.' : 'Add your first compliance control mapping to get started.'}
              </p>
              {!searchQuery && userRole !== 'Viewer' && (
                <button
                  onClick={() => { setSelectedControl(null); setIsModalOpen(true); }}
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                >
                  <i className="fa-solid fa-plus mr-1" /> Add Control
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupedByPrinciple).map(([domain, domainControls]) => (
              <DomainSection
                key={domain}
                domainName={domain}
                controls={domainControls}
                onEditControl={handleEditControl}
                userRole={userRole}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────── */}
      {isModalOpen && (
        <ComplianceModal
          initialData={selectedControl}
          onClose={() => { setIsModalOpen(false); setSelectedControl(null); }}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedControl(null);
            fetchCompliance();
          }}
        />
      )}
    </div>
  );
}
