// lit-c/src/booking/BookingCalendarPage.jsx  (NEW - replaces old Google Calendar assumptions)
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import TimePickerModal from "./TimePickerModal.jsx";

export default function BookingCalendarPage({ handle, viewMode }) {
  const API = import.meta.env.VITE_API_URL;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [time, setTime] = useState(""); // ISO (UTC) string
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState("week"); // "week" | "fortnight" | "month"

  const [slots, setSlots] = useState([]);
  const [open, setOpen] = useState(false);

  const title = useMemo(() => {
    if (viewMode === "self") return "Your booking page";
    return "Book a Lesson";
  }, [viewMode]);

  useEffect(() => {
    if (!handle) return;

    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await axios.get(
          `${API}/booking/${encodeURIComponent(handle)}/availability`,
          { params: { view }, signal: controller.signal }
        );

        setSlots(Array.isArray(data?.slots) ? data.slots : []);
      } catch (err) {
        if (err.name === "CanceledError") return;
        console.error("Error fetching availability:", err?.message || err);
        setSlots([]);
      }
    })();

    return () => controller.abort();
  }, [API, handle, view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!time) return alert("Please choose a time slot.");

    try {
      setLoading(true);
      setSuccess(null);

      const { data } = await axios.post(
        `${API}/booking/${encodeURIComponent(handle)}/book`,
        { name, email, time }
      );

      if (data?.success) {
        setSuccess({ bookingId: data.bookingId, time });
      } else {
        alert("Booking failed.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error === "SLOT_TAKEN"
          ? "That slot was just taken. Please pick another."
          : err.response?.data?.error === "SLOT_UNAVAILABLE"
          ? "That slot is no longer available. Please pick another."
          : err.response?.data?.error || err.message;

      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-2 text-center">{title}</h1>

      {viewMode === "self" && (
        <div className="mb-4 text-center text-sm text-slate-600">
          Availability editor is coming next. For now, this uses your default availability.
        </div>
      )}

      <div className="flex gap-2 justify-center mb-4">
        <button
          type="button"
          onClick={() => setView("week")}
          className={`px-3 py-1 rounded-md border ${view === "week" ? "bg-slate-900 text-white" : "bg-white"}`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setView("fortnight")}
          className={`px-3 py-1 rounded-md border ${view === "fortnight" ? "bg-slate-900 text-white" : "bg-white"}`}
        >
          Fortnight
        </button>
        <button
          type="button"
          onClick={() => setView("month")}
          className={`px-3 py-1 rounded-md border ${view === "month" ? "bg-slate-900 text-white" : "bg-white"}`}
        >
          Month
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border rounded-md p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded-md p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Time</label>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 w-full border rounded-md p-2 bg-gray-50 hover:bg-gray-100"
          >
            {time ? format(new Date(time), "eee d MMM, h:mmaaa") : "Choose a time"}
          </button>
          <div className="mt-1 text-xs text-slate-500">
            Times are shown in your local timezone.
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {loading ? "Booking…" : "Book Lesson"}
        </button>
      </form>

      {success && (
        <div className="mt-4 text-center text-green-600">
          ✅ Booked! Booking ID: <span className="font-mono">{success.bookingId}</span>
          <div className="text-sm text-slate-600 mt-1">
            {format(new Date(success.time), "eee d MMM, h:mmaaa")}
          </div>
        </div>
      )}

      <TimePickerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        slots={slots}
        onPick={(iso) => setTime(iso)}
      />
    </div>
  );
}
