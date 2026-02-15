const LABELS = {
  self: "SELF",
  friend: "FRIEND",
  nonFriend: "NON-FRIEND",
  guest: "GUEST",
};

export default function RelationshipChip({ mode }) {
  const label = LABELS[mode] || String(mode || "").toUpperCase();

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow border";

  const cls =
    mode === "self"
      ? "bg-green-100 text-green-800 border-green-200"
      : mode === "friend"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : mode === "guest"
      ? "bg-slate-100 text-slate-800 border-slate-200"
      : "bg-orange-100 text-orange-800 border-orange-200";

  return <div className={`${base} ${cls}`}>{label}</div>;
}
