// src/admin/wizards/BookingFlowVisualizer.jsx
// Summarizes booking wizard states and handoffs

import { useMemo, useState } from "react";
import { FaCalendarAlt, FaHandshake, FaRegClock } from "react-icons/fa";

const BOOKING_VIEWS = [
  {
    id: "create",
    name: "Creation Wizard",
    icon: <FaCalendarAlt size={20} />,
    color: "#0284c7",
    phases: [
      "Select booking type",
      "Set availability window",
      "Configure duration + padding",
      "Collect fields (name/email/needs)",
      "Confirmation + invite link",
    ],
    notes:
      "Matches booking-system branch flow; verify parity with profile visibility flags.",
  },
  {
    id: "recipient",
    name: "Recipient Flow",
    icon: <FaHandshake size={20} />,
    color: "#0ea5e9",
    phases: [
      "Open invite link",
      "Time zone alignment",
      "Slot selection",
      "Payment / acceptance (if required)",
      "Success + iCal",
    ],
    notes: "Ensure invite token enforces visibility for friends/invites only.",
  },
  {
    id: "ops",
    name: "Operational States",
    icon: <FaRegClock size={20} />,
    color: "#334155",
    phases: [
      "Pending",
      "Accepted",
      "Reschedule",
      "Cancelled",
      "Completed",
    ],
    notes: "Keep event log parity with bookingNative route; reschedule should retain audit trail.",
  },
];

export default function BookingFlowVisualizer() {
  const [active, setActive] = useState("create");
  const view = useMemo(
    () => BOOKING_VIEWS.find((v) => v.id === active) || BOOKING_VIEWS[0],
    [active]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          Booking Flow Snapshot
        </h2>
        <p className="text-slate-600">
          Quick reference for the booking wizard, recipient journey, and
          operational state machine.
        </p>
      </div>

      <div className="flex gap-3">
        {BOOKING_VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActive(v.id)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
              active === v.id ? "shadow-md" : "hover:border-slate-300 bg-white"
            }`}
            style={{
              borderColor: active === v.id ? v.color : "#e2e8f0",
              backgroundColor: active === v.id ? `${v.color}12` : "#fff",
              color: active === v.id ? v.color : "#0f172a",
            }}
          >
            {v.icon}
            <span className="font-semibold">{v.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: view.color }}
        >
          {view.icon}
          <span>{view.name}</span>
        </div>

        <ol className="space-y-2">
          {view.phases.map((phase, idx) => (
            <li
              key={phase}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: view.color }}
              >
                {idx + 1}
              </div>
              <div className="text-slate-800 font-medium">{phase}</div>
            </li>
          ))}
        </ol>

        <div className="text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded-lg p-3">
          {view.notes}
        </div>
      </div>
    </div>
  );
}
