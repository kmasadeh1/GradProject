'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';

const ROLES = ['user', 'admin', 'super_admin'];

const ROLE_LABELS = {
  user: 'User',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] space-y-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          <i className={`fa-solid ${t.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function AdminClient() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  function addToast(message, type = 'success') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  async function getToken() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  useEffect(() => {
    async function fetchUsers() {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const url = backendUrl ? `${backendUrl}/api/admin/users` : '/api/admin/users';

      try {
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (!res.ok) {
          addToast('Failed to load users.', 'error');
          return;
        }

        const data = await res.json();
        setUsers(data);
      } catch {
        addToast('Network error while loading users.', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  async function handleRoleChange(userId, newRole) {
    setUpdatingId(userId);
    const token = await getToken();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const url = backendUrl ? `${backendUrl}/api/admin/users` : '/api/admin/users';

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.status === 403) {
        addToast('Access denied — Admins only.', 'error');
        return;
      }

      if (!res.ok) {
        addToast('Failed to update role.', 'error');
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      addToast(`Role updated to "${ROLE_LABELS[newRole] ?? newRole}".`);
    } catch {
      addToast('Network error while updating role.', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center px-8 z-10 flex-shrink-0">
          <h1 className="font-bold text-xl text-gray-800">User Management</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {loading && !accessDenied && (
            <div className="flex items-center justify-center py-24">
              <i className="fa-solid fa-spinner fa-spin text-gray-400 text-2xl"></i>
            </div>
          )}

          {accessDenied && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <i className="fa-solid fa-lock text-red-400 text-4xl"></i>
              <p className="text-gray-700 font-semibold text-lg">Access denied — Admins only</p>
              <p className="text-gray-400 text-sm">You do not have permission to view this page.</p>
            </div>
          )}

          {!loading && !accessDenied && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {user.full_name || <span className="text-gray-400 italic">—</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block">
                            <select
                              value={user.role ?? 'user'}
                              disabled={updatingId === user.id}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="appearance-none bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            {updatingId === user.id ? (
                              <i className="fa-solid fa-spinner fa-spin absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                            ) : (
                              <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : <span className="text-gray-400 italic">—</span>}
                        </td>
                      </tr>
                    ))}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
