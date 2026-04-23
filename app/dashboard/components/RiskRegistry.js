'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import RiskModal from './RiskModal';
import WaiverModal from './WaiverModal';
import ExceptionManagement from './ExceptionManagement';

export default function RiskRegistry({ userRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [selectedRiskForWaiver, setSelectedRiskForWaiver] = useState(null);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchRisks() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/risks', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRisks(data);
      }
    } catch (err) {
      console.error('Failed to fetch risks', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (risk) => {
    setSelectedRisk(risk);
    setIsModalOpen(true);
  };

  const handleDelete = async (risk) => {
    if (!window.confirm(`Are you sure you want to delete "${risk.title}"?`)) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const res = await fetch(`/api/risks/${risk.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRisks();
      } else if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Permission Denied', type: 'error' } }));
      } else {
        alert(`Failed to delete risk (${res.status})`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting risk.');
    }
  };
  useEffect(() => { fetchRisks(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3">
             <h2 className="text-2xl font-bold text-gray-800">Risk Registry</h2>
             <button onClick={fetchRisks} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded transition" title="Refresh Risk Table">
                <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
             </button>
          </div>
          <p className="text-gray-500 text-sm mt-1">Quantitative risk analysis and management</p>
        </div>
        <button
            id="btn-add-risk"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <i className="fa-solid fa-plus mr-2"></i> Add New Risk
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-sm"></i>
            <input type="text" id="riskSearch" placeholder="Search risks..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600" id="risk-table">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Risk ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">JNCSF Capability</th>
                <th className="px-6 py-4">Likelihood</th>
                <th className="px-6 py-4">Impact</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100" id="tableBody">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">Loading risks...</td></tr>
              ) : risks.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8">No risks found.</td></tr>
              ) : (
                risks.map((risk) => {
                  let badgeClasses = 'bg-gray-100 text-gray-800';
                  // Fallback compute if backend doesn't provide severity_level
                  const severity = risk.severity_level || (risk.likelihood * risk.impact >= 15 ? 'Critical' : risk.likelihood * risk.impact >= 10 ? 'High' : risk.likelihood * risk.impact >= 5 ? 'Medium' : 'Low');
                  
                  if (severity === 'Low') badgeClasses = 'bg-green-100 text-green-800';
                  else if (severity === 'Medium') badgeClasses = 'bg-yellow-100 text-yellow-800';
                  else if (severity === 'High') badgeClasses = 'bg-orange-100 text-orange-800';
                  else if (severity === 'Critical') badgeClasses = 'bg-red-100 text-red-800';

                  return (
                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{risk.id?.split('-')[0]}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{risk.title}</td>
                      <td className="px-6 py-4">{risk.jncsf_capability}</td>
                      <td className="px-6 py-4">{risk.likelihood || '-'}</td>
                      <td className="px-6 py-4">{risk.impact || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
                          {severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => { setSelectedRiskForWaiver(risk); setIsWaiverModalOpen(true); }}
                            className="text-gray-400 hover:text-purple-600 transition p-1 mr-1"
                            title="Request Waiver"
                          >
                            <i className="fa-solid fa-file-shield"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(risk)}
                            className="text-gray-400 hover:text-blue-600 transition p-1 mr-1"
                            title="Edit risk"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(risk)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Delete risk"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div id="empty-state" className={`${!loading && risks.length === 0 ? '' : 'hidden'} py-16 text-center`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <i className="fa-solid fa-shield-halved text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No risks registered</h3>
          <p className="text-gray-400 text-sm mb-4">Add your first quantitative risk assessment to get started.</p>
          {userRole !== 'Viewer' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add New Risk
            </button>
          )}
        </div>
      </div>

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
          onSuccess={() => { setIsWaiverModalOpen(false); setSelectedRiskForWaiver(null); window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Waiver requested successfully', type: 'success' } })); }}
        />
      )}

      <ExceptionManagement userRole={userRole} />
    </div>
  );
}
