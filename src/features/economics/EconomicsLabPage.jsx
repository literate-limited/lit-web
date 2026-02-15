import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, SlidersHorizontal, Sparkles } from "lucide-react";

const baseParams = {
  litLightShare: 20,
  buyerBonus: 5,
  dividendShare: 75,
  potThreshold: 2500,
  potMultiplier: 1.25,
};

const sliderConfig = [
  {
    key: "litLightShare",
    label: "Lit🔥 Light share (%)",
    min: 5,
    max: 40,
    step: 1,
  },
  {
    key: "buyerBonus",
    label: "Buyer bonus (%)",
    min: 0,
    max: 15,
    step: 1,
  },
  {
    key: "dividendShare",
    label: "Dividend share (%)",
    min: 50,
    max: 90,
    step: 1,
  },
  {
    key: "potThreshold",
    label: "Lit🔥 Light funding trigger ($)",
    min: 1000,
    max: 10000,
    step: 500,
  },
  {
    key: "potMultiplier",
    label: "Pot multiplier (signals urgency)",
    min: 1,
    max: 2,
    step: 0.05,
  },
];

const EconomicsLabPage = () => {
  const [params, setParams] = useState(baseParams);

  const updateParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const shares = useMemo(() => {
    const { litLightShare, buyerBonus, dividendShare } = params;
    const total = litLightShare + buyerBonus + dividendShare;
    const adjustment = total === 100 ? 0 : 100 - total;
    return {
      litLightShare,
      buyerBonus,
      dividendShare: dividendShare + adjustment,
    };
  }, [params]);

  const samplePurchase = useMemo(() => {
    const spend = 120;
    const litLight = (spend * shares.litLightShare) / 100;
    const buyer = (spend * shares.buyerBonus) / 100;
    const dividends = spend - (litLight + buyer);
    return { spend, litLight, buyer, dividends };
  }, [shares]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      <div className="w-96 p-6 space-y-6 border-r border-slate-800 bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <SlidersHorizontal size={18} />
            <p className="text-[10px] uppercase tracking-[0.4em]">Economics Lab</p>
          </div>
          <h1 className="text-2xl font-semibold mt-2">Function Designer</h1>
          <p className="text-xs text-slate-400">
            Tune the parameters that shape how each purchase floods Lit🔥 Light, buyers, and the dividend pot.
          </p>
        </div>

        <div className="space-y-4">
          {sliderConfig.map((cfg) => (
            <div key={cfg.key} className="space-y-1 text-sm">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{cfg.label}</span>
                <span>{params[cfg.key].toFixed?.(2) ?? params[cfg.key]}</span>
              </div>
              <input
                type="range"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={params[cfg.key]}
                onChange={(event) =>
                  updateParam(cfg.key, cfg.step >= 1 ? Number(event.target.value) : Number(event.target.value))
                }
                className="w-full accent-cyan-500"
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyan-300">
            <span>Pot status</span>
            <span>litLight x{params.potMultiplier.toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-400">
            When the pot (20% share) hits ${params.potThreshold}, the Hive Mind proposes a Lit🔥 Light initiative. Adjust the multiplier to
            signal urgency.
          </p>
          <div className="h-3 w-full rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-cyan-400"
              style={{ width: `${Math.min(100, (params.potThreshold / 10000) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Math is policy</p>
            <h2 className="text-3xl font-semibold text-white">Lit🔥 Function Suite</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-300 shadow-lg shadow-cyan-500/20">
            <Sparkles size={16} />
            <span>Set a challenge for Eagle Engineering</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Lit🔥 Light", value: `${shares.litLightShare}%` },
            { label: "Buyer bonus", value: `${shares.buyerBonus}%` },
            { label: "Dividends", value: `${shares.dividendShare}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Per purchase preview ($120)</p>
          <div className="flex items-center gap-6">
            {[
              { label: "Lit🔥 Light funding", value: `$${samplePurchase.litLight.toFixed(2)}` },
              { label: "Buyer red bonus", value: `$${samplePurchase.buyer.toFixed(2)}` },
              { label: "Dividends + buybacks", value: `$${samplePurchase.dividends.toFixed(2)}` },
            ].map((item) => (
              <div key={item.label} className="flex-1 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-sm">
                <p className="text-slate-400">{item.label}</p>
                <p className="text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-400">
            <p>
              The Hive Mind will look at the generated proposal and humans can vote before the Lit🔥 Light task
              activates.
            </p>
            <p>Everything is transparent: the function definition, the pot timer, and the formulas that feed dividends.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-500/10 to-rose-500/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Function graph</p>
          <div className="mt-4 flex gap-3">
            {[
              { color: "linear-gradient(90deg, #ef4444, #f97316)", width: shares.litLightShare, label: "Lit🔥 Light" },
              { color: "linear-gradient(90deg, #06b6d4, #0ea5e9)", width: shares.buyerBonus, label: "Buyer bonus" },
              { color: "linear-gradient(90deg, #38bdf8, #22d3ee)", width: shares.dividendShare, label: "Dividends" },
            ].map((piece) => (
              <div key={piece.label} className="flex-1 space-y-1">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${piece.width}%`, background: piece.color }}
                />
                <div className="text-[10px] text-slate-300">{piece.label}: {piece.width}%</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-xs text-slate-300">
            <p>The function graph translates the percentages into the visible share of the revenue triangle.</p>
            <p>Use Eagle Engineering to propose new functions or refinements.</p>
          </div>
          <Link
            to="/eagle"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            <BarChart2 size={14} />
            Set economics challenge in Eagle Engineering
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EconomicsLabPage;
