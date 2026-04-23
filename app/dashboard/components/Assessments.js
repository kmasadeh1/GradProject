'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Assessments({ userRole }) {
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatedRisks, setGeneratedRisks] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      console.log("1. Starting data fetch...");
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("2. Auth Error: No session found");
          if (isMounted) setLoading(false);
          return;
        }

        console.log("3. Session found, fetching assessments...");

        // Fetch Pending Assessment
        const currentRes = await fetch('/api/assessments', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const currentData = await currentRes.json();
        console.log("4. Current Assessment Data:", currentData);

        if (isMounted) {
          let assessmentObj = null;
          if (currentData && currentData.assessment) assessmentObj = currentData.assessment;
          else if (Array.isArray(currentData) && currentData.length > 0) assessmentObj = currentData[0];

          setAssessment(assessmentObj);

          // Initialize answers map from questions
          if (assessmentObj?.questions) {
            const init = {};
            assessmentObj.questions.forEach(q => { init[q.id] = null; });
            setAnswers(init);
          }
        }

        // Fetch History
        const historyRes = await fetch('/api/assessments/history', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const historyData = await historyRes.json();
        console.log("5. History Data:", historyData);

        if (isMounted) {
          setHistory(historyData.history || historyData || []);
        }

      } catch (error) {
        console.error("FATAL FETCH ERROR:", error);
      } finally {
        console.log("6. Turning off loading spinners.");
        if (isMounted) setLoading(false);
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, []); // <--- empty array: runs EXACTLY ONCE

  const handleRadioChange = (questionId, val) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(answers).some(a => a === null)) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Please answer all questions', type: 'error' } }));
      return;
    }

    setSubmitting(true);
    const payloadAnswers = assessment.questions.map(q => ({
      question_id: q.id,
      question_text: q.question_text,
      linked_capability: q.risk_impact_title || 'Fundamental Capabilities',
      value: answers[q.id]
    }));

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assessmentId: assessment.id,  // real ID from fetched assessment state
          title: assessment.title,
          answers: payloadAnswers
          // NOTE: no userId sent — backend extracts identity from the JWT session
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Backend returns `created_risks`; fall back to `generatedRisks` for legacy compat
        setGeneratedRisks(data.created_risks ?? data.generatedRisks ?? []);
        // Refresh history using relative URL
        try {
          const hRes = await fetch('/api/assessments/history', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (hRes.ok) {
            const hData = await hRes.json();
            setHistory(Array.isArray(hData.history) ? hData.history : []);
          }
        } catch (hErr) {
          console.warn('History refresh failed:', hErr);
        }
      } else if (res.status === 403) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Permission Denied', type: 'error' } }));
      } else {
        // Parse and surface the actual backend error
        try {
          const errorData = await res.json();
          console.error('Backend Error Details:', errorData);
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: {
              message: `Error: ${errorData.error || 'Failed to submit'}`,
              type: 'error'
            }
          }));
        } catch {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: `Submission failed (${res.status})`, type: 'error' }
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const yesLabelClass = (qId) => {
    const base = 'px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition flex items-center ';
    return answers[qId] === 'Yes'
      ? base + 'bg-emerald-50 border-emerald-500 text-emerald-700'
      : base + 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50';
  };

  const noLabelClass = (qId) => {
    const base = 'px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition flex items-center ';
    return answers[qId] === 'No'
      ? base + 'bg-red-50 border-red-500 text-red-700'
      : base + 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Security Assessments</h2>
        <p className="text-gray-500 text-sm">Conduct audits and generate automated risk profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Assessment Card */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {assessment ? assessment.title : 'Loading Assessment...'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {assessment ? assessment.description : ''}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading questionnaire...</div>
            ) : assessment ? (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {assessment.questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-gray-50 rounded-lg p-5 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between"
                    >
                      <div className="mb-3 md:mb-0 pr-4">
                        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">
                          Question {index + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                      </div>

                      <div className="flex space-x-3 flex-shrink-0">
                        <label className={yesLabelClass(q.id)}>
                          <input
                            type="radio"
                            className="hidden"
                            name={q.id}
                            value="Yes"
                            checked={answers[q.id] === 'Yes'}
                            onChange={() => handleRadioChange(q.id, 'Yes')}
                          />
                          <i className="fa-solid fa-check mr-2"></i> Yes
                        </label>

                        <label className={noLabelClass(q.id)}>
                          <input
                            type="radio"
                            className="hidden"
                            name={q.id}
                            value="No"
                            checked={answers[q.id] === 'No'}
                            onChange={() => handleRadioChange(q.id, 'No')}
                          />
                          <i className="fa-solid fa-xmark mr-2"></i> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || Object.values(answers).some(a => a === null)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50 inline-flex items-center"
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        Submit Assessment
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-gray-400">Failed to load assessment.</div>
            )}
          </div>
        </div>

        {/* History Sidebar */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center space-x-2">
              <i className="fa-solid fa-clock-rotate-left text-gray-400"></i>
              <h3 className="font-bold text-gray-800">Assessment History</h3>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="text-center text-gray-400 py-4 text-sm">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-400 py-4 text-sm">No previous assessments found.</div>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white transition cursor-default"
                  >
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{item.title}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        <i className="fa-regular fa-calendar mr-1"></i>
                        {new Date(item.completed_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {item.score} Score
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {generatedRisks !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setGeneratedRisks(null)}
          ></div>
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto text-xl">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Assessment Completed</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Your answers have been evaluated successfully.</p>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-64 overflow-y-auto mb-6">
              <h4 className="font-bold text-gray-700 text-sm mb-3">
                Generated Risks ({generatedRisks.length})
              </h4>
              {generatedRisks.length > 0 ? (
                <ul className="space-y-2">
                  {generatedRisks.map((r, i) => (
                    <li key={i} className="text-sm text-red-600 flex items-start">
                      <i className="fa-solid fa-circle-exclamation mt-0.5 mr-2 flex-shrink-0"></i>
                      <span>{r.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-600 font-medium">
                  No new risks were generated. Great job!
                </p>
              )}
            </div>

            <button
              onClick={() => setGeneratedRisks(null)}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition"
            >
              Close &amp; Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
