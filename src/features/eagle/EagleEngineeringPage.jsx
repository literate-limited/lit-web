import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Target,
  Gauge,
  Settings2,
  SatelliteDish,
  Rocket,
  CircleDashed,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Workflow,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useBrand } from "../../brands/BrandContext";
import "./eagle.css";

const STORAGE_KEYS = {
  scaffolding: "eag_scaffolding",
  guardrails: "eag_guardrails",
  functions: "eag_functions",
  goals: "eag_goals",
  messages: "eag_messages",
};

const DEFAULT_GUARDRAILS = {
  tests: true,
  instrumentation: true,
  handoff: false,
};
const DEFAULT_SCAFFOLDING = 68;

const guardrailOptions = [
  { key: "tests", label: "Edge-case harness", note: "Positive + failure paths" },
  { key: "instrumentation", label: "Instrumentation", note: "Traces, metrics, flags" },
  { key: "handoff", label: "Handoff notes", note: "Summaries + next checkpoints" },
];

const quickPrompts = [
  "Draft the FFI handshake so Edward can translate intent to functions.",
  "Propose functions to ship a coaching chat with adjustable scaffolding.",
  "Design guardrails and observability for the Function Face Interface.",
];

const statusTone = {
  proposed: { label: "Proposed", tone: "soft" },
  running: { label: "Running", tone: "live" },
  done: { label: "Done", tone: "quiet" },
};

const describeScaffolding = (value) => {
  if (value < 35) {
    return {
      label: "Solo mode",
      detail: "Light prompts, you drive. Edward only stabilizes intent and outcomes.",
      cadence: "High speed, low ceremony",
    };
  }
  if (value < 70) {
    return {
      label: "Paired build",
      detail: "Edward drafts signatures, safety nets, and keeps goals visible.",
      cadence: "Guided, still nimble",
    };
  }
  return {
    label: "Full scaffolding",
    detail: "Explicit steps, guardrails on, and ready-to-run function blueprints.",
    cadence: "Deliberate, stable",
  };
};

const craftSteps = (focus, value, guardrails) => {
  const steps = [
    `Clarify success + constraints for ${focus}`,
    `Sketch the Function Face interface inputs/outputs`,
    `Draft function signatures and payloads`,
  ];

  if (value >= 35) {
    steps.push("Note assumptions, risks, and dependencies");
  }
  if (guardrails.tests) {
    steps.push("List happy + edge-case tests to keep regressions visible");
  }
  if (guardrails.instrumentation) {
    steps.push("Add traces/metrics around critical paths");
  }
  if (value >= 70) {
    steps.push("Pre-wire scaffolding (checkpoints, prompts, handoffs)");
  }
  if (guardrails.handoff) {
    steps.push("Create a handoff note with next experiments");
  }

  return steps.slice(0, 6);
};

const synthesizeFunctions = (prompt, value, guardrails) => {
  const focus = prompt || "the feature";
  const caps = prompt.toLowerCase();
  const wantsUI = /ui|screen|page|interface|ux/.test(caps);
  const wantsAPIs = /api|endpoint|contract|data|db/.test(caps);
  const wantsVoice = /voice|audio|speak|microphone/.test(caps);

  const proposals = [];

  proposals.push({
    id: `fn-${Date.now()}-scope`,
    title: "FFI intent capture",
    focus,
    status: "running",
    highlight: "Keep the human face + profile bound to the function table.",
    steps: craftSteps("intent capture", value, guardrails),
    scaffolding: value,
    tags: ["interface", "persona", "goals"],
  });

  if (wantsAPIs) {
    proposals.push({
      id: `fn-${Date.now()}-contract`,
      title: "Function contract kit",
      focus,
      status: "proposed",
      highlight: "Define payloads, guardrails, and success checks.",
      steps: craftSteps("contracts & data", value, guardrails),
      scaffolding: value,
      tags: ["contracts", "data"],
    });
  }

  if (wantsUI || wantsVoice) {
    proposals.push({
      id: `fn-${Date.now()}-experience`,
      title: "Experience rail",
      focus,
      status: "proposed",
      highlight: "Model the user-facing flow with scaffolding controls.",
      steps: craftSteps("experience rail", value, guardrails),
      scaffolding: value,
      tags: ["experience", "scaffolding"],
    });
  }

  proposals.push({
    id: `fn-${Date.now()}-safety`,
    title: "Safety + scaffolding",
    focus,
    status: "proposed",
    highlight: "Guardrails, observability, and checklists per function.",
    steps: craftSteps("safety net", value, guardrails),
    scaffolding: value,
    tags: ["tests", "observability"],
  });

  return proposals;
};

const seedFunctions = (value, guardrails) => [
  {
    id: "ffi-handshake",
    title: "FFI handshake",
    focus: "Connect the face, profile, and function table",
    status: "running",
    highlight: "Keep Edward aware of who is asking and what success looks like.",
    steps: craftSteps("FFI handshake", value, guardrails),
    scaffolding: value,
    tags: ["persona", "profile"],
  },
  {
    id: "scaffolding-dial",
    title: "Scaffolding dial",
    focus: "Let the human set the level of help",
    status: "proposed",
    highlight: "Expose presets for solo, paired, and fully scaffolded work.",
    steps: craftSteps("scaffolding control", value, guardrails),
    scaffolding: value,
    tags: ["controls", "ux"],
  },
];

const mergeFunctions = (existing, incoming) => {
  const seen = new Set(existing.map((f) => f.id));
  const next = [...existing];
  incoming.forEach((fn) => {
    const duplicate = existing.find(
      (f) => f.title.toLowerCase() === fn.title.toLowerCase()
    );
    if (duplicate) {
      next[next.indexOf(duplicate)] = {
        ...duplicate,
        status: duplicate.status === "done" ? duplicate.status : fn.status,
        steps: fn.steps,
        scaffolding: fn.scaffolding,
      };
      return;
    }
    if (!seen.has(fn.id)) {
      next.push(fn);
    }
  });
  return next;
};

const nextStatus = (status) => {
  if (status === "proposed") return "running";
  if (status === "running") return "done";
  return "proposed";
};

const syncGoals = (existing, proposals, scaffoldingDescriptor) => {
  const seen = new Set(existing.map((g) => g.title.toLowerCase()));
  const additions = proposals
    .slice(0, 3)
    .filter((fn) => !seen.has(fn.title.toLowerCase()))
    .map((fn) => ({
      id: `goal-${fn.id}`,
      title: fn.title,
      cadence: scaffoldingDescriptor.cadence,
      focus: fn.focus,
    }));
  return [...additions, ...existing].slice(0, 6);
};

const buildResponse = (prompt, proposals, descriptor) => {
  const names = proposals.map((p) => p.title).slice(0, 3).join(" · ");
  return `Understood. I’ll hold onto "${prompt}" and keep you in ${descriptor.label.toLowerCase()} (${descriptor.cadence}). How about: ${names}. Which one should go live first?`;
};

const Message = ({ role, content }) => {
  const isEdward = role === "edward";
  return (
    <div className={`ffi-message ${isEdward ? "ffi-edward" : "ffi-human"}`}>
      <div className="ffi-label">
        {isEdward ? <Sparkles size={14} /> : <ShieldCheck size={14} />}
        <span>{isEdward ? "Edward" : "You"}</span>
      </div>
      <p>{content}</p>
    </div>
  );
};

const FunctionCard = ({ fn, onPromote, onPin }) => {
  const tone = statusTone[fn.status] || statusTone.proposed;
  return (
    <div className="ffi-function">
      <div className="ffi-function__top">
        <div>
          <p className="ffi-tag">{fn.focus}</p>
          <h3>{fn.title}</h3>
          <p className="ffi-muted">{fn.highlight}</p>
        </div>
        <span className={`ffi-pill ffi-pill--${tone.tone}`}>{tone.label}</span>
      </div>
      <div className="ffi-steps">
        {fn.steps.map((step) => (
          <div key={step} className="ffi-step">
            <ArrowRight size={14} />
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div className="ffi-function__actions">
        <div className="ffi-tags">
          {fn.tags?.map((tag) => (
            <span key={tag} className="ffi-chip">
              {tag}
            </span>
          ))}
        </div>
        <div className="ffi-actions">
          <button type="button" onClick={() => onPin(fn)}>
            <Target size={16} />
            Pin to goals
          </button>
          <button type="button" onClick={() => onPromote(fn.id)}>
            <Workflow size={16} />
            {fn.status === "done" ? "Reset" : "Advance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EagleEngineeringPage() {
  const { user } = useUser();
  const { brand } = useBrand();

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const [scaffolding, setScaffolding] = useState(() =>
    load(STORAGE_KEYS.scaffolding, DEFAULT_SCAFFOLDING)
  );
  const [guardrails, setGuardrails] = useState(() =>
    load(STORAGE_KEYS.guardrails, DEFAULT_GUARDRAILS)
  );

  const seeded = useMemo(
    () => seedFunctions(scaffolding, guardrails),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [functionStack, setFunctionStack] = useState(() =>
    load(STORAGE_KEYS.functions, seeded)
  );
  const [goalStack, setGoalStack] = useState(() =>
    load(
      STORAGE_KEYS.goals,
      syncGoals([], seeded, describeScaffolding(scaffolding))
    )
  );
  const [messages, setMessages] = useState(() =>
    load(STORAGE_KEYS.messages, [
      {
        role: "edward",
        content:
          "Edward online. Tell me what you want. I’ll translate intent into functions, guardrails, and the scaffolding level you pick.",
      },
    ])
  );
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [lastSource, setLastSource] = useState("local");
  const [diagnostics, setDiagnostics] = useState(null);
  const thinkTimer = useRef(null);

  useEffect(
    () => () => {
      if (thinkTimer.current) clearTimeout(thinkTimer.current);
    },
    []
  );

  useEffect(() => {
    setFunctionStack((prev) =>
      prev.map((fn) => ({
        ...fn,
        scaffolding,
        steps: craftSteps(fn.focus, scaffolding, guardrails),
      }))
    );
  }, [scaffolding, guardrails]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.scaffolding, JSON.stringify(scaffolding));
      localStorage.setItem(STORAGE_KEYS.guardrails, JSON.stringify(guardrails));
      localStorage.setItem(STORAGE_KEYS.functions, JSON.stringify(functionStack));
      localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goalStack));
      localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    } catch {
      /* ignore persistence errors */
    }
  }, [scaffolding, guardrails, functionStack, goalStack, messages]);

  const scaffoldingDescriptor = useMemo(
    () => describeScaffolding(scaffolding),
    [scaffolding]
  );

  const profileName =
    user?.name || user?.username || user?.handle || user?.email || "you";

  const sendPrompt = async (value) => {
    const text = value.trim();
    if (!text) return;

    const proposals = synthesizeFunctions(text, scaffolding, guardrails);

    if (thinkTimer.current) clearTimeout(thinkTimer.current);
    setThinking(true);
    setLastError(null);

    const runEdward = async () => {
      const token = localStorage.getItem("token");
      const endpoint =
        import.meta.env.VITE_EAGLE_API ||
        (import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/eagle/ffi`
          : null);

      if (!endpoint) return null;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: text,
          scaffolding,
          guardrails,
          profile: profileName,
          functions: functionStack,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || `Edward endpoint error (${res.status})`;
        throw new Error(msg);
      }
      return data;
    };

    const fallbackReply = buildResponse(text, proposals, scaffoldingDescriptor);
    const fallbackProposals = proposals;

    try {
      const data = await runEdward();
      const remoteProposals = Array.isArray(data?.proposals) ? data.proposals : [];
      const remoteGoals = Array.isArray(data?.goals) ? data.goals : [];
      const merged = remoteProposals.length ? remoteProposals : fallbackProposals;
      const reply = data?.reply || fallbackReply;
      const remoteScaffolding = Number(data?.scaffolding);
      const remoteGuardrails =
        data?.guardrails && typeof data.guardrails === "object"
          ? data.guardrails
          : null;
      const diag = {
        latencyMs:
          data?.latencyMs ||
          data?.metrics?.latencyMs ||
          data?.diagnostics?.latencyMs ||
          null,
        tokens:
          data?.tokens ||
          data?.metrics?.tokensUsed ||
          data?.diagnostics?.tokens ||
          null,
        suggestedTests: Array.isArray(data?.tests) ? data.tests : [],
      };

      if (!Number.isNaN(remoteScaffolding) && remoteScaffolding > 0) {
        setScaffolding(remoteScaffolding);
      }
      if (remoteGuardrails) {
        setGuardrails((prev) => ({ ...prev, ...remoteGuardrails }));
      }

      setLastSource("remote");
      setLastError(null);
      setDiagnostics(diag);
      setMessages((prev) => [
        ...prev,
        { role: "human", content: text },
        { role: "edward", content: reply },
      ]);
      setFunctionStack((prev) => mergeFunctions(prev, merged));
      setGoalStack((prev) =>
        syncGoals(
          prev,
          remoteGoals.length ? remoteGoals : merged,
          describeScaffolding(remoteScaffolding || scaffolding)
        )
      );
      setLastSync(new Date().toISOString());
    } catch (err) {
      console.error("Edward offline, using local synthesis:", err);
      setLastError(err?.message || "Edward unavailable; using local planner.");
      setLastSource("local");
      setDiagnostics(null);
      setMessages((prev) => [
        ...prev,
        { role: "human", content: text },
        { role: "edward", content: buildResponse(text, proposals, scaffoldingDescriptor) },
      ]);
      setFunctionStack((prev) => mergeFunctions(prev, proposals));
      setGoalStack((prev) => syncGoals(prev, proposals, scaffoldingDescriptor));
    } finally {
      setThinking(false);
    }

    setPrompt("");
  };

  const toggleGuardrail = (key) => {
    setGuardrails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePromote = (id) => {
    setFunctionStack((prev) =>
      prev.map((fn) =>
        fn.id === id ? { ...fn, status: nextStatus(fn.status) } : fn
      )
    );
  };

  const handlePin = (fn) => {
    setGoalStack((prev) => {
      const exists = prev.find((g) => g.title === fn.title);
      if (exists) return prev;
      return [
        {
          id: `goal-${fn.id}`,
          title: fn.title,
          cadence: scaffoldingDescriptor.cadence,
          focus: fn.focus,
        },
        ...prev,
      ].slice(0, 6);
    });
  };

  const resetSession = () => {
    setScaffolding(DEFAULT_SCAFFOLDING);
    setGuardrails(DEFAULT_GUARDRAILS);
    const seeds = seedFunctions(DEFAULT_SCAFFOLDING, DEFAULT_GUARDRAILS);
    setFunctionStack(seeds);
    setGoalStack(syncGoals([], seeds, describeScaffolding(DEFAULT_SCAFFOLDING)));
    setMessages([
      {
        role: "edward",
        content:
          "Edward online. Tell me what you want. I’ll translate intent into functions, guardrails, and the scaffolding level you pick.",
      },
    ]);
    setDiagnostics(null);
    setLastError(null);
    setLastSource("local");
    setLastSync(null);
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="eag-shell">
      <div className="eag-ambient eag-ambient--stars" />
      <div className="eag-ambient eag-ambient--beam" />

      <div className="eag-hero">
        <div className="eag-hero__left">
          <div className="eag-badge">
            {brand?.logo ? (
              <img src={brand.logo} alt={brand?.name || "Eagle"} />
            ) : (
              <span>EE</span>
            )}
          </div>
          <div>
            <p className="eag-kicker">Function Face Interface · FFI</p>
            <h1>Eagle Engineering with Edward</h1>
            <p className="eag-sub">
              Natural language in; function plans, goals, and scaffolding out.
              Edward keeps your profile in the loop and proposes the next move.
            </p>
            <div className="eag-pills">
              <span className="ffi-pill ffi-pill--live">{scaffoldingDescriptor.label}</span>
              <span className="ffi-pill ffi-pill--soft">
                {scaffoldingDescriptor.cadence}
              </span>
              <span className="ffi-pill ffi-pill--quiet">
                Guardrails:{" "}
                {guardrailOptions
                  .filter((g) => guardrails[g.key])
                  .map((g) => g.label)
                  .join(" · ") || "off"}
              </span>
            </div>
            <div className="eag-story">
              Edward blends your face/profile with the function table. Pick how much
              scaffolding you want, and he will propose contracts, safety, and the
              next build steps with traces baked in.
            </div>
            <div className="ffi-statusbar">
              <div className="ffi-statuschip">
                {lastError ? <WifiOff size={14} /> : <Wifi size={14} />}
                <span>{lastError ? "Edward offline (local plan)" : "Edward online"}</span>
              </div>
              <div className="ffi-statusmeta">
                <span className="ffi-pill ffi-pill--quiet">
                  Source: {lastSource === "remote" ? "Remote" : "Local"}
                </span>
                <span className="ffi-pill ffi-pill--quiet">
                  Last sync: {lastSync ? new Date(lastSync).toLocaleTimeString() : "—"}
                </span>
              </div>
              {lastError && <p className="ffi-error">{lastError}</p>}
              <button type="button" className="ffi-reset" onClick={resetSession}>
                Reset FFI session
              </button>
            </div>
          </div>
        </div>
        <div className="eag-hero__panel">
          <div className="eag-row">
            <Target size={16} />
            <div>
              <p className="ffi-label-lite">Profile in context</p>
              <strong>{profileName}</strong>
            </div>
          </div>
          <div className="eag-row">
            <SatelliteDish size={16} />
            <div>
              <p className="ffi-label-lite">Edward listens</p>
              <span>Ready to translate intent into functions.</span>
            </div>
          </div>
          <div className="eag-row">
            <Gauge size={16} />
            <div>
              <p className="ffi-label-lite">Scaffolding dial</p>
              <span>{scaffoldingDescriptor.detail}</span>
            </div>
          </div>
          <div className="eag-row eag-row--metrics">
            <div className="eag-meter">
              <p className="ffi-label-lite">Functions live</p>
              <strong>{functionStack.length}</strong>
            </div>
            <div className="eag-meter">
              <p className="ffi-label-lite">Goals pinned</p>
              <strong>{goalStack.length}</strong>
            </div>
            <div className="eag-meter">
              <p className="ffi-label-lite">Guardrails</p>
              <strong>{Object.values(guardrails).filter(Boolean).length}</strong>
            </div>
          </div>
          {diagnostics && (
            <div className="eag-row eag-row--diag">
              <div>
                <p className="ffi-label-lite">Latency</p>
                <strong>{diagnostics.latencyMs ? `${diagnostics.latencyMs} ms` : "—"}</strong>
              </div>
              <div>
                <p className="ffi-label-lite">Tokens</p>
                <strong>
                  {typeof diagnostics.tokens === "object"
                    ? diagnostics.tokens?.total || diagnostics.tokens?.tokensUsed || JSON.stringify(diagnostics.tokens)
                    : diagnostics.tokens ?? "—"}
                </strong>
              </div>
              <div className="eag-tests">
                <p className="ffi-label-lite">Suggested tests</p>
                {diagnostics.suggestedTests?.length ? (
                  <ul>
                    {diagnostics.suggestedTests.slice(0, 4).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="ffi-label-lite">—</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="eag-grid">
        <section className="eag-card">
          <div className="eag-card__header">
            <div>
              <p className="eag-kicker">Pilot controls</p>
              <h2>Scaffolding + guardrails</h2>
            </div>
            <Settings2 size={18} />
          </div>

          <div className="ffi-slider">
            <div className="ffi-slider__label">
              <Gauge size={16} />
              <span>{scaffoldingDescriptor.label}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={scaffolding}
              onChange={(e) => setScaffolding(Number(e.target.value))}
            />
            <div className="ffi-slider__legend">
              <span>Solo</span>
              <span>Paired</span>
              <span>Full scaffolding</span>
            </div>
          </div>

          <div className="ffi-guardrails">
            {guardrailOptions.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`ffi-guardrail ${guardrails[g.key] ? "on" : ""}`}
                onClick={() => toggleGuardrail(g.key)}
              >
                <ShieldCheck size={14} />
                <div>
                  <p>{g.label}</p>
                  <span>{g.note}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="ffi-checklist">
            <div className="ffi-check">
              <CheckCircle2 size={16} />
              <div>
                <p>Face-to-function link</p>
                <span>Edward keeps the human request anchored to functions.</span>
              </div>
            </div>
            <div className="ffi-check">
              <CheckCircle2 size={16} />
              <div>
                <p>Scaffolding presets</p>
                <span>Adjust how much structure Edward returns.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="eag-card">
          <div className="eag-card__header">
            <div>
              <p className="eag-kicker">Function Face Interface</p>
              <h2>Chat with Edward</h2>
            </div>
            <Rocket size={18} />
          </div>

          <div className="ffi-quick">
            {quickPrompts.map((q) => (
              <button key={q} type="button" onClick={() => sendPrompt(q)}>
                <Sparkles size={14} />
                <span>{q}</span>
              </button>
            ))}
          </div>

          <div className="ffi-messages">
            {messages.map((msg, idx) => (
              <Message key={`${msg.role}-${idx}-${msg.content}`} {...msg} />
            ))}
            {thinking && (
              <div className="ffi-thinking">
                <CircleDashed size={16} className="spin" />
                <span>Edward is thinking...</span>
              </div>
            )}
          </div>

          <div className="ffi-input">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell Edward what you want built or improved..."
              rows={3}
            />
            <button type="button" onClick={() => sendPrompt(prompt)}>
              Send to Edward
            </button>
          </div>
        </section>

        <section className="eag-card">
          <div className="eag-card__header">
            <div>
              <p className="eag-kicker">Edward’s stack</p>
              <h2>Functions + goals</h2>
            </div>
            <SatelliteDish size={18} />
          </div>

          <div className="ffi-functions">
            {functionStack.map((fn) => (
              <FunctionCard
                key={fn.id}
                fn={fn}
                onPromote={handlePromote}
                onPin={handlePin}
              />
            ))}
          </div>

          <div className="ffi-goals">
            <div className="ffi-goals__header">
              <p className="eag-kicker">Goals in play</p>
              <span>{goalStack.length} active</span>
            </div>
            <div className="ffi-goal-grid">
              {goalStack.map((goal) => (
                <div key={goal.id} className="ffi-goal">
                  <div>
                    <p className="ffi-label-lite">{goal.cadence}</p>
                    <h4>{goal.title}</h4>
                    <span>{goal.focus}</span>
                  </div>
                  <Target size={16} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
