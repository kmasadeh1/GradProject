export const dynamic = 'force-dynamic';

import DashboardClient from '@/app/dashboard/DashboardClient';

export const metadata = {
  title: 'Risk Registry - FortiGRC',
  description: 'Quantitative risk analysis and management.',
};

export default function RisksPage() {
  return <DashboardClient view="risks" />;
}
