'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import DashboardOverview from './components/DashboardOverview';
import RiskRegistry from './components/RiskRegistry';
import ComplianceManagement from './components/ComplianceManagement';
import RiskReports from './components/RiskReports';
import Assessments from './components/Assessments';
import Settings from './components/Settings';
import Incidents from './components/Incidents';


function DashboardContent({ view = 'dashboard' }) {
  const titles = {
      'dashboard': 'Dashboard',
      'risks': 'Risk Registry',
      'compliance': 'Compliance Controls',
      'assessments': 'Security Assessments',
      'reports': 'Risk Reports',
      'settings': 'Settings',
      'incidents': 'Incident Response'
  };

  const [userEmail, setUserEmail] = useState(null);
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState(null); // null = loading; set after profile fetch
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const dropdownRef = useRef(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user ? user.email : 'Guest');

      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          try {
            const res = await fetch('http://localhost:3000/api/profile', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const profileData = await res.json();
              if (profileData.full_name) {
                setFullName(profileData.full_name);
              }
              if (profileData.avatar_url) {
                setAvatarUrl(profileData.avatar_url);
              }
              if (profileData.role) {
                console.log('[DashboardClient] userRole resolved:', profileData.role);
                setUserRole(profileData.role);
              } else {
                // Profile has no role — fall back to Viewer
                console.warn('[DashboardClient] No role in profile response, defaulting to Viewer');
                setUserRole('Viewer');
              }
            }
          } catch (e) {
            console.error('[DashboardClient] Failed to fetch profile, defaulting role to Viewer:', e);
            setUserRole('Viewer');
          }
        }
      }
    }
    fetchUser();
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `p-4 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`;
      toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} mr-2"></i>${message}`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };  const renderView = () => {
    switch(view) {
      case 'dashboard': return <DashboardOverview />;
      case 'risks': return <RiskRegistry userRole={userRole} />;
      case 'compliance': return <ComplianceManagement userRole={userRole} />;
      case 'assessments': return <Assessments userRole={userRole} />;
      case 'reports': return <RiskReports />;
      case 'settings': return <Settings onAvatarUpdate={setAvatarUrl} currentAvatar={avatarUrl} userRole={userRole} />;
      case 'incidents': return <Incidents userRole={userRole} />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
        
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10 w-full flex-shrink-0">
          <div className="font-bold text-xl text-gray-800">{titles[view] || 'Dashboard'}</div>
          
          <div className="flex items-center space-x-4 pr-32">
            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center space-x-2 rounded-lg px-2 py-1 hover:bg-gray-100 transition"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    userEmail && userEmail !== 'Guest' ? userEmail.charAt(0).toUpperCase() : 'G'
                  )}
                </div>
                <span className="text-sm text-gray-600 hidden md:block">
                  {userEmail === null ? <i className="fa-solid fa-spinner fa-spin"></i> : `Hello, ${fullName || userEmail}`}
                </span>
                <i className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white text-gray-800 shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{fullName || userEmail}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <i className="fa-solid fa-right-from-bracket mr-3 text-red-400 w-4"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>


        
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {renderView()}
        </main>
        
      </div>

      <div id="toast-container" className="fixed bottom-6 right-6 z-[60] space-y-3"></div>
    </div>
  );
}

export default function DashboardClient({ view = 'dashboard' }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
              <i className="fa-solid fa-spinner fa-spin text-xl"></i>
            </div>
            <p className="text-gray-500 text-sm">Loading dashboard…</p>
          </div>
        </div>
      }
    >
      <DashboardContent view={view} />
    </Suspense>
  );
}
