import { useMemo, useState } from "react";
import { FiGitBranch, FiCheckCircle, FiAlertCircle, FiZap } from "react-icons/fi";

const defaultCandidates = [
  {
    id: "economics-lab",
    name: "Economics Lab",
    branch: "feature/economics-lab",
    status: "dev",
    owner: "Codex",
    readiness: "prototype",
    budget: 240,
  },
  {
    id: "ttv-funktopia",
    name: "TTV Funktopia Route",
    branch: "feature/ttv-funktopia",
    status: "dev",
    owner: "Codex",
    readiness: "qa-ready",
    budget: 120,
  },
  {
    id: "ttv-quantum",
    name: "TTV Quantum Route",
    branch: "feature/ttv-quantum",
    status: "staging",
    owner: "Codex",
    readiness: "staging",
    budget: 180,
  },
];

const statusStyles = {
  dev: "bg-slate-200 text-slate-800",
  staging: "bg-amber-200 text-amber-900",
  approved: "bg-emerald-200 text-emerald-900",
};

const BranchManager = () => {
  const [candidates, setCandidates] = useState(defaultCandidates);
  const [selected, setSelected] = useState(null);

  const totals = useMemo(() => {
    const staging = candidates.filter((c) => c.status === "staging");
    const budget = staging.reduce((sum, item) => sum + item.budget, 0);
    return { stagingCount: staging.length, budget };
  }, [candidates]);

  const updateStatus = (id, next) => {
    setCandidates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: next } : item))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-slate-400">
            <FiGitBranch />
            Branch Manager
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Promote features from dev → staging → prod
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Staging is funded by TTVStars red credits. Approve here before merging to prod.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Staging load</p>
          <p className="text-xl font-semibold">{totals.stagingCount} queued</p>
          <p className="text-xs text-slate-500">Budget: {totals.budget} red credits</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {candidates.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className={`text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 ${
              selected?.id === item.id ? "ring-2 ring-slate-300" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{item.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[item.status]}`}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Branch: {item.branch}</p>
            <p className="text-xs text-slate-500">Owner: {item.owner}</p>
            <p className="text-xs text-slate-500">Readiness: {item.readiness}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {selected ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[selected.status]}`}>
                {selected.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Branch</p>
                <p>{selected.branch}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Red credit budget</p>
                <p>{selected.budget} credits</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white text-sm"
                onClick={() => updateStatus(selected.id, "staging")}
              >
                <FiZap /> Send to staging
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white text-sm"
                onClick={() => updateStatus(selected.id, "approved")}
              >
                <FiCheckCircle /> Approve for prod
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-slate-900 text-sm"
                onClick={() => updateStatus(selected.id, "dev")}
              >
                <FiAlertCircle /> Send back to dev
              </button>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              <p>Integration checklist (placeholder): tests passing, staging sign-off, TTVStars budget allocated.</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Select a feature to review promotion controls.</p>
        )}
      </div>
    </div>
  );
};

export default BranchManager;
