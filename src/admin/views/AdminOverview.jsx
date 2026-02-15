import { FiAlertTriangle, FiArrowRight, FiActivity, FiDollarSign, FiUsers } from "react-icons/fi";

const metricCards = [
  { label: "Uptime", value: "99.98%", tone: "bg-emerald-100 text-emerald-700" },
  { label: "API Errors (24h)", value: "0.7%", tone: "bg-amber-100 text-amber-700" },
  { label: "Queue Backlog", value: "14 tasks", tone: "bg-slate-100 text-slate-700" },
  { label: "Staging Runs", value: "3 active", tone: "bg-cyan-100 text-cyan-700" },
];

const economyCards = [
  { label: "Red Credits Issued", value: "42,880", sub: "24h total" },
  { label: "Dividend Pool", value: "$18,420", sub: "current epoch" },
  { label: "Lit🔥 Light Pot", value: "$7,200", sub: "73% to threshold" },
  { label: "Cash-outs Pending", value: "28", sub: "awaiting approval" },
];

const userCards = [
  { label: "Verified Humans", value: "12,440" },
  { label: "Verified Adults", value: "7,812" },
  { label: "Referral Velocity", value: "+18% wk/wk" },
  { label: "CLOUD Median", value: "142" },
];

const contentCards = [
  { label: "Scripts Ready", value: "33" },
  { label: "TTVTV Campaigns", value: "4 active" },
  { label: "Video QC Queue", value: "12" },
  { label: "Media Flags", value: "2" },
];

const alerts = [
  { title: "Payment gateway latency spike", tone: "bg-amber-100 text-amber-700" },
  { title: "Staging build #214 awaiting sign-off", tone: "bg-slate-100 text-slate-600" },
  { title: "Referral anomaly check pending", tone: "bg-rose-100 text-rose-700" },
];

export default function AdminOverview({ onNavigate }) {
  const navigate = typeof onNavigate === "function" ? onNavigate : () => {};

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-3 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                <FiActivity /> System health
              </p>
              <h2 className="text-xl font-semibold text-slate-900 mt-2">Operational pulse</h2>
              <p className="text-sm text-slate-500">
                A single snapshot of the platform’s operational status.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 hover:border-cyan-300 hover:text-cyan-600"
              onClick={() => navigate("system-health")}
            >
              View logs <FiArrowRight />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {metricCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${card.tone}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                <FiDollarSign /> Economy & credits
              </p>
              <button
                className="text-xs uppercase tracking-[0.3em] text-cyan-600 hover:text-cyan-500"
                onClick={() => navigate("revenue-credits")}
              >
                Open ledger
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {economyCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-400">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                <FiUsers /> Users & trust
              </p>
              <button
                className="text-xs uppercase tracking-[0.3em] text-cyan-600 hover:text-cyan-500"
                onClick={() => navigate("users")}
              >
                View users
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {userCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <FiActivity /> Content ops
            </p>
            <button
              className="text-xs uppercase tracking-[0.3em] text-cyan-600 hover:text-cyan-500"
              onClick={() => navigate("content-ops")}
            >
              Open queues
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {contentCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-lg font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-1 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <FiAlertTriangle /> Alerts
          </div>
          <div className="space-y-3 mt-4">
            {alerts.map((alert) => (
              <div key={alert.title} className={`rounded-xl px-3 py-2 text-xs ${alert.tone}`}>
                {alert.title}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Next review</p>
          <p className="text-lg font-semibold mt-2">Branch approvals</p>
          <p className="text-xs text-slate-300 mt-2">
            Ensure staging sign-offs and TTVStars budgets are logged before promoting to prod.
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-500 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-100 hover:border-cyan-300 hover:text-cyan-200"
            onClick={() => navigate("branch-manager")}
          >
            Open Branch Manager <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}
