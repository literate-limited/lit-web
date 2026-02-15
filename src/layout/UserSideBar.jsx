// src/layout/UserSideBar.jsx — DROP-IN replacement (reacts to orb/theme changes)

import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaHome,
  FaBookOpen,
  FaUserCircle,
  FaUserShield,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaGavel,
  FaUsers,
  FaUserPlus,
} from "react-icons/fa";
import { MdMenuBook } from "react-icons/md";
import { BiMessageSquareDots } from "react-icons/bi";
import { HiDocumentText } from "react-icons/hi";
import { BsBook } from "react-icons/bs";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useUser } from "../context/UserContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const UserSideBar = ({ mobileOpen, setMobileOpen }) => {
  const { userRole, userRoles, userLoggedIn } = useUser();
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  const { currentTheme, theme } = useContext(ThemeContext);

  const isAdmin = userLoggedIn && ((userRoles || []).includes("admin") || userRole === "admin");
  const isParent = (userRoles || []).includes("parent");

  // Check if user is a teacher (has students) or student (has teachers)
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    if (!userLoggedIn) {
      setIsTeacher(false);
      setIsStudent(false);
      return;
    }

    const checkTeacherStudent = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [studentsRes, teachersRes] = await Promise.all([
          axios.get(`${API_URL}/teaching/my-students`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: { students: [] } })),
          axios.get(`${API_URL}/teaching/my-teachers`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: { teachers: [] } })),
        ]);

        setIsTeacher((studentsRes.data.students || []).length > 0);
        setIsStudent((teachersRes.data.teachers || []).length > 0);
      } catch {
        // Silently fail - user just won't see teacher/student links
      }
    };

    checkTeacherStudent();
  }, [userLoggedIn]);
  const t = theme;

  // ✅ compute every render (no memo cache issues)
  const borderFallback =
    currentTheme?.floatMenuBorder || "rgba(255,255,255,0.25)";

  const panelBg =
    t?.surface?.header ??
    t?.surface?.container ??
    currentTheme?.headerBg ??
    currentTheme?.containerColor ??
    "#bdd8dd";

  const panelText =
    t?.text?.primary ??
    currentTheme?.mainTextColor ??
    currentTheme?.textColor ??
    "#000";

  const headingText =
    t?.text?.heading ??
    currentTheme?.headerTextColor ??
    panelText;

  const hoverBg =
    t?.action?.hover ??
    t?.action?.selected ??
    t?.surface?.interactive ??
    currentTheme?.floatMenuBgHover ??
    currentTheme?.selectedOptionButton ??
    currentTheme?.innerContainerColor ??
    "#d5f5fc";

  const activeBg =
    t?.action?.selected ??
    t?.surface?.interactive ??
    currentTheme?.innerContainerColor ??
    "#cceaf0";

  const border = t?.border?.default ?? borderFallback;
  const icon = t?.icon?.default ?? currentTheme?.iconColor ?? panelText;

  const [hoveredTo, setHoveredTo] = useState(null);
  const [pressedTo, setPressedTo] = useState(null);

  const navSections = useMemo(() => {
    const workTabs = [
      { name: "HQ", icon: <FaHome size={22} />, to: "/" },
      { name: "Library", icon: <MdMenuBook size={22} />, to: "/quest-log" },
      { name: "Literature Sea", icon: <FaBookOpen size={22} />, to: "/literature-sea" },
      { name: "Targets", icon: <BsBook size={22} />, to: "/word-bank" },
    ];

    const collabTabs = [
      { name: "Invitations", icon: <FaUserPlus size={22} />, to: "/invitations" },
      { name: "Chats", icon: <BiMessageSquareDots size={22} />, to: "/message" },
    ];

    const systemTabs = [{ name: "Docs", icon: <HiDocumentText size={22} />, to: "/docs" }];

    const fusionEnabled = (import.meta.env.VITE_FUSION_FUSION_ENABLED || "false") !== "false";
    const toolTabs = [
      ...(fusionEnabled
        ? [
            {
              name: "Fusion Fusion",
              icon: <FaGavel size={22} />,
              to: "/fusion-fusion",
            },
          ]
        : []),
    ];

    if (isTeacher) {
      collabTabs.push({
        name: "Teaching",
        icon: <FaChalkboardTeacher size={22} />,
        to: "/teacher-dashboard",
      });
      collabTabs.push({
        name: "My Classes",
        icon: <FaUsers size={22} />,
        to: "/classes",
      });
    }

    if (isStudent) {
      collabTabs.push({
        name: "Learning",
        icon: <FaGraduationCap size={22} />,
        to: "/student-dashboard",
      });
    }

    if (isParent) {
      collabTabs.push({
        name: "Parent",
        icon: <FaUserCircle size={22} />,
        to: "/parent-dashboard",
      });
    }

    const sections = [
      { title: "Live Work", items: workTabs },
      { title: "People", items: collabTabs },
      { title: "Systems", items: systemTabs },
      { title: "Tools", items: toolTabs },
    ];

    if (isAdmin) {
      sections.push({
        title: "Control",
        items: [
          {
            name: "Admin",
            icon: <FaUserShield size={22} />,
            to: "/admin-dashboard",
          },
        ],
      });
    }

    return sections.filter((section) => section.items.length > 0);
  }, [isTeacher, isStudent, isParent, isAdmin]);

  // Close mobile menu on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const renderNavItem = (tab, isMobile = false) => (
    <NavLink
      key={tab.name}
      to={tab.to || "#"}
      onClick={(e) => {
        if (tab.onClick) {
          e.preventDefault();
          tab.onClick();
        }
        if (isMobile) setMobileOpen(false);
      }}
      className={({ isActive }) =>
        [
          "w-full nav-rail-item border",
          isMobile ? "py-3 px-3" : "py-3 px-2",
          "flex items-center rounded-xl transition-colors",
          isActive ? "font-semibold" : "",
        ].join(" ")
      }
      style={({ isActive }) => {
        const isHovered = hoveredTo === tab.to;
        const isPressed = pressedTo === tab.to;

        const bg = isActive
          ? activeBg
          : isPressed
          ? activeBg
          : isHovered
          ? hoverBg
          : "transparent";

        const borderColor = isActive ? border : "transparent";

        return { backgroundColor: bg, borderColor, color: panelText };
      }}
      onMouseEnter={() => setHoveredTo(tab.to)}
      onMouseLeave={() => setHoveredTo(null)}
      onMouseDown={() => setPressedTo(tab.to)}
      onMouseUp={() => setPressedTo(null)}
      onTouchStart={() => setPressedTo(tab.to)}
      onTouchEnd={() => setPressedTo(null)}
    >
      <div className={isMobile ? "mr-3" : "mx-3"} style={{ color: icon }}>
        {tab.icon}
      </div>
      {!isMobile && isDesktopOpen && <span className="ml-4">{tab.name}</span>}
      {isMobile && <span>{tab.name}</span>}
    </NavLink>
  );

  return (
    <>
      {/* ===== MOBILE OVERLAY ===== */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className="
              fixed top-16 left-4
              w-fit min-w-[14rem]
              z-50
              rounded-2xl
              shadow-xl
              origin-top
              animate-slideDown
              md:hidden
            "
            style={{
              backgroundColor: panelBg,
              color: panelText,
              border: `1px solid ${border}`,
            }}
          >
            <div className="p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: headingText }}>
                Navigator
              </h2>
            </div>

            <nav className="px-4 pb-4">
              <div className="flex flex-col gap-3">
                {navSections.map((section) => (
                  <div key={section.title} className="flex flex-col gap-2">
                    <p
                      className="text-xs uppercase tracking-[0.2em] px-1 opacity-80"
                      style={{ color: headingText }}
                    >
                      {section.title}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {section.items.map((tab) => (
                        <li key={tab.name}>{renderNavItem(tab, true)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </aside>
        </>
      )}

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0
        ${isDesktopOpen ? "w-64" : "w-20"}
        transition-[width] duration-300 z-30 flex-col`}
        style={{
          backgroundColor: panelBg,
          color: panelText,
          borderRight: `1px solid ${border}`,
        }}
      >
        <div className="mt-16 flex flex-col h-[calc(100%-4rem)]">
          <div className="p-4 flex flex-col items-center">
            <button
              onClick={() => setIsDesktopOpen((v) => !v)}
              style={{ color: icon }}
              aria-label={isDesktopOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isDesktopOpen ? <FaArrowLeft /> : <FaArrowRight />}
            </button>

            {isDesktopOpen && (
              <h2
                className="mt-4 text-xl font-semibold"
                style={{ color: headingText }}
              >
                Navigator
              </h2>
            )}
          </div>

            {isDesktopOpen && (
              <div className="px-4" />
            )}

          <nav className="flex-1 overflow-y-auto px-4 pb-6">
            <div className="flex flex-col gap-4">
              {navSections.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  {isDesktopOpen && (
                    <p
                      className="text-xs uppercase tracking-[0.22em] px-2 opacity-80"
                      style={{ color: headingText }}
                    >
                      {section.title}
                    </p>
                  )}
                  <ul className="flex flex-col gap-3">
                    {section.items.map((tab) => (
                      <li key={tab.name}>{renderNavItem(tab, false)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

        </div>
      </aside>

      {/* ===== DESKTOP SPACER ===== */}
      <div
        className={`hidden md:block transition-all duration-300
        ${isDesktopOpen ? "ml-64" : "ml-20"}`}
      />
    </>
  );
};

export default UserSideBar;
