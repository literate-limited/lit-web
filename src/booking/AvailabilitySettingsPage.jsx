import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useUser } from "../context/UserContext.jsx";
import { WeeklyAvailabilityEditor, DateAvailabilityEditor } from "./AvailabilityEditors.jsx";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 35, 40, 45, 50, 55, 60];
const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", description: "Anyone can view and request bookings" },
  { value: "friends", label: "Friends Only", description: "Only friends can view your availability" },
  { value: "invitations", label: "Invite Only", description: "Only people with an invite link can book" },
  { value: "invites_friends", label: "Friends + Invites", description: "Friends and invite holders can book" },
];

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

function getTimeZones() {
  if (typeof Intl?.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return FALLBACK_TIMEZONES;
}

export default function AvailabilitySettingsPage() {
  const { currentTheme } = useContext(ThemeContext);
  const { user } = useUser();
  const timeZoneOptions = useMemo(() => getTimeZones(), []);
  const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Settings state
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [timeZone, setTimeZone] = useState(systemZone);
  const [weekly, setWeekly] = useState({
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  });
  const [durations, setDurations] = useState([15, 30, 60]);
  const [blackouts, setBlackouts] = useState([]);
  const [extras, setExtras] = useState([]);
  const [bookingTypes, setBookingTypes] = useState([]);

  // New booking type form
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [newTypePrice, setNewTypePrice] = useState("");

  const borderColor = currentTheme?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
  const bg = currentTheme?.backgroundColor ?? "#fff";
  const inner = currentTheme?.innerContainerColor ?? "rgba(255,255,255,0.85)";
  const textColor = currentTheme?.textColor ?? "#000";
  const buttonColor = currentTheme?.buttonColor ?? "#0d9488";

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_URL}/booking/me/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setBookingEnabled(data.bookingEnabled ?? false);
        setVisibility(data.bookingVisibility ?? "public");
        setTimeZone(data.timeZone ?? systemZone);
        setWeekly(data.weekly ?? {});
        setDurations(data.allowedDurations ?? [15, 30, 60]);
        setBookingTypes(data.bookingTypes ?? []);

        // Transform blackouts/extras for the editor
        const transformedBlackouts = (data.blackouts || []).map((b) => ({
          date: b.date,
          closed: b.closed,
          ranges: b.blocks || [],
        }));
        const transformedExtras = (data.extras || []).map((e) => ({
          date: e.date,
          ranges: e.blocks || [],
        }));

        setBlackouts(transformedBlackouts);
        setExtras(transformedExtras);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError(err.response?.data?.error || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [systemZone]);

  const toggleDuration = (value) => {
    setDurations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value].sort((a, b) => a - b)
    );
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (durations.length === 0) {
      setError("Select at least one booking length.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Login required.");
      return;
    }

    const payload = {
      timeZone,
      weekly,
      allowedDurations: durations,
      bookingVisibility: visibility,
      blackouts: blackouts.map((entry) => ({
        date: entry.date,
        closed: entry.closed ?? false,
        blocks: Array.isArray(entry.ranges) ? entry.ranges : [],
      })),
      extras: extras.map((entry) => ({
        date: entry.date,
        blocks: Array.isArray(entry.ranges) ? entry.ranges : [],
      })),
    };

    try {
      setSaving(true);
      await axios.post(`${API_URL}/booking/me/setup`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookingEnabled(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const addBookingType = async () => {
    if (!newTypeName.trim()) return;

    const token = localStorage.getItem("token");
    const priceInCents = Math.round((parseFloat(newTypePrice) || 0) * 100);

    try {
      const { data } = await axios.post(
        `${API_URL}/booking/me/types`,
        {
          name: newTypeName.trim(),
          description: newTypeDesc.trim(),
          priceInCents,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookingTypes((prev) => [...prev, data.type]);
      setNewTypeName("");
      setNewTypeDesc("");
      setNewTypePrice("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add booking type");
    }
  };

  const formatPrice = (cents) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const deleteBookingType = async (typeId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/booking/me/types/${typeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookingTypes((prev) => prev.filter((t) => t._id !== typeId));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete booking type");
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen p-6" style={{ backgroundColor: bg, color: textColor }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 opacity-70">Loading availability settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6" style={{ backgroundColor: bg, color: textColor }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Availability Settings</h1>
            <p className="text-sm opacity-70">Configure when students can book lessons with you</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/teacher-dashboard"
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor }}
            >
              Back to Dashboard
            </Link>
            <Link
              to="/booking"
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor }}
            >
              View Calendar
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className="rounded-xl border p-4 mb-6 flex items-center justify-between"
          style={{ borderColor, backgroundColor: inner }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${bookingEnabled ? "bg-green-500" : "bg-gray-400"}`}
            />
            <span className="font-semibold">
              {bookingEnabled ? "Bookings Enabled" : "Bookings Not Yet Configured"}
            </span>
          </div>
          {user?.handle && (
            <div className="text-sm opacity-70">
              Your booking link:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                /profile/{user.handle}
              </code>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-300 bg-green-50 p-4 mb-6 text-green-700">
            Settings saved successfully!
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Time Zone & Visibility */}
          <div className="rounded-2xl border p-5" style={{ borderColor, backgroundColor: inner }}>
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time Zone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor }}
                >
                  {timeZoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor }}
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Booking Types */}
          <div className="rounded-2xl border p-5" style={{ borderColor, backgroundColor: inner }}>
            <h2 className="text-lg font-semibold mb-4">Lesson Types & Pricing</h2>
            <p className="text-sm opacity-70 mb-4">
              Define the types of lessons you offer and set prices. Leave price empty or 0 for free lessons.
            </p>

            <div className="space-y-2 mb-4">
              {bookingTypes.length === 0 && (
                <div className="text-sm opacity-60">No lesson types defined yet.</div>
              )}
              {bookingTypes.map((type) => (
                <div
                  key={type._id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{type.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          type.priceInCents > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formatPrice(type.priceInCents)}
                      </span>
                    </div>
                    {type.description && (
                      <div className="text-xs opacity-70 mt-1">{type.description}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBookingType(type._id)}
                    className="text-xs text-red-600 hover:underline ml-3"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Type name"
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor }}
              />
              <input
                type="text"
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
                placeholder="Description (optional)"
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor }}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newTypePrice}
                onChange={(e) => setNewTypePrice(e.target.value)}
                placeholder="Price (e.g., 25.00)"
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor }}
              />
              <button
                type="button"
                onClick={addBookingType}
                disabled={!newTypeName.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: buttonColor }}
              >
                Add Type
              </button>
            </div>
          </div>

          {/* Booking Lengths */}
          <div className="rounded-2xl border p-5" style={{ borderColor, backgroundColor: inner }}>
            <h2 className="text-lg font-semibold mb-4">Booking Lengths</h2>
            <p className="text-sm opacity-70 mb-4">
              Select the lesson durations students can request
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {DURATION_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDuration(value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                    durations.includes(value)
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {value}m
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="rounded-2xl border p-5" style={{ borderColor, backgroundColor: inner }}>
            <h2 className="text-lg font-semibold mb-4">Weekly Schedule</h2>
            <p className="text-sm opacity-70 mb-4">
              Set your regular weekly availability. Times are in {timeZone}.
            </p>
            <WeeklyAvailabilityEditor value={weekly} onChange={setWeekly} />
          </div>

          {/* Blackouts */}
          <div className="rounded-2xl border p-5" style={{ borderColor, backgroundColor: inner }}>
            <h2 className="text-lg font-semibold mb-4">Blackout Dates</h2>
            <p className="text-sm opacity-70 mb-4">
              Mark specific dates when you're unavailable
            </p>
            <DateAvailabilityEditor
              value={blackouts}
              onChange={setBlackouts}
              emptyLabel="No blackout dates set."
            />
          </div>

          {/* Extra Availability */}
          <div className="rounded-2xl border p-5" style={{ borderColor, backgroundColor: inner }}>
            <h2 className="text-lg font-semibold mb-4">Extra Availability</h2>
            <p className="text-sm opacity-70 mb-4">
              Add availability for specific dates outside your regular schedule
            </p>
            <DateAvailabilityEditor
              value={extras}
              onChange={setExtras}
              emptyLabel="No extra availability set."
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-3">
          <Link
            to="/teacher-dashboard"
            className="px-6 py-3 rounded-lg border text-sm font-semibold"
            style={{ borderColor }}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: buttonColor }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
