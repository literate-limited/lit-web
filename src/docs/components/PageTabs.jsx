import { Plus } from "lucide-react";
import { useState } from "react";

export default function PageTabs({
  pages,
  activePageId,
  onSelectPage,
  onRenamePage,
  onOpenAddPage,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {pages.map((p) => {
            const active = p.id === activePageId;
            const isRenaming = renamingId === p.id;

            return (
              <div key={p.id}>
                {isRenaming ? (
                  <input
                    className="px-3 py-1 text-sm border border-teal-400 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRenamePage(p.id, draftTitle.trim() || p.title);
                        setRenamingId(null);
                      }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={() => {
                      onRenamePage(p.id, draftTitle.trim() || p.title);
                      setRenamingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => onSelectPage(p.id)}
                    onDoubleClick={() => {
                      setRenamingId(p.id);
                      setDraftTitle(p.title || "");
                    }}
                    className={[
                      "px-3 py-1 rounded-xl border shadow-sm whitespace-nowrap",
                      active
                        ? "bg-teal-50 border-teal-200"
                        : "bg-white border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                    title={p.title}
                  >
                    <span className="text-sm text-gray-800 font-medium">
                      {p.title}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onOpenAddPage}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        title="Add page"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add</span>
      </button>
    </div>
  );
}
