import { useEffect, useMemo, useState } from "react";

export default function MeetDocPromptModal({
  open,
  onClose,
  onConfirm,
  fetchDocs, // async () => docs[]
  loading,
}) {
  const [mode, setMode] = useState("new"); // "new" | "existing" | "none"
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    let alive = true;

    (async () => {
      setDocsLoading(true);
      try {
        const list = await fetchDocs();
        if (!alive) return;
        setDocs(list || []);
        // default selection: most recently updated doc if present
        if (list?.length && !selectedDocId) setSelectedDocId(list[0]._id);
      } finally {
        if (alive) setDocsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => (d.title || "").toLowerCase().includes(q));
  }, [docs, search]);

  if (!open) return null;

  const canConfirm =
    !loading &&
    (mode === "none" || mode === "new" || (mode === "existing" && !!selectedDocId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* modal */}
      <div className="relative z-10 w-[min(720px,92vw)] rounded-xl bg-white shadow-xl border">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold">Would you like a SharedDoc for this meet?</h2>
          <p className="text-sm text-gray-600 mt-1">
            This will generate a single tutoring link that opens the call and the doc together.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={[
                "text-left rounded-lg border p-4 transition",
                mode === "new" ? "border-black ring-2 ring-black/10" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <div className="font-semibold">1) Yes, make a new doc</div>
              <div className="text-sm text-gray-600 mt-1">Creates a fresh document for this session.</div>
            </button>

            <button
              type="button"
              onClick={() => setMode("existing")}
              className={[
                "text-left rounded-lg border p-4 transition",
                mode === "existing" ? "border-black ring-2 ring-black/10" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <div className="font-semibold">2) Select existing doc</div>
              <div className="text-sm text-gray-600 mt-1">Pick from your docs library.</div>
            </button>

            <button
              type="button"
              onClick={() => setMode("none")}
              className={[
                "text-left rounded-lg border p-4 transition",
                mode === "none" ? "border-black ring-2 ring-black/10" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <div className="font-semibold">3) No doc necessary</div>
              <div className="text-sm text-gray-600 mt-1">Call only.</div>
            </button>
          </div>

          {/* Existing doc picker */}
          {mode === "existing" && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="font-semibold">Choose a doc</div>
                <input
                  className="md:ml-auto border rounded px-3 py-2 w-full md:w-[320px]"
                  placeholder="Search by title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {docsLoading ? (
                <div className="text-sm text-gray-600">Loading docs…</div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-sm text-gray-600">No matching docs.</div>
              ) : (
                <div className="max-h-[280px] overflow-y-auto border rounded">
                  {filteredDocs.map((d) => {
                    const active = d._id === selectedDocId;
                    return (
                      <button
                        key={d._id}
                        type="button"
                        onClick={() => setSelectedDocId(d._id)}
                        className={[
                          "w-full text-left px-4 py-3 border-b last:border-b-0",
                          active ? "bg-gray-100" : "hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="font-medium truncate">{d.title || "Untitled Document"}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Updated: {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : "—"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm({ mode, selectedDocId })}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate link"}
          </button>
        </div>
      </div>
    </div>
  );
}
