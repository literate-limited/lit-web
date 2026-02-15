// src/layout/Header.jsx
// Mission-control inspired header with app rail, quick tools, and currencies

import { useContext, useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCloud,
  FiUsers,
  FiGrid,
  FiTv,
  FiCpu,
  FiCompass,
  FiPieChart,
  FiAperture,
  FiMoreHorizontal,
} from "react-icons/fi";
import { HiDocumentText } from "react-icons/hi";
import ProfileDropdown from "../components/ProfileDropdown";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useUser } from "../context/UserContext";
import { useCredits } from "../hooks/useCredits";
import BuyCreditsModal from "../payments/components/modals/CreditsModal";
import FlickeringFlame from "../components/FlickeringFlame";
import FlickeringMarquee from "../components/FlickeringMarquee";
import AppSwitcherModal from "../components/AppSwitcherModal";
import { useBrand } from "../brands/BrandContext";

const FLAME_STORAGE_KEY = "lit_flame_images";
const MARQUEE_STORAGE_KEY = "lit_marquee_images";
export const MAIN_HEADER_HEIGHT = 64;
export const HEADER_RAIL_HEIGHT = 48;
const API_URL = import.meta.env.VITE_API_URL;

export default function Header() {
  const { userLoggedIn, userRole, userRoles } = useUser();
  const { currentTheme, theme } = useContext(ThemeContext);
  const { brandId } = useBrand();
  const { user } = useUser();
  const { credits, maxCredits } = useCredits();
  const location = useLocation();
  const navigate = useNavigate();

  const tkn = theme;
  const isTtv = brandId === "ttv";

  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const [flameImages, setFlameImages] = useState([]);
  const [marqueeImages, setMarqueeImages] = useState({ orb: null, banner: null });

  const lit = user?.lit ?? 0;
  const cloud = user?.cloud ?? 0;
  const classes = user?.classes ?? 0;
  const maxLit = user?.maxLit;
  const maxCloud = user?.maxCloud;
  const maxClasses = user?.maxClasses;

  const isAtMax = (value, max) =>
    typeof value === "number" &&
    typeof max === "number" &&
    max >= 0 &&
    value >= max;

  const litAtMax = isAtMax(lit, maxLit);
  const cloudAtMax = isAtMax(cloud, maxCloud);
  const classesAtMax = isAtMax(classes, maxClasses);
  const creditsAtMax = isAtMax(credits, maxCredits);
  const isAdmin =
    userLoggedIn && ((userRoles || []).includes("admin") || userRole === "admin");

  const secondaryRail = useMemo(
    () => [
      { label: "Feed", route: "/feed", show: true },
      { label: "Comms", route: "/message", show: true },
      { label: "Epistles", route: "/ttv", show: true },
      { label: "Pennings", route: "/docs", show: true },
      { label: "Functions", route: "/math-madness", show: true },
      { label: "Creations", route: "/creations", show: true },
      { label: "Call-Stack", route: "/call-stack", show: isAdmin },
    ],
    [isAdmin]
  );

  useEffect(() => {
    try {
      const savedFlame = localStorage.getItem(FLAME_STORAGE_KEY);
      if (savedFlame) {
        const parsed = JSON.parse(savedFlame);
        if (Array.isArray(parsed)) {
          setFlameImages(parsed.filter(Boolean));
        }
      }
    } catch (err) {
      console.error("Error loading flame images:", err);
    }

    try {
      const savedMarquee = localStorage.getItem(MARQUEE_STORAGE_KEY);
      if (savedMarquee) {
        setMarqueeImages(JSON.parse(savedMarquee));
      }
    } catch (err) {
      console.error("Error loading marquee images:", err);
    }
  }, []);

  useEffect(() => {
    if (!API_URL) return;
    let ignore = false;

    const loadFlameConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/ui/flame`);
        if (!res.ok) return;
        const data = await res.json();
        const frames = Array.isArray(data?.frames)
          ? data.frames.filter(Boolean)
          : [];
        if (!ignore && frames.length > 0) {
          setFlameImages(frames);
          localStorage.setItem(FLAME_STORAGE_KEY, JSON.stringify(frames));
        }
      } catch (err) {
        console.error("Error loading flame config:", err);
      }
    };

    loadFlameConfig();
    return () => {
      ignore = true;
    };
  }, []);

  const colors = useMemo(() => {
    const headerBg =
      tkn?.surface?.header ?? currentTheme?.headerBg ?? "#0f172a";

    const headerText =
      tkn?.text?.heading ??
      tkn?.text?.primary ??
      currentTheme?.headerTextColor ??
      currentTheme?.mainTextColor ??
      "#e2e8f0";

    const border =
      tkn?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(255,255,255,0.35)";

    const chipLitBg =
      tkn?.status?.accent ??
      tkn?.action?.primary ??
      currentTheme?.buttonColor ??
      "#ea580c";

    const chipGoldBg =
      tkn?.status?.warning ??
      tkn?.status?.gold ??
      "#ca8a04";

    const chipCloudBg =
      tkn?.status?.info ??
      "#0ea5e9";

    const chipClassesBg =
      tkn?.status?.success ??
      "#22c55e";

    const chipText = tkn?.text?.inverse ?? currentTheme?.buttonText ?? "#fff";

    return {
      headerBg,
      headerText,
      border,
      chipLitBg,
      chipGoldBg,
      chipCloudBg,
      chipClassesBg,
      chipText,
    };
  }, [tkn, currentTheme]);

  const headerStyle = {
    color: colors.headerText,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.headerBg,
  };

  const railStyle = {
    color: colors.headerText,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.headerBg,
  };

  const ChipWithBurst = ({ show, onBurstClick, children }) => (
    <div className="relative inline-flex items-center justify-center">
      {children}
      {show &&
        (onBurstClick ? (
          <button
            type="button"
            aria-label="Adjust metrics"
            className="spiky-cloud"
            onClick={onBurstClick}
          >
            <span className="spiky-cloud-text">MAX</span>
          </button>
        ) : (
          <span className="spiky-cloud" aria-hidden="true">
            <span className="spiky-cloud-text">MAX</span>
          </span>
        ))}
    </div>
  );

  const handleBurstClick = () => {
    if (!isAdmin) return;
    navigate("/admin-dashboard");
  };

  const handleSecondaryNav = (route) => {
    if (!route) return;
    navigate(route);
  };

  const LitChip = !isTtv ? (
    <ChipWithBurst show={litAtMax} onBurstClick={isAdmin ? handleBurstClick : undefined}>
      <div
        className="flex flex-col items-center justify-center gap-0.5 text-xs font-semibold px-3 py-2 rounded-xl shadow leading-none"
        style={{ backgroundColor: colors.chipLitBg, color: colors.chipText }}
        title="Lit"
      >
        <span role="img" aria-label="Lit">
          🔥
        </span>
        <span>{lit}</span>
      </div>
    </ChipWithBurst>
  ) : null;

  const creditLimitTooltip =
    "You've reached the free TTV credit limit. You get 3 free credits a second while credits <= 10,000. Click here to buy more credits";

  const CreditsChip = userLoggedIn ? (
    <ChipWithBurst show={creditsAtMax} onBurstClick={isAdmin ? handleBurstClick : undefined}>
      <button
        type="button"
        onClick={() => setCreditsModalOpen(true)}
        className="flex flex-col items-center justify-center gap-0.5 text-xs font-semibold px-3 py-2 rounded-xl shadow active:scale-[0.98] transition-transform leading-none"
        style={{ backgroundColor: colors.chipGoldBg, color: colors.chipText }}
        title={creditsAtMax ? creditLimitTooltip : "Credits"}
        aria-label="Credits"
      >
        <span role="img" aria-label="Credits">
          💰
        </span>
        <span>{credits}</span>
      </button>
    </ChipWithBurst>
  ) : null;

  const CloudChip =
    userLoggedIn && !isTtv ? (
      <ChipWithBurst show={cloudAtMax}>
        <div
          className="flex flex-col items-center justify-center gap-0.5 text-xs font-semibold px-3 py-2 rounded-xl shadow leading-none"
          style={{ backgroundColor: colors.chipCloudBg, color: colors.chipText }}
          title="Cloud"
        >
          <FiCloud size={14} />
          <span>{cloud}</span>
        </div>
      </ChipWithBurst>
    ) : null;

  const ClassesChip =
    userLoggedIn && !isTtv ? (
      <ChipWithBurst show={classesAtMax}>
        <div
          className="flex flex-col items-center justify-center gap-0.5 text-xs font-semibold px-3 py-2 rounded-xl shadow leading-none"
          style={{ backgroundColor: colors.chipClassesBg, color: colors.chipText }}
          title="Classes"
        >
          <FiUsers size={14} />
          <span>{classes}</span>
        </div>
      </ChipWithBurst>
    ) : null;

  const hasAnyChip = Boolean(LitChip || CreditsChip || CloudChip || ClassesChip);

  const selectedApp = location.pathname.startsWith("/ttv")
    ? "TTV"
    : location.pathname.startsWith("/code-monkey")
    ? "Code Explorer"
    : location.pathname.startsWith("/eagle")
    ? "Eagle Engineering"
    : location.pathname.startsWith("/memoize")
    ? "Memoize"
    : location.pathname.startsWith("/math-madness")
    ? "Math-Madness"
    : "Literate";

  const activeAppId = useMemo(() => {
    if (location.pathname.startsWith("/ttv")) return "ttv";
    if (location.pathname.startsWith("/code-monkey")) return "code-monkey";
    if (location.pathname.startsWith("/eagle")) return "eagle";
    if (location.pathname.startsWith("/memoize")) return "memoize";
    if (location.pathname.startsWith("/math-madness")) return "math-madness";
    return "literate";
  }, [location.pathname]);

  const appDeck = useMemo(
    () => [
      {
        id: "literate",
        label: "HQ",
        eyebrow: "Literate",
        icon: <FiGrid size={16} />,
        route: "/",
        accent: ["#22d3ee", "#34d399"],
      },
      {
        id: "ttv",
        label: "TelepromptTV",
        eyebrow: "Studio",
        icon: <FiTv size={16} />,
        route: "/ttv",
        accent: ["#fb923c", "#facc15"],
      },
      {
        id: "code-monkey",
        label: "Code Explorer",
        eyebrow: "Code",
        icon: <FiCpu size={16} />,
        route: "/code-monkey",
        accent: ["#6366f1", "#22d3ee"],
      },
      {
        id: "memoize",
        label: "Memoize",
        eyebrow: "Memory",
        icon: <FiAperture size={16} />,
        route: "/memoize",
        accent: ["#0ea5e9", "#14b8a6"],
      },
      {
        id: "eagle",
        label: "Eagle Engineering",
        eyebrow: "Build",
        icon: <FiCompass size={16} />,
        route: "/eagle",
        accent: ["#a3e635", "#22c55e"],
      },
      {
        id: "math-madness",
        label: "Math Lab",
        eyebrow: "Math",
        icon: <FiPieChart size={16} />,
        route: "/math-madness",
        accent: ["#facc15", "#38bdf8"],
      },
    ],
    []
  );

  const handleAppSelect = (appId) => {
    if (appId === "more") {
      setAppSwitcherOpen(true);
      return;
    }
    const found = appDeck.find((app) => app.id === appId);
    if (found?.route) {
      navigate(found.route);
      return;
    }
    setAppSwitcherOpen(true);
  };

  useEffect(() => {
    const openHandler = () => setAppSwitcherOpen(true);
    window.addEventListener("open-app-switcher", openHandler);
    return () => window.removeEventListener("open-app-switcher", openHandler);
  }, []);

  const AppDock = () => (
    <div className="app-dock flex items-center gap-2 px-2 py-1">
      {appDeck.map((app) => {
        const isActive = activeAppId === app.id;
        const style = isActive
          ? {
              background: `linear-gradient(135deg, ${app.accent[0]}, ${app.accent[1]})`,
              color: "#0b1224",
            }
          : undefined;

        return (
          <button
            key={app.id}
            type="button"
            onClick={() => handleAppSelect(app.id)}
            className={`app-pill flex items-center gap-2 pr-3 pl-2 h-[46px] min-w-[54px] ${
              isActive ? "is-active" : ""
            }`}
            style={style}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
              }}
            >
              {app.icon}
            </span>
            <div className="hidden lg:flex flex-col leading-tight text-left">
              <span
                className="text-[11px] uppercase tracking-[0.18em] opacity-80"
                style={{ fontFamily: "var(--display-font)" }}
              >
                {app.eyebrow}
              </span>
              <span className="text-sm font-semibold" style={{ fontFamily: "var(--display-font)" }}>
                {app.label}
              </span>
            </div>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => handleAppSelect("more")}
        className="app-pill flex items-center gap-2 px-3 py-2 h-[46px] min-w-[92px]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <FiMoreHorizontal size={16} />
        </span>
        <div className="hidden lg:flex flex-col leading-tight text-left">
          <span
            className="text-[11px] uppercase tracking-[0.18em] opacity-80"
            style={{ fontFamily: "var(--display-font)" }}
          >
            Deck
          </span>
          <span className="text-sm font-semibold" style={{ fontFamily: "var(--display-font)" }}>
            More
          </span>
        </div>
      </button>
    </div>
  );

  const QuickActions = () => (
    <div className="flex items-center gap-2 shrink-0 ml-auto">
      <Link
        to="/docs"
        className="hidden md:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 transition"
      >
        <HiDocumentText size={16} />
        <span className="hidden lg:inline">Docs</span>
      </Link>
      {hasAnyChip && (
        <div className="token-stack hidden sm:flex items-center gap-1 px-2 py-1">
          {LitChip}
          {CreditsChip}
          {CloudChip}
          {ClassesChip}
        </div>
      )}
      <div className="ml-1">
        <ProfileDropdown />
      </div>
    </div>
  );

  const Bar = () => (
    <>
      <div
        className="fixed left-0 right-0 top-0 h-[64px] z-[60] shadow-md command-shell relative overflow-hidden"
        style={{
          ...headerStyle,
          height: `${MAIN_HEADER_HEIGHT}px`,
        }}
      >
        <div className="relative flex items-center h-full px-3 gap-3 w-full max-w-screen mx-auto overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="shrink-0">
              <FlickeringFlame images={flameImages} size={36} interval={100} />
            </Link>
            <div className="hidden sm:flex flex-col leading-tight" style={{ fontFamily: "var(--display-font)" }}>
              <span className="text-[11px] uppercase tracking-[0.32em] text-slate-200">
                Mission Control
              </span>
              <div className="flex items-center gap-2 text-slate-50">
                <span className="text-lg font-semibold">{selectedApp}</span>
                <span className="h-[6px] w-10 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 animate-pulse-slow" />
              </div>
            </div>
            <div className="hidden lg:block">
              <FlickeringMarquee
                orbImage={marqueeImages.orb}
                bannerImage={marqueeImages.banner}
                orbSize={34}
                bannerWidth={120}
                bannerHeight={36}
                interval={3600}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex justify-center overflow-x-auto no-scrollbar px-1">
            <AppDock />
          </div>

          <QuickActions />
        </div>
      </div>
      {null}
    </>
  );

  return (
    <>
      <Bar isMobile={false} />

      {creditsModalOpen && (
        <BuyCreditsModal open onClose={() => setCreditsModalOpen(false)} />
      )}
      {appSwitcherOpen && (
        <AppSwitcherModal
          open
          selectedApp={selectedApp}
          onClose={() => setAppSwitcherOpen(false)}
          onSelect={(appId) => {
            setAppSwitcherOpen(false);
            if (appId === "ttv") {
              navigate("/ttv");
              return;
            }
            if (appId === "code-monkey") {
              navigate("/code-monkey");
              return;
            }
            if (appId === "eagle") {
              navigate("/eagle");
              return;
            }
            if (appId === "memoize") {
              navigate("/memoize");
              return;
            }
            if (appId === "math-madness") {
              navigate("/math-madness");
              return;
            }
            navigate("/");
          }}
        />
      )}
    </>
  );
}
