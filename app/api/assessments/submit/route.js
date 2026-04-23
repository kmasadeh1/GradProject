import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { assessmentId, title, answers } = await request.json();
    
    const newRisks = [];
    answers.forEach(ans => {
       if (ans.value === 'No') {
          // If the answer is No, we identify a compliance or security risk
          newRisks.push({
             title: `Audit Finding: Failed "${ans.question_text}"`,
             jncsf_capability: ans.linked_capability || 'Fundamental Capabilities',
             likelihood: 3, // Auto-assigned default values for audit findings
             impact: 4
          });
       }
    });

    const generatedRisks = [];

    if (newRisks.length > 0) {
       const { data, error } = await supabase.from('risks').insert(newRisks).select();
       if (!error && data) {
           generatedRisks.push(...data);
       } else {
           console.error("Failed to insert risks", error);
       }
    }

    // Log the assessment silently (ignore if table isn't created yet)
    await supabase.from('assessment_history').insert([{
       title: title || 'Assessment Audit',
       score: `${Math.round(((answers.length - newRisks.length) / answers.length) * 100)}%`,
       completed_at: new Date().toISOString()
    }]);

    return NextResponse.json({ success: true, generatedRisks }, { status: 200 });
  } catch (err) {
    console.error('Submit Assessment Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
