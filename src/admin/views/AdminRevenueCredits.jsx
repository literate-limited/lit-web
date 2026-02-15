import { FiDollarSign, FiPieChart, FiTrendingUp } from "react-icons/fi";

const summary = [
  { label: "Buyer bonus rate", value: "5%" },
  { label: "Lit🔥 Light share", value: "20%" },
  { label: "Dividend reserve", value: "75%" },
];

const ledgerItems = [
  { label: "Card purchases (24h)", value: "$12,480" },
  { label: "Red credits minted", value: "8,920" },
  { label: "Cash-outs approved", value: "14" },
  { label: "Refunds pending", value: "3" },
];

export default function AdminRevenueCredits() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          <FiDollarSign /> Revenue & credits
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mt-2">Economic control plane</h2>
        <p className="text-sm text-slate-500 mt-2">
          Visible allocation for every purchase. These ratios are set by governance and enforced by the payment service.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <FiPieChart /> Allocation preview
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Each purchase feeds Lit🔥 Light, buyer bonus red credits, and the dividend pool.</p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              Example: $100 purchase → $20 Lit🔥 Light, $5 buyer bonus, $75 dividends.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <FiTrendingUp /> Ledger snapshot
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {ledgerItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
