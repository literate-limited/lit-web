// src/admin/wizards/InvitationFlowVisualizer.jsx
// Visualizes invitation control flows using tree-like node patterns

import { useState } from "react";
import { FaUserFriends, FaGraduationCap, FaUsers } from "react-icons/fa";

const INVITATION_TYPES = [
  {
    id: "friend",
    name: "Friend Invite",
    icon: <FaUserFriends size={24} />,
    color: "#0d9488",
  },
  {
    id: "student",
    name: "Student Invite",
    icon: <FaGraduationCap size={24} />,
    color: "#3b82f6",
  },
  {
    id: "parent",
    name: "Parent Invite",
    icon: <FaUsers size={24} />,
    color: "#8b5cf6",
  },
];

// Define the control flow for each invitation type
const FLOWS = {
  friend: {
    steps: [
      { id: "receive", label: "Receive Invite", type: "start" },
      { id: "validate", label: "Validate Token", type: "process" },
      { id: "login", label: "Login/Signup", type: "process" },
      { id: "accept", label: "Accept Invite", type: "decision", branches: ["accept", "decline"] },
      { id: "onboarding", label: "Onboarding", type: "process", condition: "if incomplete" },
      { id: "tutorials", label: "Friend Tutorials", type: "process" },
      { id: "home", label: "Home", type: "end" },
    ],
    edges: [
      { from: "receive", to: "validate" },
      { from: "validate", to: "login" },
      { from: "login", to: "accept" },
      { from: "accept", to: "onboarding", label: "accept" },
      { from: "accept", to: "home", label: "decline" },
      { from: "onboarding", to: "tutorials" },
      { from: "tutorials", to: "home" },
    ],
  },
  student: {
    steps: [
      { id: "receive", label: "Receive Invite", type: "start" },
      { id: "validate", label: "Validate Token", type: "process" },
      { id: "login", label: "Login/Signup", type: "process" },
      { id: "view-subject", label: "View Subject", type: "process" },
      { id: "accept", label: "Accept Invite", type: "decision", branches: ["accept", "decline"] },
      { id: "add-learning", label: "Add 'Learning' Need", type: "process" },
      { id: "onboarding", label: "Onboarding", type: "process", condition: "if incomplete" },
      { id: "tutorials", label: "Student Tutorials", type: "process" },
      { id: "dashboard", label: "Student Dashboard", type: "end" },
    ],
    edges: [
      { from: "receive", to: "validate" },
      { from: "validate", to: "login" },
      { from: "login", to: "view-subject" },
      { from: "view-subject", to: "accept" },
      { from: "accept", to: "add-learning", label: "accept" },
      { from: "accept", to: "dashboard", label: "decline" },
      { from: "add-learning", to: "onboarding" },
      { from: "onboarding", to: "tutorials" },
      { from: "tutorials", to: "dashboard" },
    ],
  },
  parent: {
    steps: [
      { id: "receive", label: "Receive Invite", type: "start" },
      { id: "validate", label: "Validate Token", type: "process" },
      { id: "login", label: "Login/Signup", type: "process" },
      { id: "accept", label: "Accept Invite", type: "decision", branches: ["accept", "decline"] },
      { id: "add-role", label: "Add 'Parent' Role", type: "process" },
      { id: "contact-confirm", label: "Confirm Contact", type: "process" },
      { id: "children-stage", label: "Set Children Stage", type: "process" },
      { id: "tutorials", label: "Parent Tutorials", type: "process" },
      { id: "parent-onboarding", label: "Parent Onboarding", type: "end" },
    ],
    edges: [
      { from: "receive", to: "validate" },
      { from: "validate", to: "login" },
      { from: "login", to: "accept" },
      { from: "accept", to: "add-role", label: "accept" },
      { from: "accept", to: "parent-onboarding", label: "decline" },
      { from: "add-role", to: "contact-confirm" },
      { from: "contact-confirm", to: "children-stage" },
      { from: "children-stage", to: "tutorials" },
      { from: "tutorials", to: "parent-onboarding" },
    ],
  },
};

function FlowNode({ step, color, isHighlighted }) {
  const getNodeStyle = () => {
    const baseStyle = {
      borderRadius: step.type === "decision" ? "12px" : step.type === "start" || step.type === "end" ? "50%" : "8px",
      borderWidth: "2px",
      borderColor: isHighlighted ? color : "#cbd5e1",
      backgroundColor: isHighlighted ? `${color}15` : "#ffffff",
      padding: step.type === "start" || step.type === "end" ? "16px" : "12px 16px",
      minWidth: step.type === "start" || step.type === "end" ? "80px" : "140px",
      minHeight: step.type === "start" || step.type === "end" ? "80px" : "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    };
    return baseStyle;
  };

  return (
    <div style={getNodeStyle()} className="shadow-sm transition-all">
      <div className="text-sm font-semibold text-center" style={{ color: isHighlighted ? color : "#475569" }}>
        {step.label}
      </div>
      {step.condition && (
        <div className="text-xs text-slate-500 mt-1 text-center italic">
          {step.condition}
        </div>
      )}
      {step.type === "decision" && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
          ?
        </div>
      )}
    </div>
  );
}

function FlowEdge({ label, color }) {
  return (
    <div className="flex flex-col items-center justify-center my-2">
      <div className="w-0.5 h-8" style={{ backgroundColor: color }}></div>
      {label && (
        <div className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
          {label}
        </div>
      )}
    </div>
  );
}

export default function InvitationFlowVisualizer() {
  const [selectedType, setSelectedType] = useState("friend");
  const [hoveredStep, setHoveredStep] = useState(null);

  const activeInvite = INVITATION_TYPES.find(t => t.id === selectedType);
  const flow = FLOWS[selectedType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Invitation Control Flows</h2>
        <p className="text-slate-600">
          Visualize the complete user journey for each invitation type. Click nodes to inspect details.
        </p>
      </div>

      {/* Invitation Type Selector */}
      <div className="flex gap-4">
        {INVITATION_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
              selectedType === type.id
                ? "border-current shadow-lg"
                : "border-slate-200 hover:border-slate-300"
            }`}
            style={{
              borderColor: selectedType === type.id ? type.color : undefined,
              backgroundColor: selectedType === type.id ? `${type.color}10` : "#ffffff",
            }}
          >
            <div style={{ color: type.color }}>{type.icon}</div>
            <div className="text-left">
              <div className="font-semibold" style={{ color: selectedType === type.id ? type.color : "#475569" }}>
                {type.name}
              </div>
              <div className="text-xs text-slate-500">{flow.steps.length} steps</div>
            </div>
          </button>
        ))}
      </div>

      {/* Flow Visualization */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
        <div className="flex flex-col items-center">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: activeInvite.color }}>
            {activeInvite.icon}
            <span>{activeInvite.name} Flow</span>
          </div>

          {/* Render flow as vertical tree */}
          <div className="flex flex-col items-center space-y-0">
            {flow.steps.map((step, idx) => {
              const nextEdge = flow.edges.find(e => e.from === step.id);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className="cursor-pointer"
                  >
                    <FlowNode
                      step={step}
                      color={activeInvite.color}
                      isHighlighted={hoveredStep === step.id || !hoveredStep}
                    />
                  </div>
                  {nextEdge && (
                    <FlowEdge
                      label={nextEdge.label}
                      color={activeInvite.color}
                    />
                  )}
                  {/* Render branches for decision nodes */}
                  {step.type === "decision" && step.branches && (
                    <div className="flex gap-16 my-4">
                      {step.branches.map((branch) => (
                        <div key={branch} className="flex flex-col items-center">
                          <div className="text-sm font-medium px-3 py-1 rounded-lg border-2" style={{
                            borderColor: activeInvite.color,
                            color: activeInvite.color,
                            backgroundColor: `${activeInvite.color}15`
                          }}>
                            {branch}
                          </div>
                          <div className="w-0.5 h-8" style={{ backgroundColor: activeInvite.color }}></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Legend</h3>
        <div className="flex gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-slate-400"></div>
            <span className="text-slate-600">Start/End</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-8 rounded border-2 border-slate-400"></div>
            <span className="text-slate-600">Process</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-8 rounded-xl border-2 border-slate-400"></div>
            <span className="text-slate-600">Decision</span>
          </div>
        </div>
      </div>
    </div>
  );
}
