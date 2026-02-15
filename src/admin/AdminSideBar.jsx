// src/admin/AdminSideBar.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUserCircle,
  FaSitemap,
  FaRobot,
  FaFire,
  FaMagic,
  FaBookOpen,
} from "react-icons/fa";
import { MdAudiotrack, MdMenuBook } from "react-icons/md";
import { IoVideocam, IoGameController, IoImages } from "react-icons/io5";
import { BiText, BiSolidBadge } from "react-icons/bi";
import {
  FiActivity,
  FiBarChart2,
  FiLayout,
  FiTerminal,
  FiGitBranch,
  FiHome,
  FiDollarSign,
  FiShield,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
  FiBook,
} from "react-icons/fi";

const tabs = [
  { type: "header", name: "Core" },
  { name: "Overview", icon: <FiHome size={22} />, key: "overview" },
  { name: "Branch Manager", icon: <FiGitBranch size={22} />, key: "branch-manager" },
  { name: "Revenue & Credits", icon: <FiDollarSign size={22} />, key: "revenue-credits" },

  { type: "header", name: "People" },
  { name: "Users & Trust", icon: <FiShield size={22} />, key: "users" },
  { name: "Agents", icon: <FaRobot size={22} />, key: "admin-agents" },

  { type: "header", name: "Content" },
  { name: "Content Ops", icon: <FiFolder size={22} />, key: "content-ops" },
  { name: "Videos", icon: <IoVideocam size={22} />, key: "view-videos" },
  { name: "Audios", icon: <MdAudiotrack size={22} />, key: "view-audios" },
  { name: "Images", icon: <IoImages size={22} />, key: "view-images" },
  { name: "MCQs", icon: <BiText size={22} />, key: "view-mcqs" },
  { name: "Badges", icon: <BiSolidBadge size={22} />, key: "view-badges" },

  { type: "header", name: "System" },
  { name: "System Health", icon: <FiActivity size={22} />, key: "system-health" },
  { name: "Stack", icon: <FiActivity size={22} />, key: "stack" },
  { name: "Stats", icon: <FiBarChart2 size={22} />, key: "admin-stats" },
  {
    name: "Prod Logs",
    icon: <FiTerminal size={22} />,
    key: "view-prod-server-logs",
  },
  {
    name: "Documentation",
    icon: <FiBook size={22} />,
    key: "documentation",
  },

  { type: "header", name: "Governance" },
  { name: "Lit Counsel", icon: <FaFire size={22} />, key: "lit-counsel" },
  { name: "Wizards", icon: <FaMagic size={22} />, key: "admin-wizards" },
  { name: "Tutorials", icon: <FaBookOpen size={22} />, key: "admin-tutorials" },
  { name: "UI Pages", icon: <FiLayout size={22} />, key: "pages" },
  { name: "Tree", icon: <FaSitemap size={22} />, key: "tree" },
  { name: "Lessons", icon: <MdMenuBook size={22} />, key: "admin-view-lessons" },
  { name: "Units", icon: <MdMenuBook size={22} />, key: "admin-view-units" },
  { name: "Levels", icon: <IoGameController size={22} />, key: "add-levels" },
];

export default function AdminSideBar({
  isOpen,
  setIsOpen,
  activeTab,
  onTabChange,
}) {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(() =>
    tabs.reduce((acc, tab) => {
      if (tab.type === "header") {
        acc[tab.name] = true;
      }
      return acc;
    }, {})
  );
  const safeActive = activeTab || "admin-view-lessons";
  const safeSetOpen = typeof setIsOpen === "function" ? setIsOpen : () => {};
  const safeOnTabChange =
    typeof onTabChange === "function" ? onTabChange : () => {};

  const handleTabClick = (tabKey) => {
    safeOnTabChange(tabKey);
    navigate(`/admin/${tabKey}`);
  };

  const toggleSidebar = () => safeSetOpen((prev) => !prev);
  const toggleSection = (name) =>
    setOpenSections((prev) => ({ ...prev, [name]: !prev[name] }));

  const visibleTabs = [];
  let currentSection = null;
  tabs.forEach((tab) => {
    if (tab.type === "header") {
      currentSection = tab.name;
      visibleTabs.push(tab);
      return;
    }
    if (currentSection && openSections[currentSection] === false) return;
    visibleTabs.push(tab);
  });

  return (
    <div
      className={`fixed inset-y-0 left-0 bg-[#bdd8dd] ${
        isOpen ? "w-64" : "w-20"
      } transition-[width] duration-300 ease-in-out z-20 flex flex-col`}
    >
      {/* Offset for header */}
      <div className="mt-16 flex flex-col h-[calc(100%-4rem)]">
        <div className="p-4 flex flex-col items-center">
          <button onClick={toggleSidebar} className="mb-4">
            {isOpen ? <FaArrowLeft size={24} /> : <FaArrowRight size={24} />}
          </button>
          <h2 className={`text-2xl font-bold ${!isOpen ? "hidden" : ""}`}>
            Dashboard
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto w-full px-4 pb-6">
          <ul className="flex flex-col w-full gap-2">
            {visibleTabs.map((tab) => {
              if (tab.type === "header") {
                const isOpenSection = openSections[tab.name];
                return (
                  <li key={tab.name}>
                    <button
                      type="button"
                      onClick={() => toggleSection(tab.name)}
                      className={`w-full flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500 px-3 py-2 ${
                        !isOpen ? "hidden" : ""
                      }`}
                    >
                      <span>{tab.name}</span>
                      {isOpenSection ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </button>
                  </li>
                );
              }

              return (
                <li
                  key={tab.key}
                  className={`py-3 w-full flex items-start rounded-lg justify-start hover:bg-[#d5f5fc] cursor-pointer ${
                    safeActive === tab.key ? "bg-[#cceaf0]" : ""
                  }`}
                  onClick={() => handleTabClick(tab.key)}
                >
                  <div className="mx-3">{tab.icon}</div>
                  <span className={`ml-4 text-sm ${!isOpen ? "hidden" : ""}`}>
                    {tab.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
