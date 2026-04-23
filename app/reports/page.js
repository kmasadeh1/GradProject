export const dynamic = 'force-dynamic';

import DashboardClient from '@/app/dashboard/DashboardClient';

export const metadata = {
  title: 'Risk Reports - FortiGRC',
  description: 'Generate and export risk analysis reports.',
};

export default function ReportsPage() {
  return <DashboardClient view="reports" />;
}
