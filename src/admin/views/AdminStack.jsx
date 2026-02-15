import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiActivity,
  FiClock,
  FiCpu,
  FiRefreshCcw,
  FiUsers,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

function Sparkline({ data, height = 180, color = "#0ea5e9" }) {
  if (!data?.length) {
    return (
      <div className="text-sm text-gray-500">
        No history yet. Once the sleep stack writes logs, you'll see a trendline here.
      </div>
    );
  }

  const normalized = data.map((point, idx) => ({
    x: idx,
    y: point.live || 0,
    label: point.timestamp,
  }));
  const maxY =
    normalized.reduce((max, p) => (p.y > max ? p.y : max), 0) || 1;
  const width = Math.max(320, normalized.length * 18);
  const step = normalized.length > 1 ? width / (normalized.length - 1) : width;
  const points = normalized.map((p, idx) => ({
    x: idx * step,
    y: height - (p.y / maxY) * height,
  }));

  const path = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = points[points.length - 1];

  const tickIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1]
    .filter((i, idx, arr) => arr.indexOf(i) === idx && i >= 0)
    .sort((a, b) => a - b);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Live agents over time"
      >
        <defs>
          <linearGradient id="stackArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#stackArea)" />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {lastPoint ? (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="5"
            fill="#111827"
            stroke={color}
            strokeWidth="2"
          />
        ) : null}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        {tickIndexes.map((idx) => {
          const label = normalized[idx]?.label;
          if (!label) return null;
          const date = new Date(label);
          return (
            <span key={idx}>
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function AgentBadge({ agent }) {
  const live = !!agent.live;
  const status =
    live ? "Live" : agent.configStatus === "ACTIVE" ? "Ready" : "Dormant";
  const tone = live
    ? "bg-green-100 text-green-800 border-green-200"
    : agent.configStatus === "ACTIVE"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${tone}`}>
      <div className="text-2xl">{agent.icon || "👤"}</div>
      <div className="flex-1">
        <div className="font-semibold">{agent.name}</div>
        <div className="text-xs text-gray-600">{agent.role}</div>
      </div>
      <div className="text-xs font-semibold px-3 py-1 rounded-full border border-white/40">
        {status}
      </div>
    </div>
  );
}

export default function AdminStack() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/stack`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const liveAgents = useMemo(
    () => data?.current?.agents?.filter((agent) => agent.live) || [],
    [data]
  );
  const restingAgents = useMemo(
    () => data?.current?.agents?.filter((agent) => !agent.live) || [],
    [data]
  );
  const history = data?.history || [];
  const summary = data?.current?.summary || {};
  const configuredTotal = summary.totalConfigured || data?.current?.agents?.length || 0;
  const lastUpdated = data?.current?.timestamp
    ? new Date(data.current.timestamp).toLocaleString()
    : null;

  if (loading) return <p className="p-4">Loading stack…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-sky-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-sky-200">
            <FiActivity />
            Stack
          </div>
          <h1 className="text-3xl font-bold">Agents on deck</h1>
          <p className="text-sm text-sky-100 max-w-xl">
            Live view of the entourage plus a timeline of when they were working.
          </p>
          {lastUpdated && (
            <div className="text-xs text-sky-100 flex items-center gap-2">
              <FiClock />
              Updated {lastUpdated}
            </div>
          )}
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/15 border border-white/20"
          >
            <FiRefreshCcw />
            Refresh now
          </button>
        </div>
        <div className="bg-white/10 rounded-xl p-4 min-w-[220px]">
          <div className="text-sm text-sky-100">Agents working</div>
          <div className="text-5xl font-bold">{summary.liveProcesses ?? 0}</div>
          <div className="text-sm text-sky-100">
            {summary.mappedLiveAgents ?? 0} mapped · {configuredTotal} configured
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white"
              style={{
                width:
                  configuredTotal > 0
                    ? `${Math.min(
                        100,
                        Math.round(((summary.liveProcesses || 0) / configuredTotal) * 100)
                      )}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiCpu />
            Live processes
          </div>
          <div className="text-3xl font-semibold">{summary.liveProcesses ?? 0}</div>
          <div className="text-xs text-gray-500">
            Includes unmapped Claude sessions.
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiUsers />
            Mapped agents
          </div>
          <div className="text-3xl font-semibold">{summary.mappedLiveAgents ?? 0}</div>
          <div className="text-xs text-gray-500">
            Linked to entourage identities.
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiActivity />
            Active (config)
          </div>
          <div className="text-3xl font-semibold">{summary.activeConfigured ?? 0}</div>
          <div className="text-xs text-gray-500">Marked ACTIVE in config.</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiClock />
            Dormant (config)
          </div>
          <div className="text-3xl font-semibold">{summary.dormantConfigured ?? 0}</div>
          <div className="text-xs text-gray-500">Sleeping by design.</div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Current crew</h2>
            <p className="text-sm text-gray-600">
              Who is live right now (mapped via TTY) plus who is ready to launch.
            </p>
          </div>
        </div>

        {liveAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {liveAgents.map((agent) => (
              <AgentBadge key={agent.key} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No mapped agents are live.</div>
        )}

        {restingAgents.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Ready or dormant
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {restingAgents.map((agent) => (
                <AgentBadge key={agent.key} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {data?.current?.unknownProcesses?.length ? (
          <div className="border rounded-xl p-3 bg-amber-50 border-amber-200 text-sm text-amber-900 space-y-2">
            <div className="font-semibold">Unmapped sessions detected</div>
            <div className="space-y-1">
              {data.current.unknownProcesses.map((proc) => (
                <div key={`${proc.pid}-${proc.tty}`} className="flex justify-between">
                  <span className="font-mono text-xs">
                    {proc.pid} ({proc.tty}) · {proc.command}
                  </span>
                  <span className="text-xs text-amber-700">
                    {proc.cpu?.toFixed ? proc.cpu.toFixed(1) : proc.cpu}% CPU
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">When they worked</h2>
            <p className="text-sm text-gray-600">
              Live count per sleep-stack cycle (15-minute cadence).
            </p>
          </div>
          {!data?.logsAvailable && (
            <div className="text-xs text-red-600">
              Sleep stack log not found — history may be incomplete.
            </div>
          )}
        </div>

        <Sparkline data={history} color="#0ea5e9" />

        {history.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
              Live agents per cycle
            </span>
            <span>
              Latest cycle:{" "}
              {new Date(history[history.length - 1].timestamp).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
