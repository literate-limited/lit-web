import { Dialog } from "@headlessui/react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { WeeklyAvailabilityEditor, DateAvailabilityEditor } from "./AvailabilityEditors.jsx";
import { useUser } from "../context/UserContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 35, 40, 45, 50, 55, 60];
const DEFAULT_DURATIONS = [5, 15, 30, 60];

const DEFAULT_WEEKLY = {
  mon: [{ start: "09:00", end: "17:00" }],
  tue: [{ start: "09:00", end: "17:00" }],
  wed: [{ start: "09:00", end: "17:00" }],
  thu: [{ start: "09:00", end: "17:00" }],
  fri: [{ start: "09:00", end: "17:00" }],
  sat: [],
  sun: [],
};

export default function BookingSystemCreationWizard({ isOpen, onClose, onComplete }) {
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [weekly, setWeekly] = useState(DEFAULT_WEEKLY);
  const [blackouts, setBlackouts] = useState([]);
  const [extras, setExtras] = useState([]);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const timeZone = useMemo(() => {
    const system = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return user?.selectedTimeZone || system;
  }, [user?.selectedTimeZone]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setWeekly(DEFAULT_WEEKLY);
    setBlackouts([]);
    setExtras([]);
    setDurations(DEFAULT_DURATIONS);
    setSubmitting(false);
    setError("");
  }, [isOpen]);

  const toggleDuration = (value) => {
    setDurations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleFinish = async () => {
    setError("");
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
      blackouts: (blackouts || []).map((entry) => ({
        date: entry.date,
        blocks: Array.isArray(entry.ranges) ? entry.ranges : [],
      })),
      extras: (extras || []).map((entry) => ({
        date: entry.date,
        blocks: Array.isArray(entry.ranges) ? entry.ranges : [],
      })),
      bookingVisibility: "public",
    };

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/booking/me/setup`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onComplete?.({ bookingEnabled: true, bookingVisibility: "public" });
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Setup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Weekly availability template",
      body: (
        <WeeklyAvailabilityEditor value={weekly} onChange={setWeekly} />
      ),
    },
    {
      title: "Known unavailability / blackouts",
      body: (
        <DateAvailabilityEditor
          value={blackouts}
          onChange={setBlackouts}
          emptyLabel="No blackout dates yet."
        />
      ),
    },
    {
      title: "Extra availability",
      body: (
        <DateAvailabilityEditor
          value={extras}
          onChange={setExtras}
          emptyLabel="No extra availability yet."
        />
      ),
    },
    {
      title: "Allowed booking lengths",
      body: (
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            Select the booking lengths guests can request.
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((value) => (
              <label
                key={value}
                className={`flex items-center justify-center gap-2 rounded-md border px-2 py-2 text-sm font-semibold cursor-pointer ${
                  durations.includes(value)
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={durations.includes(value)}
                  onChange={() => toggleDuration(value)}
                  className="hidden"
                />
                {value}m
              </label>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const active = steps[step];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative z-50 w-full max-w-4xl mx-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Step {step + 1} of 4</div>
            <div className="text-xl font-bold">{active.title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2">{active.body}</div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
