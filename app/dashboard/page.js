export const dynamic = 'force-dynamic';

import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard - FortiGRC',
  description: 'FortiGRC Enterprise Risk Management Dashboard — Quantitative risk analysis and management.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
