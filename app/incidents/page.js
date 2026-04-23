export const dynamic = 'force-dynamic';

import DashboardClient from '@/app/dashboard/DashboardClient';

export const metadata = {
  title: 'Incident Response - FortiGRC',
  description: 'Manage and track security incidents.',
};

export default function IncidentsPage() {
  return <DashboardClient view="incidents" />;
}
