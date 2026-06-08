import { getServerProfile } from '@/lib/getServerProfile';
import DashboardShell from '@/app/components/DashboardShell';
import RiskRegistry from '@/app/dashboard/components/RiskRegistry';

export const metadata = {
  title: 'Risk Registry - FortiGRC',
  description: 'Quantitative risk analysis and management.',
};

export default async function RisksPage() {
  const { user, profile } = await getServerProfile();
  return (
    <DashboardShell title="Risk Registry" userEmail={user?.email ?? ''} profile={profile}>
      <RiskRegistry userRole={profile.role} />
    </DashboardShell>
  );
}
