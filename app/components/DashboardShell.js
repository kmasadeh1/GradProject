'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardShell({ title, userEmail = '', profile = {}, children }) {
  const role = profile.role ?? 'user';
  const fullName = profile.full_name || userEmail || '';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const router = useRouter();

  // Close user dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications for the bell badge — polls every 60 seconds
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch {}
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Toast system
  useEffect(() => {
    function handleToast(e) {
      const { message, type } = e.detail;
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `p-4 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${
        type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
      }`;

      const icon = document.createElement('i');
      icon.className = `fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} mr-2`;
      const text = document.createTextNode(String(message));
      toast.appendChild(icon);
      toast.appendChild(text);
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initial = fullName.charAt(0).toUpperCase() || 'U';
  const pendingCount = notifications.length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar role={role} />

      <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
        {/* ── Header ── */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10 w-full flex-shrink-0">
          <div className="font-bold text-xl text-gray-800">{title}</div>

          <div className="flex items-center space-x-3 pr-32">

            {/* ── Bell ── */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(prev => !prev)}
                className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                aria-label="Notifications"
              >
                <i className="fa-solid fa-bell text-base"></i>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    <span className="text-xs text-gray-400">{pendingCount} new</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {pendingCount === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        <i className="fa-solid fa-bell-slash text-2xl mb-2 block"></i>
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || '#'}
                          onClick={() => setBellOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                        >
                          <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                            n.type === 'error'   ? 'bg-red-100 text-red-600' :
                            n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                                   'bg-green-100 text-green-600'
                          }`}>
                            <i className={`fa-solid ${n.icon}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  {isAdmin && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <Link
                        href="/waivers"
                        onClick={() => setBellOpen(false)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all waivers →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── User dropdown ── */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center space-x-2 rounded-lg px-2 py-1 hover:bg-gray-100 transition"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : initial}
                </div>
                <span className="text-sm text-gray-600 hidden md:block">
                  Hello, {fullName}
                </span>
                <i className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white text-gray-800 shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{fullName}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <i className="fa-solid fa-right-from-bracket mr-3 text-red-400 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {children}
        </main>
      </div>

      {/* Toast mount point */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-[60] space-y-3" />
    </div>
  );
}
