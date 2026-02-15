import { FiFilm, FiImage, FiMic, FiArrowRight } from "react-icons/fi";

const opsCards = [
  { label: "Video queue", description: "Review edits, approve releases, flag content.", icon: <FiFilm /> , target: "view-videos"},
  { label: "Audio assets", description: "Curate clips, clean uploads, build packs.", icon: <FiMic />, target: "view-audios"},
  { label: "Image library", description: "Manage UI assets, hero art, and banners.", icon: <FiImage />, target: "view-images"},
];

export default function AdminContentOps({ onNavigate }) {
  const navigate = typeof onNavigate === "function" ? onNavigate : () => {};

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Content operations</h2>
        <p className="text-sm text-slate-500 mt-2">
          Control the pipelines that produce and ship TTV assets. Move into specific queues for review.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          {opsCards.map((card) => (
            <button
              key={card.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-cyan-300"
              onClick={() => navigate(card.target)}
            >
              <div className="flex items-center gap-2 text-slate-600">{card.icon}</div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{card.label}</p>
              <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-cyan-600">
                Open <FiArrowRight />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
