import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
    const notifications = [];

    let waiversQuery = supabase
      .from('risk_exceptions')
      .select('*, risks(title)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      waiversQuery = waiversQuery.eq('requested_by', user.id);
    }

    const { data: waivers, error } = await waiversQuery;

    if (!error && waivers) {
      for (const w of waivers) {
        const riskName = w.risks?.title || '';
        const justification = w.justification || '';
        const message = riskName
          ? `${riskName} — ${justification.slice(0, 50)}${justification.length > 50 ? '…' : ''}`
          : justification.slice(0, 60);

        notifications.push({
          id: `waiver-${w.id}`,
          type: 'warning',
          icon: 'fa-file-shield',
          title: isAdmin ? 'Pending Waiver Request' : 'Your Waiver is Pending',
          message,
          link: '/waivers',
        });
      }
    }

    return NextResponse.json(notifications, { status: 200 });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
