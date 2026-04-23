'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ExceptionManagement({ userRole }) {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchExceptions() {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('http://localhost:3000/api/risks/exceptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExceptions(data);
      }
    } catch (err) {
      console.error('Failed to fetch exceptions', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`http://localhost:3000/api/risks/exceptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action }) // 'Approved' or 'Denied'
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Waiver ${action}`, type: 'success' } }));
        fetchExceptions();
      } else if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Permission Denied', type: 'error' } }));
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Failed to ${action} waiver`, type: 'error' } }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Network error', type: 'error' } }));
    }
  };

  const pendingExceptions = exceptions.filter(ex => ex.status === 'Pending' || !ex.status);
  
  if (pendingExceptions.length === 0 && !loading) {
     return null; // Don't show section if no pending exceptions, or maybe show empty
  }

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
           <div>
               <h3 className="font-bold text-gray-800">Exception Management</h3>
               <p className="text-sm text-gray-500">Pending risk waivers requiring approval</p>
           </div>
           <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
               {pendingExceptions.length} Pending
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
             <thead className="bg-gray-50/50 text-gray-500 font-medium">
               <tr>
                 <th className="px-6 py-4">Risk Title</th>
                 <th className="px-6 py-4">Justification</th>
                 <th className="px-6 py-4">Expiration</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {loading ? (
                   <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
               ) : pendingExceptions.map(ex => (
                   <tr key={ex.id} className="hover:bg-gray-50/50">
                       <td className="px-6 py-4 font-medium text-gray-900">{ex.risks?.title || ex.risk_id}</td>
                       <td className="px-6 py-4 max-w-xs truncate" title={ex.justification}>{ex.justification}</td>
                       <td className="px-6 py-4">{new Date(ex.expiration).toLocaleDateString()}</td>
                       <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-md">Pending</span>
                       </td>
                       <td className="px-6 py-4 text-right whitespace-nowrap">
                           {userRole === 'Admin' ? (
                               <div className="flex justify-end space-x-2">
                                   <button onClick={() => handleAction(ex.id, 'Approved')} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition" title="Approve">
                                       <i className="fa-solid fa-check"></i>
                                   </button>
                                   <button onClick={() => handleAction(ex.id, 'Denied')} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition" title="Deny">
                                       <i className="fa-solid fa-xmark"></i>
                                   </button>
                               </div>
                           ) : (
                               <span className="text-xs text-gray-400 italic">Admin only</span>
                           )}
                       </td>
                   </tr>
               ))}
             </tbody>
          </table>
        </div>
    </div>
  );
}
