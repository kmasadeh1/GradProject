import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardShell from '@/app/components/DashboardShell';
import WaiversClient from './WaiversClient';

export const metadata = {
  title: 'Waivers - FortiGRC',
  description: 'Review and action risk exception waiver requests.',
};

export default async function WaiversPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(profile?.role)) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell title="Waivers" userEmail={user.email ?? ''} profile={profile ?? {}}>
      <WaiversClient />
    </DashboardShell>
  );
}
