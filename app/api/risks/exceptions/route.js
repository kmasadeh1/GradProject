import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('risk_exceptions')
      .select('*, risks(title)');
    
    if (error) {
       // if table doesn't exist, ignore and return empty array gracefully to not crash app since supabase migrations might not be fully run
       if (error.code === '42P01') { 
           return NextResponse.json([], { status: 200 });
       }
       throw error;
    }
    
    return NextResponse.json(data || [], { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { risk_id, justification, expiration } = await request.json();

    const { data, error } = await supabase
      .from('risk_exceptions')
      .insert([{ risk_id, justification, expiration, status: 'Pending' }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
