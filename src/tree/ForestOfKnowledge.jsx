import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_TREE_KEY, API_URL } from "./config";

// Use shared config - tree key is now configurable via VITE_KNOWLEDGE_TREE_KEY
const MAIN_TREE_KEY = DEFAULT_TREE_KEY;

export default function ForestOfKnowledge() {
  const nav = useNavigate();
  const [forestRoots, setForestRoots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr(null);
        setLoading(true);

        // Fetch the first-level children of the root (the "forest roots")
        const res = await fetch(
          `${API_URL}/knowledge-trees/${encodeURIComponent(MAIN_TREE_KEY)}/forest`
        );

        if (!res.ok) {
          throw new Error(`Failed to load forest (HTTP ${res.status})`);
        }

        const data = await res.json();
        if (alive) {
          setForestRoots(data.forestRoots || []);
        }
      } catch (e) {
        if (alive) setErr(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#12121f] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Forest of Knowledge
          </h1>
          <p className="text-white/60 mt-2 max-w-lg mx-auto">
            Choose a domain to explore. Each tree represents a branch of human knowledge.
          </p>
        </div>

        {/* Error state */}
        {err && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center">
            Error: {err}
          </div>
        )}

        {/* Loading state */}
        {loading && !err && (
          <div className="text-center text-white/60 py-12">
            Loading forest...
          </div>
        )}

        {/* Forest grid */}
        {!loading && !err && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forestRoots.map((root) => (
              <button
                key={root.nodeKey}
                onClick={() =>
                  nav(
                    `/forest/${encodeURIComponent(MAIN_TREE_KEY)}/${encodeURIComponent(root.nodeKey)}`
                  )
                }
                className="group text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 p-5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  {root.icon && (
                    <span className="text-2xl">{root.icon}</span>
                  )}
                  <div>
                    <div className="font-semibold text-lg group-hover:text-amber-400 transition-colors">
                      {root.label}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {root.nodeKey}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !err && forestRoots.length === 0 && (
          <div className="text-center text-white/60 py-12">
            No knowledge trees found.
          </div>
        )}
      </div>
    </div>
  );
}
