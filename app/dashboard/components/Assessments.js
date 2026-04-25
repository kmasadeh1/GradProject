'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Helpers — purely presentational
// ---------------------------------------------------------------------------

/** Maps a score string/number from the backend to a colour class. */
function scoreColor(score) {
  const n = parseInt(score, 10);
  if (isNaN(n)) return 'bg-gray-100 text-gray-600';
  if (n >= 80) return 'bg-emerald-100 text-emerald-800';
  if (n >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Assessments({ userRole }) {
  const [assessment, setAssessment]     = useState(null);   // current pending assessment from backend
  const [history, setHistory]           = useState([]);      // previous submission records from backend
  const [answers, setAnswers]           = useState({});      // raw user selections keyed by question id
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);

  // Result state — populated entirely from the backend response after submit.
  // Nothing is calculated here.
  const [submitResult, setSubmitResult] = useState(null);   // { score, status, generated_risks, ... }

  // ---------------------------------------------------------------------------
  // Data fetching — templates & history from the backend
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          if (mounted) setLoading(false);
          return;
        }

        const authHeader = { Authorization: `Bearer ${session.access_token}` };

        // Fetch current pending assessment
        const assessmentRes = await fetch('/api/assessments', { headers: authHeader });
        if (assessmentRes.ok && mounted) {
          const json = await assessmentRes.json();
          // API may return { assessment: {...} } or a plain array
          const obj = json?.assessment ?? (Array.isArray(json) ? json[0] : null);
          setAssessment(obj ?? null);

          // Initialise answers map — keys from backend question IDs, values null (unanswered)
          if (obj?.questions) {
            const init = {};
            obj.questions.forEach((q) => { init[q.id] = null; });
            setAnswers(init);
          }
        } else if (!assessmentRes.ok) {
          const err = await assessmentRes.json().catch(() => ({}));
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: err.error || `Failed to load assessment (${assessmentRes.status})`, type: 'error' },
          }));
        }

        // Fetch history
        const historyRes = await fetch('/api/assessments/history', { headers: authHeader });
        if (historyRes.ok && mounted) {
          const hJson = await historyRes.json();
          setHistory(Array.isArray(hJson) ? hJson : (hJson.history ?? []));
        }
      } catch (err) {
        console.error('Failed to load assessments:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();
    return () => { mounted = false; };
  }, []);

  // ---------------------------------------------------------------------------
  // Answer selection — stores raw user selections, no scoring
  // ---------------------------------------------------------------------------
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ---------------------------------------------------------------------------
  // Submit — sends the raw answers state directly to the backend.
  // All grading, scoring, and task generation happen server-side.
  // We wait for the API to return calculated values and display those.
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Not authenticated. Please log in again.', type: 'error' },
        }));
        return;
      }

      // Build answer array exactly as the backend expects it:
      // each entry has question_id, question_text (for audit logging), and the raw value.
      const payloadAnswers = assessment.questions.map((q) => ({
        question_id:       q.id,
        question_text:     q.question_text,
        linked_capability: q.risk_impact_title || 'Fundamental Capabilities',
        value:             answers[q.id],   // 'Yes' | 'No' | null — backend validates
      }));

      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          title:        assessment.title,
          answers:      payloadAnswers,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Display the backend's returned values verbatim — no client-side calculation
        setSubmitResult({
          score:           data.score           ?? data.calculated_score ?? null,
          status:          data.status          ?? null,
          generated_risks: data.created_risks   ?? data.generatedRisks  ?? [],
          tasks:           data.tasks           ?? data.created_tasks    ?? [],
          message:         data.message         ?? 'Assessment completed.',
        });

        // Refresh history using backend response
        const hRes = await fetch('/api/assessments/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (hRes.ok) {
          const hData = await hRes.json();
          setHistory(Array.isArray(hData) ? hData : (hData.history ?? []));
        }
      } else {
        const contentType = res.headers.get('content-type') || '';
        const errMsg = contentType.includes('application/json')
          ? (await res.json()).error
          : `Submission failed (${res.status})`;

        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: errMsg || 'An unexpected error occurred.', type: 'error' },
        }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error: could not reach the server.', type: 'error' },
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Button style helpers — purely visual based on current selection state
  // ---------------------------------------------------------------------------
  const optionClass = (qId, value) => {
    const base = 'px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition flex items-center ';
    if (answers[qId] === value) {
      return value === 'Yes'
        ? base + 'bg-emerald-50 border-emerald-500 text-emerald-700'
        : base + 'bg-red-50 border-red-500 text-red-700';
    }
    return base + 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50';
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Security Assessments</h2>
        <p className="text-gray-500 text-sm">Conduct audits and generate automated risk profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Assessment form ──────────────────────────────────── */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Card header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {loading ? 'Loading Assessment…' : (assessment?.title ?? 'No pending assessment')}
              </h3>
              {assessment?.description && (
                <p className="text-sm text-gray-500 mt-1">{assessment.description}</p>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <i className="fa-solid fa-spinner fa-spin mr-2" />Loading questionnaire…
              </div>
            ) : !assessment ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <i className="fa-solid fa-circle-check text-2xl text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">All assessments complete</h3>
                <p className="text-gray-400 text-sm">There are no pending assessments right now. Check back later.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {assessment.questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">
                          Question {index + 1}
                          {q.risk_impact_title && (
                            <span className="ml-2 text-gray-400 normal-case font-normal">· {q.risk_impact_title}</span>
                          )}
                        </span>
                        <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                      </div>

                      {/* Yes / No radio buttons — styled toggles, no logic */}
                      <div className="flex space-x-3 flex-shrink-0">
                        <label className={optionClass(q.id, 'Yes')}>
                          <input
                            type="radio"
                            className="hidden"
                            name={`q-${q.id}`}
                            value="Yes"
                            required
                            checked={answers[q.id] === 'Yes'}
                            onChange={() => handleAnswerChange(q.id, 'Yes')}
                          />
                          <i className="fa-solid fa-check mr-2" /> Yes
                        </label>

                        <label className={optionClass(q.id, 'No')}>
                          <input
                            type="radio"
                            className="hidden"
                            name={`q-${q.id}`}
                            value="No"
                            required
                            checked={answers[q.id] === 'No'}
                            onChange={() => handleAnswerChange(q.id, 'No')}
                          />
                          <i className="fa-solid fa-xmark mr-2" /> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50 inline-flex items-center"
                  >
                    {submitting ? (
                      <><i className="fa-solid fa-spinner fa-spin mr-2" />Submitting…</>
                    ) : (
                      <><i className="fa-solid fa-paper-plane mr-2" />Submit Assessment</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── History sidebar ──────────────────────────────────── */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center space-x-2">
              <i className="fa-solid fa-clock-rotate-left text-gray-400" />
              <h3 className="font-bold text-gray-800">Assessment History</h3>
            </div>

            <div className="p-4 space-y-3">
              {loading ? (
                <div className="text-center text-gray-400 py-4 text-sm">
                  <i className="fa-solid fa-spinner fa-spin mr-2" />Loading history…
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">
                  <i className="fa-solid fa-inbox text-2xl mb-2 block" />
                  No previous assessments found.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition cursor-default"
                  >
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 truncate">{item.title}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        <i className="fa-regular fa-calendar mr-1" />
                        {item.completed_at
                          ? new Date(item.completed_at).toLocaleDateString()
                          : '—'}
                      </span>
                      {/* Score rendered verbatim from backend — no calculation */}
                      {item.score != null && (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${scoreColor(item.score)}`}>
                          {item.score}
                        </span>
                      )}
                    </div>
                    {/* Status string from backend */}
                    {item.status && (
                      <p className="text-xs text-gray-400 mt-1 capitalize">{item.status}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit result modal ──────────────────────────────────── */}
      {/* All values in this modal come directly from the backend response payload. */}
      {submitResult !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSubmitResult(null)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto text-xl">
              <i className="fa-solid fa-check" />
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">Assessment Completed</h2>
            <p className="text-center text-gray-500 text-sm mb-5">{submitResult.message}</p>

            {/* Score — displayed exactly as returned by the backend */}
            {submitResult.score != null && (
              <div className="flex justify-center mb-5">
                <span className={`text-lg font-bold px-5 py-2 rounded-full ${scoreColor(submitResult.score)}`}>
                  Score: {submitResult.score}
                </span>
              </div>
            )}

            {/* Status — from backend */}
            {submitResult.status && (
              <p className="text-center text-sm text-gray-500 mb-5 capitalize">
                Status: <strong>{submitResult.status}</strong>
              </p>
            )}

            {/* Generated risks — list from backend, no manipulation */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-56 overflow-y-auto mb-6">
              <h4 className="font-bold text-gray-700 text-sm mb-3">
                Generated Risks ({submitResult.generated_risks.length})
              </h4>
              {submitResult.generated_risks.length > 0 ? (
                <ul className="space-y-2">
                  {submitResult.generated_risks.map((r, i) => (
                    <li key={r.id ?? i} className="text-sm text-red-600 flex items-start">
                      <i className="fa-solid fa-circle-exclamation mt-0.5 mr-2 flex-shrink-0" />
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

            {/* Generated tasks — if the backend returns them */}
            {submitResult.tasks.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 max-h-40 overflow-y-auto mb-6">
                <h4 className="font-bold text-blue-700 text-sm mb-3">
                  Action Tasks ({submitResult.tasks.length})
                </h4>
                <ul className="space-y-1.5">
                  {submitResult.tasks.map((t, i) => (
                    <li key={t.id ?? i} className="text-sm text-blue-700 flex items-start">
                      <i className="fa-solid fa-circle-arrow-right mt-0.5 mr-2 flex-shrink-0" />
                      <span>{t.title ?? t.description ?? JSON.stringify(t)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setSubmitResult(null)}
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
