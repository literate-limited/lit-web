import { NavLink } from "react-router-dom";
import { TbMathFunction } from "react-icons/tb";
import { PiCompassDuotone, PiWaveSineDuotone } from "react-icons/pi";
import { FiBox, FiThermometer } from "react-icons/fi";

const tabs = [
  {
    id: "lit-functions",
    name: "Lit🔥 Functions",
    description: "Sketch expressions, pick colors, and see them burn across the plane.",
    to: "/math-madness",
    icon: <TbMathFunction size={22} />,
    end: true,
  },
  {
    id: "lit-functions-3d",
    name: "Lit🔥 Functions 3D",
    description: "Plot z = f(x, y) as a surface and export it as a GLB asset.",
    to: "/math-madness/3d",
    icon: <FiBox size={20} />,
    end: true,
  },
  {
    id: "maxwell",
    name: "Maxwell's Equations",
    description: "Phase-lock E and B, tune a light beam, and feel its pulse.",
    to: "/math-madness/maxwell",
    icon: <PiWaveSineDuotone size={22} />,
    end: true,
  },
  {
    id: "thermo",
    name: "Thermodynamics",
    description: "Run a heat engine loop and watch p-v area and entropy balance.",
    to: "/math-madness/thermo",
    icon: <FiThermometer size={20} />,
    end: true,
  },
];

const MathMadnessSidebar = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#0b1021]/90 backdrop-blur-lg">
      <div className="px-5 py-6 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 via-emerald-400/20 to-indigo-500/20 text-cyan-200 shadow-inner shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <PiCompassDuotone size={22} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
              Math-Madness
            </p>
            <p className="text-lg font-semibold text-slate-50">Graph Labs</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Glide between tabs as the suite grows: graph the plane or pilot Maxwell&apos;s light lab.
        </p>
      </div>

      <nav className="px-3 py-5">
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                    "border border-transparent",
                    isActive
                      ? "border-cyan-400/70 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                      : "text-slate-400 hover:text-slate-100 hover:border-slate-700/60 hover:bg-slate-800/40",
                  ].join(" ")
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/60 text-cyan-200 shadow-inner shadow-cyan-500/10">
                  {tab.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{tab.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {tab.description}
                  </span>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default MathMadnessSidebar;
