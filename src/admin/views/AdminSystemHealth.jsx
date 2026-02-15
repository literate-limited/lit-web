import { FiActivity } from "react-icons/fi";
import ViewProdServerLogs from "./ViewProdServerLogs";

const snapshots = [
  { label: "API latency", value: "210ms" },
  { label: "Error rate", value: "0.7%" },
  { label: "Socket health", value: "Stable" },
  { label: "Queue backlog", value: "14 tasks" },
];

export default function AdminSystemHealth() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          <FiActivity /> System health
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mt-2">Live operational telemetry</h2>
        <div className="grid grid-cols-4 gap-4 mt-6">
          {snapshots.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ViewProdServerLogs />
      </div>
    </div>
  );
}
