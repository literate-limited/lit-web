// src/admin/views/AdminWizards.jsx
// Admin view for managing and visualizing all onboarding/booking wizards

import { useState } from "react";
import { FaRoute, FaCalendarAlt, FaUserPlus } from "react-icons/fa";
import InvitationFlowVisualizer from "../wizards/InvitationFlowVisualizer";
import OnboardingFlowVisualizer from "../wizards/OnboardingFlowVisualizer";
import BookingFlowVisualizer from "../wizards/BookingFlowVisualizer";

const WIZARD_TABS = [
  {
    id: "invitation-flows",
    name: "Invitation Flows",
    icon: <FaUserPlus size={18} />,
    description: "Visualize and manage invitation control flows"
  },
  {
    id: "onboarding-flows",
    name: "Onboarding Flows",
    icon: <FaRoute size={18} />,
    description: "Manage onboarding state machine and steps"
  },
  {
    id: "booking-flows",
    name: "Booking Flows",
    icon: <FaCalendarAlt size={18} />,
    description: "Manage booking system wizard"
  }
];

export default function AdminWizards() {
  const [activeWizard, setActiveWizard] = useState("invitation-flows");

  const renderWizardContent = () => {
    switch (activeWizard) {
      case "invitation-flows":
        return <InvitationFlowVisualizer />;
      case "onboarding-flows":
        return <OnboardingFlowVisualizer />;
      case "booking-flows":
        return <BookingFlowVisualizer />;
      default:
        return <InvitationFlowVisualizer />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Second Rail - Horizontal Wizard Navigation */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-1 mr-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Wizards
            </span>
          </div>
          {WIZARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveWizard(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeWizard === tab.id
                  ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-300"
                  : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Content Area */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        {renderWizardContent()}
      </div>
    </div>
  );
}
