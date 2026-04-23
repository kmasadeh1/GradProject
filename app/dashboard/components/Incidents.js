'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Incidents({ userRole }) {
  const [incidents, setIncidents] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    risk_id: ''
  });

  const fetchIncidents = async (token) => {
    try {
      const res = await fetch('/api/incidents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(Array.isArray(data) ? data : (data.incidents || []));
      }
    } catch (err) {
      console.error('Failed to fetch incidents', err);
    }
  };

  const fetchRisks = async (token) => {
    try {
      const res = await fetch('/api/risks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Handle both raw array and { risks: [...] } shapes
        setRisks(Array.isArray(data) ? data : (data.risks || []));
      }
    } catch (err) {
      console.error('Failed to fetch risks', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) setLoading(false);
          return;
        }
        
        await Promise.all([
          fetchIncidents(session.access_token),
          fetchRisks(session.access_token)
        ]);
        
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    
    return () => { isMounted = false; };
  }, []); // <--- empty array: runs EXACTLY ONCE

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: 'Open',
      };
      
      if (formData.risk_id) {
        payload.related_risk_id = formData.risk_id;
      }
      
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        // Re-fetch live data from backend to confirm and display the new incident
        await fetchIncidents(session?.access_token);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Incident reported successfully', type: 'success' } }));
        setIsModalOpen(false);
        setFormData({ title: '', description: '', severity: 'Medium', risk_id: '' });
      } else {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: data.error || 'Failed to report', type: 'error' } }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    // Optimistically update UI so card moves columns immediately
    setIncidents(prev => prev.map(inc =>
      inc.id === incidentId ? { ...inc, status: newStatus } : inc
    ));

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/incidents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id: incidentId, status: newStatus })
      });
      
      if (res.ok) {
        // Re-fetch live data from backend to confirm the update
        await fetchIncidents(session?.access_token);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Incident moved to ${newStatus}`, type: 'success' } }));
      } else {
        // Revert optimistic update on failure by re-fetching real state
        await fetchIncidents(session?.access_token);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to update status', type: 'error' } }));
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderColumn = (status, title, icon, colorClass) => {
    const columnIncidents = incidents.filter(i => i.status === status);
    
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col h-full shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <i className={`fa-solid ${icon} ${colorClass}`}></i>
            <h3 className="font-bold text-gray-700">{title}</h3>
          </div>
          <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded shadow-sm border border-gray-100">
            {columnIncidents.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {columnIncidents.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
              No incidents
            </div>
          ) : (
            columnIncidents.map(inc => (
              <div key={inc.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight pr-2">{inc.title}</h4>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border flex-shrink-0 ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity}
                  </span>
                </div>
                
                {inc.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{inc.description}</p>
                )}
                
                {inc.risk_title && (
                  <div className="text-[11px] text-gray-600 mb-3 flex items-start bg-gray-50 p-1.5 rounded border border-gray-100">
                    <i className="fa-solid fa-link text-gray-400 mt-0.5 mr-1.5"></i>
                    <span className="line-clamp-1 flex-1">Related: {inc.risk_title}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 flex items-center">
                    <i className="fa-regular fa-clock mr-1"></i>
                    {new Date(inc.created_at).toLocaleDateString()}
                  </span>
                  
                  {/* Status dropdown — changes column instantly */}
                  <select
                    value={inc.status}
                    onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                    className="text-[10px] font-semibold border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-600 cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                  >
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
             <i className="fa-solid fa-spinner fa-spin text-xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-end mb-2 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Incident Response</h2>
          <p className="text-gray-500 text-sm">Track, manage, and resolve security incidents</p>
        </div>
        
        <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition flex items-center"
          >
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
            Report Incident
          </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 pb-4">
        {renderColumn('Open', 'Open Incidents', 'fa-fire', 'text-red-500')}
        {renderColumn('Investigating', 'Under Investigation', 'fa-magnifying-glass', 'text-blue-500')}
        {renderColumn('Resolved', 'Resolved', 'fa-shield-halved', 'text-emerald-500')}
      </div>

      {/* Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center">
                <i className="fa-solid fa-triangle-exclamation text-red-500 mr-2"></i>
                Report Security Incident
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Incident Title <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm"
                    placeholder="E.g., Unauthorized Access Attempt"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm resize-none"
                    placeholder="Provide details about the incident..."
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Severity <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Related Risk (Optional)</label>
                    <select 
                      value={formData.risk_id}
                      onChange={(e) => setFormData({...formData, risk_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm"
                    >
                      <option value="">None</option>
                      {risks.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Reporting...</>
                  ) : (
                    'Report Incident'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
