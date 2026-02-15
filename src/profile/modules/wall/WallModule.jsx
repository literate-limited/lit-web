import { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return "?";
}

function CommentBox({ postId, comments, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-cyan-700 font-semibold"
      >
        {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? "s" : ""}` : "Add comment"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {comments.map((c) => (
              <div
                key={c._id || `${c.authorHandle}-${c.createdAt}`}
                className="text-xs text-slate-700 border border-slate-100 rounded-lg p-2"
              >
                <div className="font-semibold">{c.authorName || "User"}</div>
                <div className="text-[11px] text-slate-500">
                  @{c.authorHandle || "anon"} · {new Date(c.createdAt).toLocaleString()}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{c.text}</div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-xs text-slate-500">No comments yet.</div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Add a comment…"
              maxLength={800}
            />
            <button
              type="button"
              onClick={() => onAdd(postId, text, () => setText(""))}
              disabled={!text.trim()}
              className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WallModule({
  module,
  viewMode,
  profileUser,
  viewer,
}) {
  const isSelf = viewMode === "self";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const headers = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadPosts = async (cursor = null, append = false) => {
    if (!profileUser?._id) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);

    try {
      if (!append) setLoading(true);
      const { data } = await axios.get(
        `${API_URL}/feed/user/${profileUser._id}?${params.toString()}`,
        { headers }
      );
      if (append) {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
      } else {
        setPosts(data.posts || []);
      }
      setNextCursor(data.nextCursor || null);
      setError("");
    } catch (err) {
      console.error("Wall load failed:", err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUser?._id]);

  const submitPost = async () => {
    const body = text.trim();
    if (!body) return;
    setCreating(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/feed`,
        { text: body },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      setPosts((prev) => [data.post, ...prev]);
      setText("");
    } catch (err) {
      console.error("Create post failed:", err);
      setError("Failed to post. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/feed/${postId}/like`,
        {},
        { headers }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likes: data.likes, liked: data.liked } : p
        )
      );
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const addComment = async (postId, commentText, clear) => {
    const body = String(commentText || "").trim();
    if (!body) return;
    try {
      const { data } = await axios.post(
        `${API_URL}/feed/${postId}/comments`,
        { text: body },
        { headers }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments || []), data.comment] }
            : p
        )
      );
      clear?.();
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">
          {isSelf ? "My Wall" : `${profileUser?.name?.split(" ")[0] || "User"}'s Wall`}
        </div>
      </div>

      {/* Post composer (self only) */}
      {isSelf && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            placeholder="What's on your mind?"
            rows={3}
            maxLength={2000}
            disabled={creating}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>{text.length}/2000</span>
            <button
              type="button"
              onClick={submitPost}
              disabled={creating || !text.trim()}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {creating ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-slate-600 py-4 text-center">Loading posts…</div>}

      {!loading && posts.length === 0 && (
        <div className="text-sm text-slate-500 py-8 text-center">
          {isSelf ? "You haven't posted anything yet. Share your first update!" : "No posts yet."}
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post._id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold overflow-hidden">
                {profileUser?.profilePicture ? (
                  <img
                    src={profileUser.profilePicture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(post.authorName)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {post.authorName || "User"}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-3 text-slate-800 whitespace-pre-wrap text-sm">{post.text}</p>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => toggleLike(post._id)}
                className="flex items-center gap-1 hover:text-cyan-700"
              >
                <span role="img" aria-label="like">❤️</span>
                <span>{post.likes || 0}</span>
              </button>
            </div>

            <CommentBox
              postId={post._id}
              comments={post.comments || []}
              onAdd={addComment}
            />
          </div>
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              loadPosts(nextCursor, true);
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
