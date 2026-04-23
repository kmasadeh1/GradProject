import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/assessments
 *
 * Fetches pending assessments with questions.
 * Uses Bearer token from headers — no cookies.
 */
export async function GET(request) {
  try {
    // 1. Get the auth header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("Auth failed in Assessments API: Missing or invalid Authorization header");
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
      console.error("Auth failed in Assessments API:", authError?.message || "No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Query the database for pending assessments with questions
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id, title, status,
        assessment_questions ( id, question_text, risk_impact_title, risk_severity )
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Supabase query error in Assessments API:", error);
      throw error;
    }

    console.log("Assessments Data:", data);

    // Return the first pending assessment, or null
    if (!data || data.length === 0) {
      return NextResponse.json({ assessment: null, message: "No pending assessments found." });
    }

    const assessment = data[0];
    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        status: assessment.status,
        questions: assessment.assessment_questions || [],
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
