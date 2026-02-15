import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { useBrand } from "../../brands/BrandContext";

const API_URL = import.meta.env.VITE_API_URL;

const CommentBox = ({ postId, comments, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-cyan-700 font-semibold"
      >
        {open ? "Hide comments" : "View/Add comments"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {comments.map((c) => (
              <div key={c._id || `${c.authorHandle}-${c.createdAt}`} className="text-xs text-slate-700 border border-slate-100 rounded-lg p-2">
                <div className="font-semibold">{c.authorName || "User"}</div>
                <div className="text-[11px] text-slate-500">
                  @{c.authorHandle || "anon"} · {new Date(c.createdAt).toLocaleString()}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{c.text}</div>
              </div>
            ))}
            {comments.length === 0 && <div className="text-xs text-slate-500">No comments yet.</div>}
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
};

const FeedPage = () => {
  const { user, userLoggedIn } = useUser();
  const { brandId } = useBrand();
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

  const loadFeed = async (cursor = null, append = false) => {
    if (!userLoggedIn) {
      setLoading(false);
      return;
    }
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (brandId) params.set("brand", brandId);
    try {
      if (!append) setLoading(true);
      const { data } = await axios.get(`${API_URL}/feed?${params.toString()}`, { headers });
      if (append) {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
      } else {
        setPosts(data.posts || []);
      }
      setNextCursor(data.nextCursor || null);
      setError("");
    } catch (err) {
      console.error("Feed load failed:", err);
      setError("Failed to load feed.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, userLoggedIn]);

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

  const canPost = userLoggedIn;

  const toggleLike = async (postId) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/feed/${postId}/like`,
        {},
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likes: data.likes, liked: data.liked }
            : p
        )
      );
    } catch (err) {
      console.error("Like failed:", err);
      setError("Failed to like post.");
    }
  };

  const addComment = async (postId, commentText, clear) => {
    const body = String(commentText || "").trim();
    if (!body) return;
    try {
      const { data } = await axios.post(
        `${API_URL}/feed/${postId}/comments`,
        { text: body },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), data.comment],
              }
            : p
        )
      );
      clear?.();
    } catch (err) {
      console.error("Comment failed:", err);
      setError("Failed to comment.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Feed</h1>
        <p className="text-sm text-slate-600">
          Adaptive feed for Lit🔥; scoped to brand ({brandId || user?.brand || "lit"}).
        </p>
      </div>

      {canPost && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Share a thought, update, or link..."
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
              className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {creating ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-slate-600">Loading…</div>}

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post._id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm p-4"
          >
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
                {(post.authorName || "User").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {post.authorName || "User"}
                </p>
                <p className="text-xs text-slate-500">
                  @{post.authorHandle || "anon"} · {new Date(post.createdAt).toLocaleString()}
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
                <span role="img" aria-label="like">
                  ❤️
                </span>
                <span>{post.likes || 0}</span>
              </button>
              <span>{(post.comments || []).length} comments</span>
            </div>

            <CommentBox postId={post._id} comments={post.comments || []} onAdd={addComment} />
          </div>
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center my-4">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              loadFeed(nextCursor, true);
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
