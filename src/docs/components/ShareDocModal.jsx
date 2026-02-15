import { useMemo, useState } from "react";
import Modal from "./Modal";

export default function ShareDocModal({ open, onClose, docId, apiUrl }) {
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");

  const canCopy = useMemo(() => !!shareLink && !!navigator?.clipboard, [shareLink]);

  const generateLink = async () => {
    setError("");
    setLoading(true);
    setShareLink("");

    try {
      const token = localStorage.getItem("token");

      // Expected backend endpoint:
      // POST /docs/:id/share-link  { role: "viewer"|"commenter"|"editor" }
      // -> { link: "https://..." }
      const res = await fetch(`${apiUrl}/docs/${docId}/share-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to generate link (${res.status})`);
      }

      const data = await res.json();
      const link = data.link || data.shareLink || data.url || "";
      if (!link) throw new Error("Backend did not return a link");

      setShareLink(link);
    } catch (e) {
      console.error("❌ Share link error:", e);
      setError(e.message || "Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(shareLink);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setError("");
        setLoading(false);
        setShareLink("");
        onClose();
      }}
      title="Share this document"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">Permission</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="viewer">Viewer (read only)</option>
            <option value="commenter">Commenter</option>
            <option value="editor">Editor</option>
          </select>
        </div>

        <button
          onClick={generateLink}
          disabled={loading}
          className="w-full rounded-xl bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 disabled:bg-gray-300"
        >
          {loading ? "Generating…" : "Generate link"}
        </button>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        {shareLink ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Share link</div>
            <div className="flex items-center gap-2">
              <input
                value={shareLink}
                readOnly
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={copy}
                disabled={!canCopy}
                className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Copy
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Anyone with this link will get <span className="font-semibold">{role}</span> access (per your backend rules).
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
