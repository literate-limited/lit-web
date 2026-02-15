import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import BookingInviteModal from "./BookingInviteModal.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

function getTimeZones() {
  if (typeof Intl?.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return FALLBACK_TIMEZONES;
}

function minutesToLabel(minutes) {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const padded = String(min).padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${padded} ${ampm}`;
}

function buildDayKey(dt) {
  return dt.toISODate();
}

export default function DisplayCalendar({
  handle,
  inviteToken,
  isSelf,
  selectionMode = "booking",
  onSlotConfirm,
  initialTimeZone,
  initialDuration,
  lockDuration = false,
}) {
  const { user, userLoggedIn } = useUser();
  const navigate = useNavigate();

  const timeZoneOptions = useMemo(() => getTimeZones(), []);
  const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [timeZone, setTimeZone] = useState(
    initialTimeZone ||
      user?.selectedTimeZone ||
      localStorage.getItem("bookingTimeZone") ||
      systemZone
  );
  const [view, setView] = useState("week");
  const [anchorDate, setAnchorDate] = useState(
    DateTime.now().setZone(timeZone)
  );
  const [slots, setSlots] = useState([]);
  const [slotMinutes, setSlotMinutes] = useState(5);
  const [allowedDurations, setAllowedDurations] = useState([5, 15, 30, 60]);
  const [bookingTypes, setBookingTypes] = useState([]);
  const [bookingLength, setBookingLength] = useState(initialDuration || 15);
  const [bookingTypeId, setBookingTypeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const [hoverSlot, setHoverSlot] = useState(null);
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);
  const [signupPrompt, setSignupPrompt] = useState(false);

  useEffect(() => {
    setAnchorDate(DateTime.now().setZone(timeZone));
  }, [timeZone]);

  useEffect(() => {
    if (initialDuration) {
      setBookingLength(initialDuration);
    }
  }, [initialDuration]);

  useEffect(() => {
    if (!handle) return;
    const controller = new AbortController();

    const loadAvailability = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          view,
          start: anchorDate.setZone(timeZone).toISODate(),
          tz: timeZone,
        };
        if (inviteToken) params.invite = inviteToken;

        const { data } = await axios.get(
          `${API_URL}/booking/${encodeURIComponent(handle)}/availability`,
          { params, signal: controller.signal }
        );

        const nextSlots = Array.isArray(data?.slots) ? data.slots : [];
        const meta = data?.meta || {};

        setSlots(nextSlots);
        setSlotMinutes(Number(meta.slotMinutes || 5));
        const durations = Array.isArray(meta.allowedDurations)
          ? meta.allowedDurations
          : [5, 15, 30, 60];
        setAllowedDurations(durations);
        setBookingTypes(Array.isArray(meta.bookingTypes) ? meta.bookingTypes : []);

        if (!durations.includes(bookingLength)) {
          setBookingLength(durations[0] || 15);
        }
        if (!bookingTypeId && Array.isArray(meta.bookingTypes) && meta.bookingTypes.length > 0) {
          const firstId = meta.bookingTypes[0]._id || meta.bookingTypes[0].id;
          if (firstId) setBookingTypeId(String(firstId));
        }
      } catch (err) {
        if (err.name === "CanceledError") return;
        setError(err.response?.data?.error || err.message || "Failed to load availability.");
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
    return () => controller.abort();
  }, [handle, inviteToken, view, anchorDate, timeZone]);

  const today = useMemo(() => DateTime.now().setZone(timeZone).startOf("day"), [timeZone]);

  const viewStart = useMemo(() => {
    if (view === "month") {
      return anchorDate.startOf("month");
    }
    return anchorDate.startOf("week");
  }, [anchorDate, view]);

  const canGoPrev = useMemo(() => {
    if (view === "month") {
      return viewStart.startOf("month") > today.startOf("month");
    }
    return viewStart.startOf("week") > today.startOf("week");
  }, [view, viewStart, today]);

  const goPrev = () => {
    if (!canGoPrev) return;
    setAnchorDate((prev) =>
      view === "month" ? prev.minus({ months: 1 }) : prev.minus({ weeks: 1 })
    );
  };

  const goNext = () => {
    setAnchorDate((prev) =>
      view === "month" ? prev.plus({ months: 1 }) : prev.plus({ weeks: 1 })
    );
  };

  const availabilityByDay = useMemo(() => {
    const map = new Map();
    const lookup = new Map();
    slots.forEach((slot) => {
      const dt = DateTime.fromISO(slot.start, { zone: "utc" }).setZone(timeZone);
      const dayKey = buildDayKey(dt);
      const minute = dt.hour * 60 + dt.minute;
      if (!map.has(dayKey)) map.set(dayKey, new Set());
      map.get(dayKey).add(minute);
      lookup.set(`${dayKey}|${minute}`, slot.start);
    });
    return { map, lookup };
  }, [slots, timeZone]);

  const weekDays = useMemo(() => {
    const start = viewStart.startOf("week");
    return Array.from({ length: 7 }, (_, i) => start.plus({ days: i }));
  }, [viewStart]);

  const availableDayKeys = useMemo(() => {
    const keys = new Set();
    slots.forEach((slot) => {
      const dt = DateTime.fromISO(slot.start, { zone: "utc" }).setZone(timeZone);
      keys.add(buildDayKey(dt));
    });
    return keys;
  }, [slots, timeZone]);

  const timeRange = useMemo(() => {
    const minutes = [];
    weekDays.forEach((day) => {
      const dayKey = buildDayKey(day);
      const set = availabilityByDay.map.get(dayKey);
      if (!set) return;
      set.forEach((value) => minutes.push(value));
    });
    if (minutes.length === 0) {
      return { start: 8 * 60, end: 18 * 60 };
    }
    const min = Math.min(...minutes);
    const max = Math.max(...minutes) + slotMinutes;
    const start = Math.max(0, min - slotMinutes * 2);
    const end = Math.min(24 * 60, max + slotMinutes * 2);
    return { start, end };
  }, [availabilityByDay.map, weekDays, slotMinutes]);

  const timeMarks = useMemo(() => {
    const marks = [];
    for (let m = timeRange.start; m < timeRange.end; m += slotMinutes) {
      marks.push(m);
    }
    return marks;
  }, [timeRange, slotMinutes]);

  const canFitDuration = (dayKey, startMinute) => {
    const set = availabilityByDay.map.get(dayKey);
    if (!set) return false;
    const steps = Math.ceil(bookingLength / slotMinutes);
    for (let i = 0; i < steps; i += 1) {
      if (!set.has(startMinute + i * slotMinutes)) return false;
    }
    return true;
  };

  const selectionEnabled = selectionMode !== "view";

  const handleSlotClick = (dayKey, minute) => {
    if (!canFitDuration(dayKey, minute)) return;
    const startISO = availabilityByDay.lookup.get(`${dayKey}|${minute}`);
    if (!startISO) return;
    setConfirmSlot({ startISO, dayKey, minute });
    setSubmitError("");
  };

  const handleConfirm = async () => {
    if (!confirmSlot) return;
    if (selectionMode === "booking" && !bookingTypeId) {
      setSubmitError("Select a booking type.");
      return;
    }

    if (!userLoggedIn && selectionMode === "booking") {
      if (!guestName.trim() || !guestEmail.trim()) {
        setSubmitError("Please enter your name and email.");
        return;
      }
    }

    if (selectionMode !== "booking") {
      onSlotConfirm?.({
        startISO: confirmSlot.startISO,
        durationMinutes: bookingLength,
      });
      setConfirmSlot(null);
      return;
    }

    try {
      setLoading(true);
      setSubmitError("");
      const payload = {
        startISO: confirmSlot.startISO,
        durationMinutes: bookingLength,
        bookingTypeId,
        inviteToken,
      };
      if (!userLoggedIn) {
        payload.guestName = guestName.trim();
        payload.guestEmail = guestEmail.trim();
      }

      const headers = userLoggedIn
        ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
        : {};

      const { data } = await axios.post(
        `${API_URL}/booking/${encodeURIComponent(handle)}/request`,
        payload,
        { headers }
      );

      if (!data?.success) {
        throw new Error(data?.error || "Booking request failed.");
      }

      // Check if the booking type requires payment
      const selectedType = bookingTypes.find((t) => String(t._id || t.id) === String(bookingTypeId));
      const requiresPayment = selectedType?.priceInCents > 0;

      if (requiresPayment) {
        // Initiate payment checkout
        try {
          const paymentRes = await axios.post(
            `${API_URL}/payments/lesson/create-checkout`,
            { bookingId: data.bookingId },
            { headers }
          );

          if (paymentRes.data?.free) {
            // Free lesson, no payment needed
            setSuccess({ bookingId: data.bookingId, startISO: confirmSlot.startISO, free: true });
          } else if (paymentRes.data?.url) {
            // Redirect to Stripe checkout
            window.location.href = paymentRes.data.url;
            return;
          }
        } catch (paymentErr) {
          console.error("Payment initiation failed:", paymentErr);
          // Booking was created but payment failed - show success with payment note
          setSuccess({
            bookingId: data.bookingId,
            startISO: confirmSlot.startISO,
            paymentPending: true,
          });
        }
      } else {
        setSuccess({ bookingId: data.bookingId, startISO: confirmSlot.startISO });
      }

      setConfirmSlot(null);

      if (!userLoggedIn) {
        setSignupPrompt(true);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error || err.message || "Booking request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    if (!inviteToken) {
      navigate("/signup");
      return;
    }
    navigate(`/signup?redirect=/invite/${inviteToken}`);
  };

  const formatSlot = (startISO) => {
    const dt = DateTime.fromISO(startISO, { zone: "utc" }).setZone(timeZone);
    return dt.toFormat("ccc d LLL, h:mma");
  };

  const monthDays = useMemo(() => {
    if (view !== "month") return [];
    const start = viewStart.startOf("month").startOf("week");
    const end = viewStart.endOf("month").endOf("week");
    const days = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = cursor.plus({ days: 1 });
    }
    return days;
  }, [view, viewStart]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            className="px-2 py-1 rounded-md border border-slate-200 text-sm disabled:opacity-40"
          >
            {"<"}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="px-2 py-1 rounded-md border border-slate-200 text-sm"
          >
            {">"}
          </button>
          <div className="text-sm font-semibold">
            {view === "month"
              ? viewStart.toFormat("LLLL yyyy")
              : `${viewStart.toFormat("LLL d")} - ${viewStart.plus({ days: 6 }).toFormat("LLL d")}`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">Time zone</label>
          <select
            value={timeZone}
            onChange={(e) => {
              const nextZone = e.target.value;
              setTimeZone(nextZone);
              localStorage.setItem("bookingTimeZone", nextZone);
              if (userLoggedIn) {
                const token = localStorage.getItem("token");
                axios.put(
                  `${API_URL}/booking/me/settings`,
                  { timeZone: nextZone },
                  { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                ).catch(() => null);
              }
            }}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm"
          >
            {timeZoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("week")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              view === "week" ? "bg-slate-900 text-white" : "border-slate-200"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              view === "month" ? "bg-slate-900 text-white" : "border-slate-200"
            }`}
          >
            Month
          </button>
          {isSelf && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-200"
            >
              Invite
            </button>
          )}
        </div>
      </div>

      {loading && <div className="p-4 text-sm text-slate-500">Loading availability...</div>}
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}

      {!loading && view === "week" && (
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{ gridTemplateColumns: `80px repeat(7, minmax(140px, 1fr))` }}
          >
            <div className="border-b border-slate-200" />
            {weekDays.map((day) => (
              <div key={day.toISODate()} className="border-b border-slate-200 px-2 py-2 text-sm font-semibold">
                <div>{day.toFormat("ccc")}</div>
                <div className="text-xs text-slate-500">{day.toFormat("LLL d")}</div>
              </div>
            ))}

            {timeMarks.map((minute) => (
              <div key={`row-${minute}`} className="contents">
                <div className="border-b border-slate-100 px-2 py-1 text-xs text-slate-500">
                  {minute % 60 === 0 ? minutesToLabel(minute) : ""}
                </div>
                {weekDays.map((day) => {
                  const dayKey = buildDayKey(day);
                  const available = canFitDuration(dayKey, minute);
                  const hoverMatch =
                    hoverSlot &&
                    hoverSlot.dayKey === dayKey &&
                    minute >= hoverSlot.minute &&
                    minute < hoverSlot.minute + bookingLength;

                  const baseClass = available
                    ? "bg-[#8a9a5b]"
                    : "bg-slate-50";

                  const hoverClass = hoverMatch ? "bg-[#f59e0b]" : baseClass;

                  return (
                    <button
                      key={`${dayKey}-${minute}`}
                      type="button"
                      onMouseEnter={() => {
                        if (!available || !selectionEnabled) return;
                        setHoverSlot({ dayKey, minute });
                      }}
                      onMouseLeave={() => setHoverSlot(null)}
                      onClick={() => handleSlotClick(dayKey, minute)}
                      className={`h-6 border-b border-slate-100 border-l border-slate-100 transition-colors ${
                        available ? hoverClass : "bg-slate-50"
                      }`}
                      disabled={!available || !selectionEnabled}
                      title={available ? "Available" : "Unavailable"}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && view === "month" && (
        <div className="grid grid-cols-7 gap-2 p-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} className="text-xs uppercase tracking-wide text-slate-500">
              {label}
            </div>
          ))}
          {monthDays.map((day) => {
            const dayKey = buildDayKey(day);
            const isCurrentMonth = day.month === viewStart.month;
            const hasSlots = availableDayKeys.has(dayKey);
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => {
                  setAnchorDate(day);
                  setView("week");
                }}
                className={`rounded-xl border p-2 text-left text-sm transition ${
                  isCurrentMonth ? "border-slate-200" : "border-slate-100 text-slate-400"
                } ${hasSlots ? "bg-emerald-50" : "bg-white"}`}
              >
                <div className="font-semibold">{day.day}</div>
                {hasSlots && <div className="text-xs text-emerald-600">Available</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold">Booking length</label>
          <select
            value={bookingLength}
            onChange={(e) => setBookingLength(Number(e.target.value))}
            disabled={lockDuration}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm disabled:opacity-60"
          >
            {allowedDurations.map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutes
              </option>
            ))}
          </select>
          <label className="text-sm font-semibold">Lesson type</label>
          <select
            value={bookingTypeId}
            onChange={(e) => setBookingTypeId(e.target.value)}
            disabled={selectionMode !== "booking"}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm disabled:opacity-60"
          >
            {bookingTypes.map((type) => {
              const price = type.priceInCents > 0 ? `$${(type.priceInCents / 100).toFixed(2)}` : "Free";
              const typeId = type._id || type.id;
              return (
                <option key={typeId} value={typeId}>
                  {type.name} ({price})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <Dialog
        open={Boolean(confirmSlot)}
        onClose={() => setConfirmSlot(null)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold mb-3">
            {selectionMode === "booking" ? "Would you like to book this time?" : "Confirm new time"}
          </Dialog.Title>
          {confirmSlot && (
            <div className="space-y-2 text-sm text-slate-700">
              <div>
                <span className="font-semibold">Time:</span> {formatSlot(confirmSlot.startISO)}
              </div>
              <div>
                <span className="font-semibold">Length:</span> {bookingLength} minutes
              </div>
              <div>
                <span className="font-semibold">Timezone:</span> {timeZone}
              </div>
              {(() => {
                const selectedType = bookingTypes.find((t) => String(t._id) === String(bookingTypeId));
                const price = selectedType?.priceInCents || 0;
                return (
                  <div>
                    <span className="font-semibold">Price:</span>{" "}
                    {price > 0 ? (
                      <span className="text-green-600 font-semibold">${(price / 100).toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-500">Free</span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {!userLoggedIn && selectionMode === "booking" && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Name</label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
          )}

          {submitError && <div className="mt-3 text-sm text-red-600">{submitError}</div>}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmSlot(null)}
              className="px-4 py-2 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60"
            >
              {loading ? "Working..." : "Confirm"}
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(success)}
        onClose={() => setSuccess(null)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold mb-2">Booking request sent</Dialog.Title>
          {success && (
            <div className="text-sm text-slate-600">
              Request ID: <span className="font-mono">{success.bookingId}</span>
            </div>
          )}
          {signupPrompt && (
            <div className="mt-4 text-sm text-slate-700">
              Create an account to track your booking and complete the invite.
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setSuccess(null);
                setSignupPrompt(false);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200"
            >
              Close
            </button>
            {signupPrompt && (
              <button
                type="button"
                onClick={handleSignup}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold"
              >
                Sign up
              </button>
            )}
          </div>
        </div>
      </Dialog>

      <BookingInviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        hostHandle={handle}
      />
    </div>
  );
}
