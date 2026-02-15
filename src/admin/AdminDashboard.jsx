// src/admin/AdminDashboard.jsx

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import UploadSounds from "../components/UploadSounds";
import UploadVideos from "../components/Uploadvideos";

import ViewVideos from "./views/ViewVideos";
import ViewAudios from "./views/ViewAudios";
import UsersList from "./views/ViewUsers";
import ViewMcqs from "./views/ViewMcqs";
import ViewBages from "./views/ViewBages";
import ViewImages from "./views/ViewImages";

import AdminStats from "./AdminStats";
import AdminViewLessons from "./views/AdminViewLessons";
import AdminViewUnits from "./views/AdminViewUnits";
import AdminKnowledgeTree from "./AdminKnowledgeTree";
import AdminAgents from "./views/AdminAgents";
import AdminStack from "./views/AdminStack";
import ViewProdServerLogs from "./views/ViewProdServerLogs";
import AdminSideBar from "./AdminSideBar";
import LitCounsel from "./views/LitCounsel";
import AdminPages from "./views/AdminPages";
import BranchManager from "./views/BranchManager";
import AdminOverview from "./views/AdminOverview";
import AdminRevenueCredits from "./views/AdminRevenueCredits";
import AdminContentOps from "./views/AdminContentOps";
import AdminSystemHealth from "./views/AdminSystemHealth";
import AdminWizards from "./views/AdminWizards";
import AdminTutorials from "./views/AdminTutorials";
import DocumentationPage from "./views/documentation/DocumentationPage";

export default function AdminDashboard({ tab }) {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(tab || searchParams.get("tab") || "overview");

  // Sidebar open/close lives here so we can shift content properly
  const [sideOpen, setSideOpen] = useState(true);

  // Sync with tab prop when it changes (from URL navigation)
  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const content = useMemo(() => {
    switch (activeTab) {
      case "upload-sounds":
        return <UploadSounds />;

      case "upload-videos":
        return <UploadVideos />;

      case "overview":
        return <AdminOverview onNavigate={setActiveTab} />;

      case "revenue-credits":
        return <AdminRevenueCredits />;

      case "admin-view-units":
        return <AdminViewUnits />;

      case "users":
        return <UsersList />;

      case "content-ops":
        return <AdminContentOps onNavigate={setActiveTab} />;

      case "view-videos":
        return <ViewVideos />;

      case "view-audios":
        return <ViewAudios />;

      case "view-mcqs":
        return <ViewMcqs />;

      case "view-badges":
        return <ViewBages />;

      case "view-images":
        return <ViewImages />;

      case "pages":
        return <AdminPages />;

      case "admin-stats":
        return <AdminStats />;

      case "tree":
        return <AdminKnowledgeTree />;

      case "admin-agents":
        return <AdminAgents />;

      case "stack":
        return <AdminStack />;

      case "system-health":
        return <AdminSystemHealth />;

      case "view-prod-server-logs":
        return <ViewProdServerLogs />;

      case "lit-counsel":
        return <LitCounsel />;

      case "admin-wizards":
        return <AdminWizards />;

      case "admin-tutorials":
        return <AdminTutorials />;

      case "branch-manager":
        return <BranchManager />;

      case "documentation":
        return <DocumentationPage />;

      // If you keep a "Levels" tab in the sidebar but don't have a page yet,
      // keep the app stable by falling back to Lessons instead of crashing.
      case "add-levels":
        return <AdminViewLessons />;

      default:
        return <AdminViewLessons />;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen">
      <AdminSideBar
        isOpen={sideOpen}
        setIsOpen={setSideOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main content shifts right to make room for fixed sidebar */}
      <div
        className={`transition-[margin] duration-300 ease-in-out ${
          sideOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="p-6 space-y-6">{content}</div>
      </div>
    </div>
  );
}
