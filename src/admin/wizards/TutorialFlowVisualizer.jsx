// src/admin/wizards/TutorialFlowVisualizer.jsx
// Displays tutorial sequences per invite/onboarding track

import { INVITE_TUTORIALS } from "../../onboarding/tutorials";

const GROUPS = [
  { id: "multi", name: "Multi-role", color: "#6366f1", icon: "🧭" },
  { id: "student", name: "Student", color: "#0ea5e9", icon: "📚" },
  { id: "parent", name: "Parent", color: "#f97316", icon: "👪" },
  { id: "friend", name: "Friend", color: "#22c55e", icon: "🤝" },
  { id: "teacher", name: "Teacher", color: "#a855f7", icon: "🎓" },
  { id: "default", name: "Default", color: "#475569", icon: "⭐" },
];

function TutorialCard({ item, index, color }) {
  return (
    <div
      className="rounded-xl border p-4 shadow-sm bg-white flex flex-col gap-2"
      style={{ borderColor: `${color}44` }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </span>
        <span className="text-slate-800">{item.title}</span>
      </div>
      <p className="text-sm text-slate-600">{item.summary}</p>
      <div className="text-xs text-slate-500">Link: {item.href}</div>
    </div>
  );
}

export default function TutorialFlowVisualizer({ activeGroup = "multi" }) {
  const tutorials = INVITE_TUTORIALS[activeGroup] || [];
  const groupMeta = GROUPS.find((g) => g.id === activeGroup) || GROUPS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{groupMeta.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {groupMeta.name} Tutorials
          </h2>
          <p className="text-sm text-slate-600">
            {tutorials.length} steps tailored to this onboarding path.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tutorials.map((item, idx) => (
          <TutorialCard key={item.id} item={item} index={idx} color={groupMeta.color} />
        ))}
        {tutorials.length === 0 && (
          <div className="text-slate-500 text-sm">No tutorials defined for this group yet.</div>
        )}
      </div>
    </div>
  );
}
