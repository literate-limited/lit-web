import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const fetchPlacement = async (limit = 12) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/placement/math/test?limit=${limit}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load placement (HTTP ${res.status})`);
  }
  return res.json();
};

const submitPlacement = async (responses) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/placement/math/grade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ responses }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to grade (HTTP ${res.status})`);
  }
  return res.json();
};

const MathPlacementPage = () => {
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setResult(null);
      setSubmitting(false);
      setLoading(true);
      setAnswers({});
      const data = await fetchPlacement();
      setItems(data.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load placement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allAnswered = items.length > 0 && items.every((q) => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError("Answer all questions to continue.");
      return;
    }
    try {
      setError("");
      setSubmitting(true);
      const responses = items.map((q) => ({
        itemId: q.id,
        answer: answers[q.id],
      }));
      const graded = await submitPlacement(responses);
      setResult(graded);
    } catch (err) {
      setError(err?.message || "Failed to submit placement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060f] via-[#0a1022] to-[#05060f] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
              Placement · Math
            </p>
            <h1 className="text-2xl font-semibold">Placement Snapshot</h1>
            <p className="mt-2 text-sm text-slate-400">
              Quick adaptive check to locate you between “Maggie Simpson” and “Einstein”.
              Questions span numeracy → algebra → calculus → proofs.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 shadow-inner shadow-cyan-500/20">
            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200">API</p>
            <p className="mathmadness-mono text-xs">{API_URL || "Set VITE_API_URL"}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 text-sm text-slate-400">Loading placement items…</div>
        )}

        {!loading && !result && (
          <div className="mt-6 space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-50">
                    Q{idx + 1}. {item.prompt}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.levelBand} · {item.band}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {item.options.map((opt, optIdx) => {
                    const checked = answers[item.id] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        className={[
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
                          checked
                            ? "border-cyan-400/70 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                            : "border-slate-800/70 bg-slate-900/50 text-slate-200 hover:border-slate-700 hover:bg-slate-900",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name={item.id}
                          value={optIdx}
                          checked={checked}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [item.id]: optIdx }))
                          }
                          className="h-4 w-4 accent-cyan-400"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || items.length === 0}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Scoring…" : "Submit"}
              </button>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="rounded-xl border border-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-cyan-200"
              >
                Reload
              </button>
              {!allAnswered && (
                <span className="text-xs text-slate-400">Answer all questions to submit.</span>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Result</p>
                <h2 className="text-xl font-semibold text-emerald-100">
                  {result.recommendedBand} · {result.recommendedLevelBand || "band"}
                </h2>
                <p className="text-sm text-emerald-200">
                  {result.scorePercent}% ({result.totalCorrect}/{result.totalQuestions}) —{" "}
                  {result.recommendedNodeKey || "node pending"}
                </p>
              </div>
              <button
                type="button"
                onClick={load}
                className="rounded-xl border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/10"
              >
                Retake
              </button>
            </div>
            <p className="mt-3 text-sm text-emerald-100">
              {result.justification || "Placement rationale unavailable."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {Object.entries(result.bandBreakdown || {}).map(([band, stats]) => (
                <div
                  key={band}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-50"
                >
                  <div className="font-semibold">{band}</div>
                  <div className="text-xs text-emerald-200">
                    {stats.correct}/{stats.total} correct
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathPlacementPage;
