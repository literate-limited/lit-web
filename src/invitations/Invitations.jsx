import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import PreFillWizard from "./PreFillWizard";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const INVITE_TYPES = [
  {
    value: "friend",
    label: "Friend",
    emoji: "👥",
    description: "Invite someone to connect as a viewer or collaborator within Teleprompt TV.",
  },
  {
    value: "student",
    label: "Student",
    emoji: "📚",
    description: "Invite a learner to join your classroom and schedule sessions.",
  },
  {
    value: "parent",
    label: "Parent",
    emoji: "👪",
    description: "Invite a parent to stay in the loop about their child’s learning journey.",
  },
];

function Modal({ open, title, body, onCancel, onConfirm, confirmText = "Yes", cancelText = "No" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        <div className="mt-3 text-sm text-slate-600">{body}</div>
        <div className="mt-5 flex justify-end gap-3 text-sm">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="ttv-pill rounded-2xl px-4 py-2 text-sm font-semibold text-white"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ text, show }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[95] pointer-events-none">
      <div className="ttv-surface rounded-full border border-slate-200 p-3 text-sm font-semibold shadow-lg">
        {text}
      </div>
    </div>
  );
}

export default function Invitations() {
  const { user } = useUser();

  const [fullName, setFullName] = useState("");
  const [inviteTypes, setInviteTypes] = useState(["friend"]);
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [lastGenKey, setLastGenKey] = useState("");
  const [toast, setToast] = useState({ show: false, text: "" });
  const [copiedPrimary, setCopiedPrimary] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState(null);

  const origin = window.location.origin;

  const currentKey = useMemo(() => fullName.trim(), [fullName]);

  useEffect(() => {
    if (generated && currentKey !== lastGenKey) {
      setGenerated(null);
      setCopiedPrimary(false);
    }
  }, [currentKey, generated, lastGenKey]);

  const showToast = (text) => {
    setToast({ show: true, text });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, text: "" }), 1400);
  };

  const copyText = async (text, opts = {}) => {
    const markCopied = () => {
      if (opts.primary) {
        setCopiedPrimary(true);
        window.setTimeout(() => setCopiedPrimary(false), 1200);
      }
      if (opts.rowId) {
        setCopiedRowId(opts.rowId);
        window.setTimeout(() => setCopiedRowId(""), 1200);
      }
    };

    try {
      await navigator.clipboard.writeText(text);
      markCopied();
      showToast("Copied to clipboard ✅");
    } catch (e) {
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        markCopied();
        showToast("Copied to clipboard ✅");
      } catch (err) {
        console.error(err);
        showToast("Copy failed (clipboard blocked)");
      }
    }
  };

  const loadInvites = async () => {
    setLoadingInvites(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/invitations/mine`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setInvites(Array.isArray(data.invitations) ? data.invitations : []);
    } catch (e) {
      console.error(e);
      setInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const createInvite = async (prefillData = null) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login required.");
    const raw = fullName.trim().replace(/\s+/g, " ");
    const parts = raw.split(" ").filter(Boolean);

    if (parts.length < 1) {
      return alert("Please enter a name.");
    }

    const firstName = parts[0];
    const lastName = parts.length >= 2 ? parts.slice(1).join(" ") : "";

    try {
      const payload = {
        firstName,
        lastName,
        inviteType: inviteTypes[0], // legacy compatibility
        inviteTypes,
      };

      // Add wizard data if provided
      if (prefillData) {
        if (prefillData.student) {
          payload.student = prefillData.student;
        }
        if (prefillData.parent) {
          payload.parent = prefillData.parent;
        }
      }

      const { data } = await axios.post(`${API_URL}/invitations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        return alert(data.message || "Failed to create invite.");
      }

      const inviteToken = data.token || data.invitation?.token;

      if (!inviteToken) {
        console.error("No token in response:", data);
        return alert("Invite created but no token returned. Please refresh and try again.");
      }

      const shortUrl = `${origin}/invite/${inviteToken}`;
      setGenerated({ invitation: data.invitation, inviteUrl: shortUrl });
      setLastGenKey(currentKey);
      await loadInvites();
      showToast("Invite generated 🔥");
      setShowWizard(false);
      setWizardData(null);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to create invite.");
    }
  };

  const deleteInvite = async (inv) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login required.");

    try {
      await axios.delete(`${API_URL}/invitations/${inv._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (generated?.invitation?._id === inv._id) {
        setGenerated(null);
        setCopiedPrimary(false);
      }

      showToast("Invitation deleted 🗑️");
      await loadInvites();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to delete invite.");
    }
  };

  const toggleInviteType = (type) => {
    setInviteTypes((prev) => {
      const set = new Set(prev);
      if (set.has(type)) {
        set.delete(type);
      } else {
        set.add(type);
      }
      // Always keep at least one type selected
      return Array.from(set.size ? set : ["friend"]);
    });
  };

  const hasType = (type) => inviteTypes.includes(type);

  const currentInviteMeta =
    inviteTypes.length === 1
      ? INVITE_TYPES.find((item) => item.value === inviteTypes[0])
      : {
          description: "Multiple types selected. Recipients will route to matching onboarding.",
        };
  const statusClasses = {
    accepted: "text-emerald-800 bg-emerald-50/80 border border-emerald-200",
    declined: "text-rose-800 bg-rose-50/80 border border-rose-200",
    pending: "text-sky-800 bg-sky-50/80 border border-sky-200",
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold text-slate-900">Invitations</h1>
        </header>

        <section className="ttv-surface rounded-3xl border border-slate-200/70 p-6 shadow-2xl">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                invite types (select one or more)
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {INVITE_TYPES.map((type) => {
                  const isActive = hasType(type.value);
                  const baseClasses =
                    "flex-1 min-w-[140px] rounded-2xl border px-4 py-2 text-sm font-semibold transition";
                  const activeClasses =
                    "border-teal-500 bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-2xl";
                  const inactiveClasses =
                    "border-slate-200 bg-white text-slate-800 hover:border-slate-300";

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleInviteType(type.value)}
                      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span className="ml-2">{type.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {currentInviteMeta?.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-9">
                <label className="text-xs font-semibold text-slate-500">Invitee name</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <button
                  type="button"
                  className={`ttv-pill w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
                    copiedPrimary ? "opacity-80" : ""
                  }`}
                  onClick={() => {
                    if (generated?.inviteUrl) {
                      copyText(generated.inviteUrl, { primary: true });
                    } else {
                      setShowWizard(true);
                    }
                  }}
                >
                  {generated?.inviteUrl
                    ? copiedPrimary
                      ? "Copied ✅"
                      : "Copy link"
                    : "Generate invite"}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Create an invite link and share it via email, chat, or social media.
            </p>

            {generated?.inviteUrl && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-md">
                <div className="font-semibold text-slate-900">Invite link</div>
                <div className="mt-1 break-all text-sm text-slate-600">{generated.inviteUrl}</div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Invited</h2>
            <button
              type="button"
              className="text-sm font-semibold text-slate-500 underline underline-offset-4"
              onClick={loadInvites}
            >
              {loadingInvites ? "Loading…" : "Refresh"}
            </button>
          </div>

          <div className="ttv-surface rounded-3xl border border-slate-200/70 shadow-lg">
            <div className="grid grid-cols-12 gap-2 border-b border-slate-200/60 bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Sent</div>
              <div className="col-span-2">Link</div>
              <div className="col-span-1 text-right">Delete</div>
            </div>
            {(invites || []).map((inv) => {
              const status = (inv.status || "pending").toLowerCase();
              const accepted = status === "accepted";
              const declined = status === "declined";
              const rowBg = accepted ? "bg-emerald-50/60" : declined ? "bg-rose-50/60" : "bg-white/70";
              const statusKey = accepted ? "accepted" : declined ? "declined" : "pending";
              const statusLabel = accepted ? "ACCEPTED" : declined ? "DECLINED" : status.toUpperCase();
              const link = `${origin}/invite/${inv.token}`;
              const typeValues = Array.isArray(inv.inviteTypes) && inv.inviteTypes.length
                ? inv.inviteTypes
                : inv.inviteType
                ? [inv.inviteType]
                : [];
              const typeLabel = typeValues
                .map((t) => {
                  if (t === "student") return "📚 Student";
                  if (t === "parent") return "👪 Parent";
                  return "👥 Friend";
                })
                .join(" · ");

              return (
                <div
                  key={inv._id}
                  className={`grid grid-cols-12 gap-2 border-b border-slate-200/50 px-4 py-4 text-sm text-slate-700 ${rowBg}`}
                >
                  <div className="col-span-3 space-y-1">
                    <div className="font-semibold text-slate-900">
                      {inv.firstName} {inv.lastName}
                    </div>
                    {accepted && inv.acceptedUser?.handle && (
                      <div className="text-xs text-slate-500">@{inv.acceptedUser.handle}</div>
                    )}
                    {typeValues.includes("student") && inv.subject && (
                      <div className="text-xs text-teal-600">Teaching: {inv.subject}</div>
                    )}
                  </div>

                  <div className="col-span-2 text-xs text-slate-600">{typeLabel}</div>

                  <div
                    className={`col-span-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClasses[statusKey]
                    }`}
                  >
                    {statusLabel}
                  </div>

                  <div className="col-span-2 text-xs text-slate-500">
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                  </div>

                  <div className="col-span-2 text-xs">
                    {status === "pending" ? (
                      <button
                        type="button"
                        className={`rounded-full px-3 py-1 font-semibold text-slate-600 transition hover:text-slate-900 ${
                          copiedRowId === inv._id ? "opacity-70" : ""
                        }`}
                        onClick={() => copyText(link, { rowId: inv._id })}
                      >
                        {copiedRowId === inv._id ? "Copied ✅" : "Copy"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-500 underline decoration-slate-300"
                      onClick={() =>
                        setConfirm({
                          title: "Delete invitation?",
                          body: accepted
                            ? "This invite has been accepted already; removing it only clears your list."
                            : "This will permanently delete the invitation link and record.",
                          onConfirm: () => deleteInvite(inv),
                        })
                      }
                      aria-label="Delete invitation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}

            {(!invites || invites.length === 0) && (
              <div className="px-4 py-6 text-sm text-slate-500">No invitations yet.</div>
            )}
          </div>
        </section>
      </div>

      <Toast text={toast.text} show={toast.show} />
      <Modal
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.onConfirm?.();
          setConfirm(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
      {showWizard && (
        <PreFillWizard
          inviteTypes={inviteTypes}
          inviterRoles={user?.roles || []}
          onCancel={() => setShowWizard(false)}
          onConfirm={(data) => {
            setWizardData(data);
            createInvite(data);
          }}
        />
      )}
    </div>
  );
}
