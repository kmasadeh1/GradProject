'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchRole() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (isMounted) setUserRole('guest');
        return;
      }
      
      try {
        const res = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUserRole(data.role?.toLowerCase() || 'viewer');
        } else {
          if (isMounted) setUserRole('viewer');
        }
      } catch (err) {
        console.error('Failed to fetch role', err);
        if (isMounted) setUserRole('viewer');
      }
    }
    fetchRole();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fa-border-all', always: true },
    { name: 'Risks', path: '/risks', icon: 'fa-triangle-exclamation', always: true },
    { name: 'Incidents', path: '/incidents', icon: 'fa-triangle-exclamation', always: true },
    { name: 'Reports', path: '/reports', icon: 'fa-chart-simple', always: true },
    { name: 'Compliance', path: '/compliance', icon: 'fa-clipboard-check', roles: ['admin', 'auditor'] },
    { name: 'Assessments', path: '/assessments', icon: 'fa-clipboard-list', roles: ['admin', 'auditor'] },
    { name: 'Settings', path: '/settings', icon: 'fa-gear', roles: ['admin'] },
  ];

  return (
    <aside className="w-64 sidebar-bg text-gray-300 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <i className="fa-solid fa-shield-halved text-blue-500 text-xl mr-3"></i>
        <span className="font-bold text-white text-lg">FortiGRC</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {userRole === null ? (
          <div className="flex justify-center items-center py-8">
            <i className="fa-solid fa-spinner fa-spin text-gray-500 text-xl"></i>
          </div>
        ) : (
          menuItems.map((item) => {
            // Check visibility
            const isVisible = item.always || (item.roles && item.roles.includes(userRole));
            if (!isVisible) return null;

            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link 
                key={item.name}
                href={item.path} 
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition ${isActive ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''}`}
              >
                <i className={`fa-solid ${item.icon} mr-3 w-5`}></i> {item.name}
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <a href="#" onClick={handleLogout} className="flex items-center text-sm text-gray-400 hover:text-white transition">
           <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
        </a>
      </div>
    </aside>
  );
}
