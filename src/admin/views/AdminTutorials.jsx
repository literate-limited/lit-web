// src/admin/views/AdminTutorials.jsx
// Admin view for visualizing tutorial wizards per invite/onboarding track

import { useState } from "react";
import { FaMapSigns, FaUsers, FaChalkboardTeacher, FaRegStar, FaPeopleArrows, FaBookOpen } from "react-icons/fa";
import TutorialFlowVisualizer from "../wizards/TutorialFlowVisualizer";

const TUTORIAL_TABS = [
  { id: "multi", name: "Multi-role", icon: <FaMapSigns size={18} />, description: "When invites contain multiple roles" },
  { id: "student", name: "Student", icon: <FaBookOpen size={18} />, description: "Student onboarding tutorials" },
  { id: "parent", name: "Parent", icon: <FaUsers size={18} />, description: "Parent contact tutorials" },
  { id: "friend", name: "Friend", icon: <FaPeopleArrows size={18} />, description: "Friend/peer tutorials" },
  { id: "teacher", name: "Teacher", icon: <FaChalkboardTeacher size={18} />, description: "Teacher/operator tutorials" },
  { id: "default", name: "Default", icon: <FaRegStar size={18} />, description: "Fallback/general tutorials" },
];

export default function AdminTutorials() {
  const [activeTab, setActiveTab] = useState("multi");

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-1 mr-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tutorials
            </span>
          </div>
          {TUTORIAL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                  : "bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100"
              }`}
              title={tab.description}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <TutorialFlowVisualizer activeGroup={activeTab} />
      </div>
    </div>
  );
}
