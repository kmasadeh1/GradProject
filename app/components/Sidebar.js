'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const roleBadgeMap = {
  super_admin: { label: 'Super Admin', color: 'bg-red-600' },
  admin:       { label: 'Admin',       color: 'bg-orange-500' },
  user:        { label: 'User',        color: 'bg-gray-500' },
};

const menuItems = [
  { name: 'Dashboard',   path: '/dashboard',   icon: 'fa-border-all',           always: true },
  { name: 'Risks',       path: '/risks',        icon: 'fa-triangle-exclamation', always: true },
  { name: 'Incidents',   path: '/incidents',    icon: 'fa-triangle-exclamation', always: true },
  { name: 'Reports',     path: '/reports',      icon: 'fa-chart-simple',         always: true },
  { name: 'Compliance',  path: '/compliance',   icon: 'fa-clipboard-check',      roles: ['admin', 'super_admin'] },
  { name: 'Assessments', path: '/assessments',  icon: 'fa-clipboard-list',       roles: ['admin', 'super_admin'] },
  { name: 'Waivers',     path: '/waivers',      icon: 'fa-file-shield',          roles: ['admin', 'super_admin'] },
  { name: 'Settings',    path: '/settings',     icon: 'fa-gear',                 roles: ['admin', 'super_admin'] },
  { name: 'Admin Panel', path: '/admin',        icon: 'fa-users-gear',           roles: ['super_admin'] },
];

/**
 * Sidebar — purely presentational.
 * `role` is passed from the server (via DashboardShell / page.js) so there is
 * no client-side fetch, no loading spinner, and no layout shift on navigation.
 */
export default function Sidebar({ role = 'user' }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 sidebar-bg text-gray-300 flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <i className="fa-solid fa-shield-halved text-blue-500 text-xl mr-3" />
        <span className="font-bold text-white text-lg">FortiGRC</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isVisible =
            item.always ||
            role === 'super_admin' ||
            (item.roles && item.roles.includes(role));
          if (!isVisible) return null;

          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.name}
              href={item.path}
              prefetch={true}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-gray-800 hover:text-white transition ${
                isActive ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <i className={`fa-solid ${item.icon} mr-3 w-5`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-3">
        {role && roleBadgeMap[role] && (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${roleBadgeMap[role].color}`}>
            {roleBadgeMap[role].label}
          </span>
        )}
        <a
          href="#"
          onClick={handleLogout}
          className="flex items-center text-sm text-gray-400 hover:text-white transition"
        >
          <i className="fa-solid fa-right-from-bracket mr-2" /> Logout
        </a>
      </div>
    </aside>
  );
}
