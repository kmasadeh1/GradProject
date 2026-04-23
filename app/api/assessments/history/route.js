import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/assessments/history
 *
 * Fetches completed assessments.
 * Uses Bearer token from headers — no cookies.
 *
 * Returns: { history: [...] }
 */
export async function GET(request) {
  try {
    // 1. Get the auth header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Auth failed in Assessments History API: Missing or invalid Authorization header");
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // 2. Initialize standard Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // 3. Verify the user using the token directly
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth failed in Assessments History API:", authError?.message || "No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Query the database for completed assessments
    const { data, error } = await supabase
      .from('assessments')
      .select('id, title, status, created_at')
      .eq('status', 'Completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase query error in Assessments History API:", error);
      throw error;
    }

    console.log("History Data:", data);

    return NextResponse.json({ history: data || [] });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
