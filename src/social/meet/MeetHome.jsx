import { useCallback, useState } from "react";
import { useUser } from "../../context/UserContext";
import MeetDocPromptModal from "./MeetDocModal";

export default function MeetHome() {
  const { user } = useUser();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [joinUrl, setJoinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const createMeetLink = async (payload) => {
    const res = await fetch(`${API_URL}/meet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to create meet");
    if (!data?.joinUrl) throw new Error("Meet endpoint did not return joinUrl");
    return data.joinUrl;
  };

  const fetchDocs = useCallback(async () => {
    if (!token) return [];

    const res = await fetch(`${API_URL}/docs`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to fetch docs");

    return (data?.documents || []).slice().sort((a, b) => {
      const ta = new Date(a.updatedAt || 0).getTime();
      const tb = new Date(b.updatedAt || 0).getTime();
      return tb - ta;
    });
  }, [API_URL, token]);

  const createDoc = async () => {
    const title = `Meet Doc — ${new Date().toLocaleDateString()}`;

    const res = await fetch(`${API_URL}/docs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to create doc");

    const id = data?._id || data?.document?._id;
    if (!id) throw new Error("Docs endpoint did not return a document id");
    return id;
  };

  const createShareToken = async (docId, role = "editor") => {
    const res = await fetch(`${API_URL}/docs/${docId}/share-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || "Failed to create share link");
    if (!data?.token) throw new Error("Share-link endpoint did not return token");
    return data.token;
  };

  const handleModalConfirm = async ({ mode, selectedDocId }) => {
    setLoading(true);
    try {
      // No doc: create a normal meet link (same as before)
      if (mode === "none") {
        const meetUrl = await createMeetLink();
        setJoinUrl(meetUrl);
        setDocModalOpen(false);
        return;
      }

      // Determine doc
      let docId = "";
      if (mode === "new") docId = await createDoc();
      if (mode === "existing") docId = selectedDocId || "";
      if (!docId) throw new Error("No doc selected");

      // Generate a public token so guests can load it
      const sharedDoc = await createShareToken(docId, "editor");

      // ✅ NEW: store attachment server-side so URL stays short
      const meetUrl = await createMeetLink({ docId, sharedDoc });

      setJoinUrl(meetUrl);
      setDocModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to generate tutoring link");
    } finally {
      setLoading(false);
    }
  };

  const onClickCreate = () => setDocModalOpen(true);

  const copy = async () => {
    await navigator.clipboard.writeText(joinUrl);
    alert("Copied!");
  };

  if (!user || !token) {
    return <div className="p-6">Please log in to create a meeting.</div>;
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Meet</h1>

      <button
        onClick={onClickCreate}
        disabled={loading}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create meeting link"}
      </button>

      {joinUrl && (
        <div className="mt-4 space-y-2">
          <div className="p-3 rounded border break-words">{joinUrl}</div>
          <div className="flex gap-2">
            <button onClick={copy} className="px-4 py-2 rounded border">
              Copy link
            </button>
            <a href={joinUrl} className="px-4 py-2 rounded bg-blue-600 text-white">
              Start now
            </a>
          </div>
        </div>
      )}

      <MeetDocPromptModal
        open={docModalOpen}
        onClose={() => !loading && setDocModalOpen(false)}
        onConfirm={handleModalConfirm}
        fetchDocs={fetchDocs}
        loading={loading}
      />
    </div>
  );
}
