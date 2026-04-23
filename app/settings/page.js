export const dynamic = 'force-dynamic';

import DashboardClient from '@/app/dashboard/DashboardClient';

export const metadata = {
  title: 'Settings - FortiGRC',
  description: 'Application settings and preferences.',
};

export default function SettingsPage() {
  return <DashboardClient view="settings" />;
}
