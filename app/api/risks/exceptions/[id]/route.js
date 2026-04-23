import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.role !== 'Admin') {
      return NextResponse.json({ error: 'Permission Denied' }, { status: 403 });
    }

    const { status } = await request.json();
    const { id } = await params;

    const { data, error } = await supabase
      .from('risk_exceptions')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
