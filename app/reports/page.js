import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import RiskReports from '@/app/dashboard/components/RiskReports';

export const metadata = {
  title: 'Risk Reports - FortiGRC',
  description: 'Generate and export risk analysis reports.',
};

export default async function ReportsPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Risk Reports" userEmail={user?.email ?? ''} profile={profile}>
      <RiskReports />
    </DashboardShell>
  );
}
