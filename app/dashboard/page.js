import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import DashboardOverview from './components/DashboardOverview';

export const metadata = {
  title: 'Dashboard - FortiGRC',
  description: 'FortiGRC Enterprise Risk Management Dashboard — Quantitative risk analysis and management.',
};

export default async function DashboardPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Dashboard" userEmail={user?.email ?? ''} profile={profile}>
      <DashboardOverview />
    </DashboardShell>
  );
}
