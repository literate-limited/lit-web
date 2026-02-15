import { Dialog } from "@headlessui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import DisplayCalendar from "../../../booking/DisplayCalendar";
import { WeeklyAvailabilityEditor, DateAvailabilityEditor } from "../../../booking/AvailabilityEditors";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "friends", label: "Friends" },
  { value: "invitations", label: "Invitations" },
  { value: "invites_friends", label: "Invites & Friends" },
];

function toEditorEntries(list) {
  return (Array.isArray(list) ? list : []).map((entry) => ({
    date: entry.date,
    ranges: Array.isArray(entry.blocks)
      ? entry.blocks
      : Array.isArray(entry.ranges)
      ? entry.ranges
      : [],
  }));
}

export default function BookingModule({
  module,
  viewMode,
  profileUser,
  viewer,
  inviteToken,
  onProfileUpdate,
}) {
  const isSelf = viewMode === "self";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get("reschedule");

  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  const [editWeeklyOpen, setEditWeeklyOpen] = useState(false);
  const [editBlackoutsOpen, setEditBlackoutsOpen] = useState(false);
  const [editExtrasOpen, setEditExtrasOpen] = useState(false);

  const [weeklyDraft, setWeeklyDraft] = useState(null);
  const [blackoutsDraft, setBlackoutsDraft] = useState([]);
  const [extrasDraft, setExtrasDraft] = useState([]);

  const [typeName, setTypeName] = useState("");
  const [types, setTypes] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [rescheduleBooking, setRescheduleBooking] = useState(null);

  const visibilityLabel = useMemo(() => {
    const current = settings?.bookingVisibility || module?.visibility || "public";
    return VISIBILITY_OPTIONS.find((opt) => opt.value === current)?.label || "Public";
  }, [settings?.bookingVisibility, module?.visibility]);

  useEffect(() => {
    if (!isSelf) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const loadSettings = async () => {
      setLoadingSettings(true);
      setSettingsError("");
      try {
        const { data } = await axios.get(`${API_URL}/booking/me/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalized = {
          ...data,
          blackouts: toEditorEntries(data.blackouts),
          extras: toEditorEntries(data.extras),
        };
        setSettings(normalized);
        setTypes(Array.isArray(data.bookingTypes) ? data.bookingTypes : []);
      } catch (err) {
        setSettingsError(err.response?.data?.error || err.message || "Failed to load settings.");
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [isSelf]);

  useEffect(() => {
    if (!isSelf || !rescheduleId) {
      setRescheduleBooking(null);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    const loadBooking = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/booking/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const all = Array.isArray(data?.upcoming) ? data.upcoming : [];
        const match = all.find((b) => String(b._id) === String(rescheduleId));
        setRescheduleBooking(match || null);
      } catch {
        setRescheduleBooking(null);
      }
    };

    loadBooking();
  }, [isSelf, rescheduleId]);

  const updateAvailability = async (nextWeekly, nextBlackouts, nextExtras) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
      weekly: nextWeekly,
      blackouts: (nextBlackouts || []).map((entry) => ({
        date: entry.date,
        blocks: entry.ranges || [],
      })),
      extras: (nextExtras || []).map((entry) => ({
        date: entry.date,
        blocks: entry.ranges || [],
      })),
      allowedDurations: settings?.allowedDurations || [5, 15, 30, 60],
    };

    await axios.put(`${API_URL}/booking/me/availability`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setSettings((prev) =>
      prev
        ? {
            ...prev,
            weekly: nextWeekly,
            blackouts: nextBlackouts,
            extras: nextExtras,
          }
        : prev
    );
  };

  const handleVisibilityToggle = async () => {
    if (!isSelf) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const current = settings?.bookingVisibility || module?.visibility || "public";
    const idx = VISIBILITY_OPTIONS.findIndex((opt) => opt.value === current);
    const next = VISIBILITY_OPTIONS[(idx + 1) % VISIBILITY_OPTIONS.length];

    await axios.put(
      `${API_URL}/booking/me/settings`,
      { bookingVisibility: next.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSettings((prev) => (prev ? { ...prev, bookingVisibility: next.value } : prev));
    onProfileUpdate?.({ bookingVisibility: next.value });
  };

  const handleAddType = async () => {
    const name = typeName.trim();
    if (!name) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const { data } = await axios.post(
      `${API_URL}/booking/me/types`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data?.type) {
      setTypes((prev) => prev.concat(data.type));
      setTypeName("");
    }
  };

  const handleUpdateType = async () => {
    const name = editingName.trim();
    if (!name || !editingType) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const { data } = await axios.put(
      `${API_URL}/booking/me/types/${editingType}`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data?.type) {
      setTypes((prev) => prev.map((t) => (t._id === data.type._id ? data.type : t)));
      setEditingType(null);
      setEditingName("");
    }
  };

  const handleRemoveType = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    await axios.delete(`${API_URL}/booking/me/types/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setTypes((prev) => prev.filter((t) => t._id !== id));
  };

  const handleRescheduleConfirm = async ({ startISO, durationMinutes }) => {
    if (!rescheduleBooking) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    await axios.post(
      `${API_URL}/booking/${rescheduleBooking._id}/propose`,
      { startISO, durationMinutes },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setRescheduleBooking(null);
    if (profileUser?.handle) {
      navigate(`/profile/${profileUser.handle}`, { replace: true });
    }
  };

  const calendarMode = rescheduleBooking ? "reschedule" : isSelf ? "view" : "booking";

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">Booking system</div>
        <div className="text-xs text-slate-500">
          visibility: <span className="font-semibold">{visibilityLabel}</span>
        </div>
      </div>

      {isSelf && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setWeeklyDraft(settings?.weekly || {});
              setEditWeeklyOpen(true);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
          >
            Edit regular availability
          </button>
          <button
            type="button"
            onClick={() => {
              setBlackoutsDraft(settings?.blackouts || []);
              setEditBlackoutsOpen(true);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
          >
            Remove availability
          </button>
          <button
            type="button"
            onClick={() => {
              setExtrasDraft(settings?.extras || []);
              setEditExtrasOpen(true);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
          >
            Add extra availability
          </button>
          <button
            type="button"
            onClick={handleVisibilityToggle}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
          >
            {visibilityLabel}
          </button>
        </div>
      )}

      {loadingSettings && isSelf && (
        <div className="mb-4 text-sm text-slate-500">Loading booking settings...</div>
      )}
      {settingsError && isSelf && (
        <div className="mb-4 text-sm text-red-600">{settingsError}</div>
      )}

      {rescheduleBooking && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Select a new time to propose for booking with {rescheduleBooking.guestName || "guest"}.
        </div>
      )}

      <DisplayCalendar
        handle={profileUser?.handle || ""}
        inviteToken={inviteToken}
        isSelf={isSelf}
        selectionMode={calendarMode}
        onSlotConfirm={handleRescheduleConfirm}
        initialTimeZone={viewer?.selectedTimeZone}
        initialDuration={rescheduleBooking?.durationMinutes}
        lockDuration={Boolean(rescheduleBooking)}
      />

      {isSelf && (
        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">Booking Types</div>
          <div className="space-y-2">
            {types.length === 0 && (
              <div className="text-sm text-slate-500">No booking types yet.</div>
            )}
            {types.map((type) => {
              const typeId = type._id || type.id;
              return (
              <div key={typeId} className="flex items-center gap-2">
                {editingType === typeId ? (
                  <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  ) : (
                    <div className="flex-1 text-sm">{type.name}</div>
                  )}
                {editingType === typeId ? (
                  <button
                    type="button"
                    onClick={handleUpdateType}
                    className="text-xs font-semibold text-emerald-700"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingType(typeId);
                      setEditingName(type.name || "");
                    }}
                    className="text-xs font-semibold text-cyan-700"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveType(typeId)}
                  className="text-xs font-semibold text-red-600"
                >
                  Remove
                </button>
              </div>
            )})}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="New booking type"
              className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={handleAddType}
              className="px-3 py-1 rounded-md bg-cyan-600 text-white text-sm font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={editWeeklyOpen}
        onClose={() => setEditWeeklyOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-50 w-full max-w-3xl rounded-2xl bg-white p-6">
          <Dialog.Title className="text-lg font-bold mb-3">Edit regular availability</Dialog.Title>
          <WeeklyAvailabilityEditor value={weeklyDraft} onChange={setWeeklyDraft} />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditWeeklyOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await updateAvailability(weeklyDraft, settings?.blackouts || [], settings?.extras || []);
                setEditWeeklyOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={editBlackoutsOpen}
        onClose={() => setEditBlackoutsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-50 w-full max-w-3xl rounded-2xl bg-white p-6">
          <Dialog.Title className="text-lg font-bold mb-3">Remove availability</Dialog.Title>
          <DateAvailabilityEditor value={blackoutsDraft} onChange={setBlackoutsDraft} emptyLabel="No blackouts yet." />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditBlackoutsOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await updateAvailability(settings?.weekly || {}, blackoutsDraft, settings?.extras || []);
                setEditBlackoutsOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={editExtrasOpen}
        onClose={() => setEditExtrasOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-50 w-full max-w-3xl rounded-2xl bg-white p-6">
          <Dialog.Title className="text-lg font-bold mb-3">Add extra availability</Dialog.Title>
          <DateAvailabilityEditor value={extrasDraft} onChange={setExtrasDraft} emptyLabel="No extra availability yet." />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditExtrasOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await updateAvailability(settings?.weekly || {}, settings?.blackouts || [], extrasDraft);
                setEditExtrasOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
