import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AdminContext } from "../../context/AdminContextProvider";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function ConfirmModal({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border shadow-xl p-5 bg-white">
        <div className="text-lg font-bold mb-2">{title}</div>
        <div className="text-sm opacity-90 mb-4 whitespace-pre-wrap">{body}</div>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 rounded-lg border" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ show, text }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[95] pointer-events-none">
      <div className="px-4 py-2 rounded-xl border shadow-lg text-sm font-semibold bg-black text-white animate-[toastIn_220ms_ease-out]">
        {text}
      </div>
      <style>{`
        @keyframes toastIn {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const Users = () => {
  const { users, setUsers } = useContext(AdminContext);

  // Confirm modal supports: deleting a user OR deleting an invite
  // { kind: "user"|"invite", payload, title, body }
  const [confirm, setConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  // Admin invitations
  const [allInvites, setAllInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Copy UI
  const [toast, setToast] = useState({ show: false, text: "" });
  const [copiedInviteId, setCopiedInviteId] = useState("");

  const rows = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const totalUsers = rows.length;
  const verifiedUsers = useMemo(() => rows.filter((u) => !!u.verified).length, [rows]);

  const invitationsSent = allInvites.length;

  const origin = window.location.origin;

  const showToast = (text) => {
    setToast({ show: true, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, text: "" }), 1400);
  };

  const copy = async (text, inviteId = "") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedInviteId(inviteId);
      window.setTimeout(() => setCopiedInviteId(""), 1200);
      showToast("Copied to clipboard ✅");
    } catch (e) {
      console.error(e);
      showToast("Copy failed (clipboard blocked)");
    }
  };

  const loadAllInvites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingInvites(true);
    try {
      // ✅ expected admin endpoint (create if missing):
      // GET  /api/v1/invitations/admin/all
      const { data } = await axios.get(`${API_URL}/invitations/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAllInvites(Array.isArray(data.invitations) ? data.invitations : []);
    } catch (e) {
      console.error(e);
      setAllInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadAllInvites();
  }, []);

  const deleteUser = async (user) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login required.");

    setDeletingId(user._id);

    try {
      // ✅ correct endpoint (since VITE_API_URL ends with /api/v1)
      await axios.delete(`${API_URL}/admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => (Array.isArray(prev) ? prev.filter((u) => u._id !== user._id) : []));
      setConfirm(null);

      await loadAllInvites();
      showToast("User deleted 🗑️");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeletingId("");
    }
  };

  const deleteInviteAdmin = async (inv) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login required.");

    setDeletingId(inv._id);

    try {
      // ✅ admin delete endpoint (create if missing):
      // DELETE /api/v1/invitations/admin/:id
      await axios.delete(`${API_URL}/invitations/admin/${inv._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Optimistic update
      setAllInvites((prev) => (Array.isArray(prev) ? prev.filter((x) => x._id !== inv._id) : []));

      setConfirm(null);
      showToast("Invitation deleted 🗑️");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to delete invitation.");
    } finally {
      setDeletingId("");
    }
  };

  const handleConfirm = () => {
    if (!confirm) return;

    if (confirm.kind === "user") return deleteUser(confirm.payload);
    if (confirm.kind === "invite") return deleteInviteAdmin(confirm.payload);

    setConfirm(null);
  };

  return (
    <div className="flex mt-16 flex-col items-center gap-4 rounded-lg p-4 bg-[#bdd8dd]">
      <div className="w-full max-w-6xl mx-auto space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs opacity-60">Total users</div>
            <div className="text-2xl font-bold tabular-nums">{totalUsers}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs opacity-60">Verified users</div>
            <div className="text-2xl font-bold tabular-nums">{verifiedUsers}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-xs opacity-60">Invitations sent</div>
            <div className="text-2xl font-bold tabular-nums">
              {loadingInvites ? "…" : invitationsSent}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="w-full rounded-2xl border bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-black/5">
            <div className="text-sm font-bold">Users</div>
          </div>

          <div className="grid grid-cols-12 text-xs font-semibold px-3 py-2 bg-black/5 border-t">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Handle</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-1 text-right">Lit🔥🔥</div>
            <div className="col-span-1 text-right">Credits</div>
            <div className="col-span-1 text-center">Verified</div>
            <div className="col-span-1 text-right">Delete</div>
          </div>

          {rows.map((user) => {
            const lit = Number.isFinite(user.lit) ? user.lit : 0;
            const credits = Number.isFinite(user.credits) ? user.credits : 0;
            const handle = user.handle ? `@${user.handle}` : "—";
            const verified = !!user.verified;

            return (
              <div
                key={user._id}
                className="grid grid-cols-12 px-3 py-2 text-sm border-t items-center"
              >
                <div className="col-span-3 font-semibold truncate">{user.name || "—"}</div>
                <div className="col-span-2 text-xs opacity-80 truncate">{handle}</div>
                <div className="col-span-3 text-xs opacity-80 truncate">{user.email || "—"}</div>
                <div className="col-span-1 text-right tabular-nums">{lit}</div>
                <div className="col-span-1 text-right tabular-nums">{credits}</div>
                <div className="col-span-1 text-center">
                  <span className={verified ? "text-green-700 font-semibold" : "text-gray-400"}>
                    {verified ? "✓" : "—"}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    className="text-xs underline text-red-700 hover:text-red-900 disabled:opacity-50"
                    disabled={deletingId === user._id}
                    onClick={() =>
                      setConfirm({
                        kind: "user",
                        payload: user,
                        title: "Delete user?",
                        body: "This will permanently delete the user account.\n\nThis is irreversible.",
                      })
                    }
                  >
                    {deletingId === user._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && <div className="px-3 py-6 text-sm opacity-70">No users found.</div>}
        </div>

        {/* Invitations table (all users) */}
        <div className="w-full rounded-2xl border bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-black/5">
            <div className="text-sm font-bold">Invitations (all users)</div>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-100"
                onClick={() => copy(`${origin}/invitations`)}
              >
                Copy invite link
              </button>
              <a
                href="/invitations"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-100"
              >
                Open tab
              </a>
              <button
                type="button"
                className="text-xs underline opacity-80"
                onClick={loadAllInvites}
              >
                {loadingInvites ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 text-xs font-semibold px-3 py-2 bg-black/5 border-t">
            <div className="col-span-3">Inviter</div>
            <div className="col-span-3">Invitee</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Invitation sent</div>
            <div className="col-span-1">Link</div>
            <div className="col-span-1 text-right">Delete</div>
          </div>

          {(allInvites || []).map((inv) => {
            const status = (inv.status || "pending").toLowerCase();
            const accepted = status === "accepted";
            const rowBg = accepted ? "bg-green-500/10" : "";
            const link = `${origin}/i/${inv.token}`;

            const inviterLabel =
              inv.inviter?.handle ? `@${inv.inviter.handle}` : inv.inviter?.name || "—";

            return (
              <div
                key={inv._id}
                className={`grid grid-cols-12 px-3 py-2 text-sm border-t ${rowBg}`}
              >
                <div className="col-span-3">
                  <div className="font-semibold truncate">{inviterLabel}</div>
                  <div className="text-xs opacity-70 truncate">{inv.inviter?.email || ""}</div>
                </div>

                <div className="col-span-3">
                  <div className="font-semibold truncate">
                    {inv.firstName} {inv.lastName}
                  </div>
                  {accepted && inv.acceptedUser?.handle && (
                    <div className="text-xs opacity-70 truncate">
                      Accepted by @{inv.acceptedUser.handle}
                    </div>
                  )}
                </div>

                <div className="col-span-2 text-xs font-semibold">
                  {accepted ? "ACCEPTED ✅" : status.toUpperCase()}
                </div>

                <div className="col-span-2 text-xs">
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "—"}
                </div>

                <div className="col-span-1">
                  {status === "pending" ? (
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => copy(link, inv._id)}
                    >
                      {copiedInviteId === inv._id ? "Copied ✅" : "Copy"}
                    </button>
                  ) : (
                    <div className="text-xs opacity-60">—</div>
                  )}
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    className="text-xs underline text-red-700 hover:text-red-900 disabled:opacity-50"
                    disabled={deletingId === inv._id}
                    onClick={() =>
                      setConfirm({
                        kind: "invite",
                        payload: inv,
                        title: "Delete invitation (admin)?",
                        body:
                          "This will permanently delete this invitation record.\n\nIt will not delete any already-created user account.",
                      })
                    }
                    title="Delete invitation"
                  >
                    {deletingId === inv._id ? "Deleting…" : "🗑️"}
                  </button>
                </div>
              </div>
            );
          })}

          {(!allInvites || allInvites.length === 0) && (
            <div className="px-3 py-6 text-sm opacity-70">
              {loadingInvites ? "Loading…" : "No invitations found."}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />

      <Toast show={toast.show} text={toast.text} />
    </div>
  );
};

export default Users;
