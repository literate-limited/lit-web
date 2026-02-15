// src/admin/wizards/OnboardingFlowVisualizer.jsx
// Visualizes onboarding steps for different personas

import { useMemo, useState } from "react";
import { FaUserGraduate, FaChalkboardTeacher, FaCog } from "react-icons/fa";

const TRACKS = [
  {
    id: "student",
    name: "Student",
    icon: <FaUserGraduate size={22} />,
    color: "#2563eb",
    steps: [
      "Create account / SSO",
      "Pick subjects + goals",
      "Learning style survey",
      "Baseline placement test",
      "First lesson intro",
      "Progress dashboard unlocked",
    ],
  },
  {
    id: "teacher",
    name: "Teacher",
    icon: <FaChalkboardTeacher size={22} />,
    color: "#0f766e",
    steps: [
      "Create account / SSO",
      "School / org verification",
      "Roster import / invites",
      "Classroom setup",
      "Assign starter units",
      "Insights + reporting",
    ],
  },
  {
    id: "system",
    name: "System Checks",
    icon: <FaCog size={22} />,
    color: "#9333ea",
    steps: [
      "Email + device trust",
      "Consent + COPPA routing",
      "Profile completeness",
      "Feature flags resolved",
    ],
  },
];

export default function OnboardingFlowVisualizer() {
  const [active, setActive] = useState("student");
  const track = useMemo(
    () => TRACKS.find((t) => t.id === active) || TRACKS[0],
    [active]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          Onboarding Flows
        </h2>
        <p className="text-slate-600">
          Quickly inspect the required steps per persona. Use this to spot gaps
          or missing telemetry before rollout.
        </p>
      </div>

      <div className="flex gap-3">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
              active === t.id
                ? "shadow-md"
                : "hover:border-slate-300 bg-white"
            }`}
            style={{
              borderColor: active === t.id ? t.color : "#e2e8f0",
              backgroundColor: active === t.id ? `${t.color}12` : "#fff",
              color: active === t.id ? t.color : "#0f172a",
            }}
          >
            <span>{t.icon}</span>
            <span className="font-semibold">{t.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div
          className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ color: track.color }}
        >
          {track.icon}
          <span>{track.name} track</span>
        </div>
        <ol className="grid gap-3 md:grid-cols-2">
          {track.steps.map((step, idx) => (
            <li
              key={step}
              className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: track.color }}
              >
                {idx + 1}
              </div>
              <div className="text-slate-800 font-medium">{step}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
