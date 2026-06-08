'use client';

import { useState, useEffect, useRef } from 'react';

const ROLES = ['user', 'admin', 'super_admin'];
const ROLE_LABELS = { user: 'User', admin: 'Admin', super_admin: 'Super Admin' };

function toast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
}

function formatDate(dateStr) {
  if (!dateStr) return <span className="text-gray-400 italic">—</span>;
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPanel({ userRole, currentUserId }) {
  const isSuperAdmin = userRole === 'super_admin';

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Inline name edit
  const [editingId, setEditingId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const editInputRef = useRef(null);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.status === 403) { setAccessDenied(true); return; }
        if (!res.ok) { toast('Failed to load users.', 'error'); return; }
        setUsers(await res.json());
      } catch {
        toast('Network error while loading users.', 'error');
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Focus input when edit mode activates
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  async function handleRoleChange(userId, newRole) {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.status === 403) { toast('Access denied — Super Admins only.', 'error'); return; }
      if (!res.ok) { toast('Failed to update role.', 'error'); return; }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast(`Role updated to "${ROLE_LABELS[newRole] ?? newRole}".`);
    } catch {
      toast('Network error while updating role.', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  function startEditName(user) {
    setEditingId(user.id);
    setEditNameValue(user.full_name || '');
  }

  async function handleNameSave(userId) {
    const trimmed = editNameValue.trim();
    setEditingId(null);
    const original = users.find((u) => u.id === userId)?.full_name || '';
    if (trimmed === original) return;

    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, full_name: trimmed }),
      });
      if (!res.ok) { toast('Failed to update name.', 'error'); return; }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, full_name: trimmed } : u)));
      toast('Name updated.');
    } catch {
      toast('Network error while updating name.', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteUser(userId, email) {
    if (!confirm(`Are you sure you want to delete ${email}? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.status === 403) { toast('Access denied.', 'error'); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Failed to delete user.', 'error');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast('User deleted.');
    } catch {
      toast('Network error while deleting user.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  if (usersLoading) {
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
        <p className="text-gray-700 font-semibold text-lg">Access denied — Super Admins only</p>
        <p className="text-gray-400 text-sm">You do not have permission to view this page.</p>
      </div>
    );
  }

  const colSpan = isSuperAdmin ? 5 : 4;

  return (
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
              {isSuperAdmin && <th className="px-6 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isBeingDeleted = deletingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name cell — inline edit */}
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {editingId === user.id ? (
                      <input
                        ref={editInputRef}
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onBlur={() => handleNameSave(user.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleNameSave(user.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      user.full_name || <span className="text-gray-400 italic">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">{user.email}</td>

                  {/* Role dropdown */}
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

                  <td className="px-6 py-4 text-gray-500">{formatDate(user.created_at)}</td>

                  {/* Actions — super_admin only */}
                  {isSuperAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit name */}
                        <button
                          onClick={() => startEditName(user)}
                          disabled={editingId === user.id || updatingId === user.id}
                          title="Edit name"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <i className="fa-solid fa-pencil text-xs"></i>
                        </button>

                        {/* Delete user */}
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={isBeingDeleted || updatingId === user.id}
                            title="Delete user"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isBeingDeleted
                              ? <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                              : <i className="fa-solid fa-trash text-xs"></i>}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-400 text-sm">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
