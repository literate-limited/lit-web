import { Dialog } from "@headlessui/react";
import { useMemo, useState } from "react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function BookingInviteModal({ isOpen, onClose, hostHandle }) {
  const [tab, setTab] = useState("specific");
  const [inviteType, setInviteType] = useState("friend");
  const [fullName, setFullName] = useState("");
  const [subject, setSubject] = useState("");
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);

  const origin = window.location.origin;

  const inviteLink = useMemo(() => {
    if (!generated?.token || !hostHandle) return "";
    return `${origin}/profile/${hostHandle}?invite=${generated.token}`;
  }, [generated, hostHandle, origin]);

  const resetState = () => {
    setGenerated(null);
    setLoading(false);
  };

  const closeModal = () => {
    resetState();
    onClose?.();
  };

  const createInvite = async ({ type, isGeneral, name, inviteSubject }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required.");
      return;
    }

    const payload = {
      inviteType: type,
      subject: type === "student" ? inviteSubject || null : null,
      isGeneral: Boolean(isGeneral),
    };

    if (!isGeneral) {
      const trimmed = String(name || "").trim();
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        alert("Please enter a name.");
        return;
      }
      payload.firstName = parts[0];
      payload.lastName = parts.slice(1).join(" ");
    }

    if (type === "student" && !isGeneral && !inviteSubject?.trim()) {
      alert("Please enter a subject for student invites.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_URL}/invitations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data?.success) {
        alert(data?.message || "Failed to create invite.");
        return;
      }
      const inviteToken = data.token || data.invitation?.token;
      setGenerated({ token: inviteToken });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create invite.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpecific = () =>
    createInvite({
      type: inviteType,
      isGeneral: false,
      name: fullName,
      inviteSubject: subject,
    });

  const handleGeneral = (type) =>
    createInvite({
      type,
      isGeneral: true,
    });

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Copied to clipboard.");
    } catch {
      alert("Copy failed.");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative z-50 w-full max-w-xl mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close invite modal"
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-900"
        >
          X
        </button>
        <Dialog.Title className="text-xl font-bold mb-4">Invite to book</Dialog.Title>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab("specific")}
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              tab === "specific" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200"
            }`}
          >
            Specific
          </button>
          <button
            type="button"
            onClick={() => setTab("general")}
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              tab === "general" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200"
            }`}
          >
            General
          </button>
        </div>

        {tab === "specific" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInviteType("friend")}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
                  inviteType === "friend" ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200"
                }`}
              >
                Friend
              </button>
              <button
                type="button"
                onClick={() => setInviteType("student")}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
                  inviteType === "student" ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200"
                }`}
              >
                Student
              </button>
            </div>

            <div>
              <label className="text-sm font-semibold">Invitee name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Jane Doe"
              />
            </div>

            {inviteType === "student" && (
              <div>
                <label className="text-sm font-semibold">Subject title</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Pronunciation"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSpecific}
              disabled={loading}
              className="w-full rounded-lg bg-cyan-600 py-2 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate invite"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleGeneral("friend")}
              disabled={loading}
              className="w-full rounded-lg border border-emerald-600 py-2 text-emerald-700 font-semibold hover:bg-emerald-50"
            >
              General Friend Invite
            </button>
            <button
              type="button"
              onClick={() => handleGeneral("student")}
              disabled={loading}
              className="w-full rounded-lg border border-indigo-600 py-2 text-indigo-700 font-semibold hover:bg-indigo-50"
            >
              General Student Invite
            </button>
          </div>
        )}

        {generated && inviteLink && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Invite link</div>
            <div className="mt-1 text-sm break-all">{inviteLink}</div>
            <button
              type="button"
              onClick={copyLink}
              className="mt-2 text-sm font-semibold text-cyan-700 hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
