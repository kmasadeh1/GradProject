'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ComplianceModal from './ComplianceModal';

export default function ComplianceManagement({ userRole }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState(null);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchControls() {
    try {
      const res = await fetch('/api/compliance');
      if (res.ok) {
        const data = await res.json();
        setControls(data);
      }
    } catch (err) {
      console.error('Failed to fetch compliance controls', err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (ctrl) => {
    setSelectedControl(ctrl);
    setIsModalOpen(true);
  };

  const handleDelete = async (ctrl) => {
    if (!window.confirm(`Are you sure you want to delete "${ctrl.control_name}"?`)) return;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const res = await fetch(`http://localhost:3000/api/controls/${ctrl.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchControls();
      } else if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Permission Denied', type: 'error' } }));
      } else {
        alert(`Failed to delete control (${res.status})`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting control.');
    }
  };

  useEffect(() => {
    fetchControls();
  }, []);

  const totalControls = controls.length;
  const compliantCount = controls.filter(c => c.is_compliant).length;
  const nonCompliantCount = totalControls - compliantCount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Compliance Controls</h2>
          <p className="text-gray-500 text-sm">Map and monitor S.E.L.E.C.T compliance controls</p>
        </div>
          <button
            id="btn-add-compliance"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <i className="fa-solid fa-plus mr-2"></i> Add New Control
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Controls</p>
            <h3 className="text-2xl font-bold mt-1">{totalControls}</h3>
          </div>
          <div className="p-2 bg-teal-50 rounded-lg text-teal-600 h-10 w-10 flex items-center justify-center">
            <i className="fa-solid fa-clipboard-check"></i>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Compliant</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-600">{compliantCount}</h3>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 h-10 w-10 flex items-center justify-center">
            <i className="fa-solid fa-circle-check"></i>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Non-Compliant</p>
            <h3 className="text-2xl font-bold mt-1 text-red-600">{nonCompliantCount}</h3>
          </div>
          <div className="p-2 bg-red-50 rounded-lg text-red-600 h-10 w-10 flex items-center justify-center">
            <i className="fa-solid fa-circle-xmark"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-sm"></i>
            <input type="text" id="complianceSearch" placeholder="Search controls..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Control Name</th>
                <th className="px-6 py-4">S.E.L.E.C.T Principle</th>
                <th className="px-6 py-4">Linked Risk</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading controls...</td></tr>
              ) : controls.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">No controls found.</td></tr>
              ) : (
                controls.map((ctrl) => (
                  <tr key={ctrl.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{ctrl.control_name}</td>
                    <td className="px-6 py-4">{ctrl.select_principle}</td>
                    <td className="px-6 py-4 text-gray-500">{ctrl.risk_title || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-4">
                      {ctrl.is_compliant ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Compliant</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Non-Compliant</span>
                      )}
                    </td>
                      <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(ctrl)}
                            className="text-gray-400 hover:text-teal-600 transition p-1 mr-1"
                            title="Edit control"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(ctrl)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Delete control"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && controls.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <i className="fa-solid fa-clipboard-check text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No compliance controls</h3>
            <p className="text-gray-400 text-sm mb-4">Add your first compliance control mapping to get started.</p>
            {userRole !== 'Viewer' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                <i className="fa-solid fa-plus mr-1"></i> Add New Control
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ComplianceModal
          initialData={selectedControl}
          onClose={() => { setIsModalOpen(false); setSelectedControl(null); }}
          onSuccess={() => { setIsModalOpen(false); setSelectedControl(null); fetchControls(); }}
        />
      )}
    </div>
  );
}
