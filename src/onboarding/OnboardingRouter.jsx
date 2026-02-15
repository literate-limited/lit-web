// src/onboarding/OnboardingRouter.jsx
// Main onboarding state machine router - renders correct stage based on user.onboardingStage

import { useEffect, useState, useContext, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useLanguage } from "../stores/useLanguageStore";
import { Circles } from "react-loader-spinner";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "../translator/hooks/useTranslation";
import { useBrand } from "../brands/BrandContext";
import { getTutorialsForInvites } from "./tutorials";
import { trackTutorialClick, trackTutorialImpression } from "../utils/analytics/tutorials";
import onboardingTranslations from "./translations";

import NeedsStep from "./steps/NeedsStep";
import NativeLanguageStep from "./steps/NativeLanguageStep";
import DisplayLanguageStep from "./steps/DisplayLanguageStep";
import SelectLearningTargetsStep from "./steps/SelectLearningTargetsStep";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const STAGE_ORDER = ["NEEDS", "NATIVE_LANGUAGE", "DISPLAY_LANGUAGE", "LEARNING_TARGETS"];

const STAGE_COMPONENTS = {
  NEEDS: NeedsStep,
  NATIVE_LANGUAGE: NativeLanguageStep,
  DISPLAY_LANGUAGE: DisplayLanguageStep,
  LEARNING_TARGETS: SelectLearningTargetsStep,
};

const STAGE_LABEL_KEYS = {
  NEEDS: "onboarding.stage.needs",
  NATIVE_LANGUAGE: "onboarding.stage.nativeLanguage",
  DISPLAY_LANGUAGE: "onboarding.stage.displayLanguage",
  LEARNING_TARGETS: "onboarding.stage.learningTargets",
};

const INVITE_TYPES_KEY = "onboardingInviteTypes";
const clearInviteTypesFromStorage = () => {
  try {
    localStorage.removeItem(INVITE_TYPES_KEY);
  } catch {
    /* ignore */
  }
};

// Progress indicator component
function ProgressIndicator({
  currentStage,
  hasLearning,
  accent = "#2a1c0f",
  muted = "rgba(42,28,15,0.2)",
  text = "#2a1c0f",
  inverse = "#ffffff",
}) {
  // Determine which steps to show based on whether user has "learning" in needs
  const steps = hasLearning
    ? STAGE_ORDER
    : STAGE_ORDER.filter((s) => s !== "LEARNING_TARGETS");

  const currentIndex = steps.indexOf(currentStage);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, idx) => {
        const isActive = step === currentStage;
        const isCompleted = idx < currentIndex;

        return (
          <div key={step} className="flex items-center">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: isActive || isCompleted ? accent : muted,
                color: isActive || isCompleted ? inverse : text,
              }}
            >
              {isCompleted ? "✓" : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div
                className="w-8 h-1 mx-1 rounded"
                style={{
                  backgroundColor: isCompleted ? accent : muted,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TutorialRail({
  tutorials,
  accent,
  cardBorder,
  cardBg,
  textPrimary,
  textSecondary,
  isFinalStage,
  inviteTypes,
}) {
  if (!tutorials?.length) return null;
  return (
    <div className="mt-5 border-t pt-4" style={{ borderColor: cardBorder }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: textSecondary }}>
            Tutorials
          </p>
          <h3 className="text-lg font-semibold" style={{ color: textPrimary }}>
            {isFinalStage ? "Finish onboarding, then jump in" : "Queued for you"}
          </h3>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${accent}22`,
            color: accent,
            border: `1px solid ${cardBorder}`,
          }}
        >
          {tutorials.length} ready
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tutorials.map((tut) => (
          <a
            key={tut.id}
            href={tut.href}
            onClick={() => trackTutorialClick(tut.id, inviteTypes)}
            className="block rounded-lg p-3 transition-all border hover:-translate-y-[2px] hover:shadow-lg"
            style={{ borderColor: cardBorder, backgroundColor: cardBg }}
          >
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: textSecondary }}>
              {tut.id}
            </p>
            <div className="font-semibold mb-1" style={{ color: textPrimary }}>
              {tut.title}
            </div>
            <p className="text-sm" style={{ color: textSecondary }}>
              {tut.summary}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingRouter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTheme } = useContext(ThemeContext);
  const { theme } = useContext(ThemeContext);
  const lang = useLanguage();
  const { t } = useTranslation(onboardingTranslations);
  const { brandId, brand } = useBrand();

  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [skipping, setSkipping] = useState(false);
  const [inviteTypes, setInviteTypes] = useState(() => {
    const fromParam = (searchParams.get("invites") || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    let stored = [];
    try {
      const raw = localStorage.getItem(INVITE_TYPES_KEY);
      stored = raw ? JSON.parse(raw) : [];
    } catch {
      stored = [];
    }
    return Array.from(new Set([...fromParam, ...(stored || [])]));
  });
  const resetInviteTypes = () => {
    setInviteTypes([]);
    clearInviteTypesFromStorage();
  };
  const impressionsRef = useRef(new Set());

  const authToken = localStorage.getItem("token");
  const redirectParam = searchParams.get("redirect");
  const defaultRedirect = brandId === "ttv" ? "/ttv" : "/";
  const redirectTarget =
    redirectParam || localStorage.getItem("onboardingRedirect") || defaultRedirect;

  useEffect(() => {
    if (redirectParam) {
      localStorage.setItem("onboardingRedirect", redirectParam);
    }
  }, [redirectParam]);

  useEffect(() => {
    const fromParam = (searchParams.get("invites") || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    if (!fromParam.length) return;
    setInviteTypes((prev) => Array.from(new Set([...prev, ...fromParam])));
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(INVITE_TYPES_KEY, JSON.stringify(inviteTypes));
    } catch {
      /* ignore */
    }
  }, [inviteTypes]);

  const clearRedirect = () => {
    localStorage.removeItem("onboardingRedirect");
  };

  // ⚠️ HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Calculate tutorials based on invite types
  const tutorials = useMemo(
    () => getTutorialsForInvites(inviteTypes),
    [inviteTypes]
  );

  // Track tutorial impressions
  useEffect(() => {
    const seen = impressionsRef.current;
    tutorials.forEach((t) => {
      if (!t?.id || seen.has(t.id)) return;
      trackTutorialImpression(t.id, inviteTypes);
      seen.add(t.id);
    });
  }, [tutorials, inviteTypes]);

  // Determine if user has learning need (safe to calculate early, will be used later)
  const hasLearning = userData?.needs?.includes("learning") ?? true;

  const fetchStatus = async () => {
    if (!authToken) {
      navigate("/login?redirect=/onboarding", { replace: true });
      return;
    }

    try {
      const { data } = await axios.get(`${API_URL}/onboarding/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!data?.success) {
        setError(
          data?.message || tt("onboarding.error.loadStatus", "Failed to load onboarding status.")
        );
        setLoading(false);
        return;
      }

      // If already complete, redirect to destination
      if (data.onboarding.isComplete || data.onboarding.stage === "DONE") {
        resetInviteTypes();
        clearRedirect();
        navigate(redirectTarget, { replace: true });
        return;
      }

      setStage(data.onboarding.stage);
      setActiveStage(data.onboarding.stage);
      setUserData({
        name: data.userName,
        needs: data.onboarding.needs,
        nativeLanguage: data.onboarding.nativeLanguage,
        displayLanguage: data.onboarding.displayLanguage,
        learningIntent: data.onboarding.learningIntent,
      });
      setLoading(false);
    } catch (e) {
      const status = e.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        navigate("/login?redirect=/onboarding", { replace: true });
        return;
      }
      setError(
        e.response?.data?.message ||
          e.message ||
          tt("onboarding.error.generic", "Something went wrong.")
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [authToken, navigate, redirectTarget]);

  const handleStageComplete = async (nextStage) => {
    if (nextStage === "DONE") {
      resetInviteTypes();
      clearRedirect();
      navigate(redirectTarget, { replace: true });
      return;
    }
    // Refresh status to get the new stage
    setLoading(true);
    await fetchStatus();
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Set defaults and complete onboarding
      // Step 1: Set needs if not set
      if (!userData?.needs?.length) {
        await axios.post(
          `${API_URL}/onboarding/needs`,
          { needs: ["social", "learning"] },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }

      // Step 2: Set native language if not set (use current UI language)
      const nativeLang = userData?.nativeLanguage || lang || "en";
      await axios.post(
        `${API_URL}/onboarding/native-language`,
        { nativeLanguage: nativeLang },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Step 3: Set display language (same as native)
      await axios.post(
        `${API_URL}/onboarding/display-language`,
        { useNative: true },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Step 4: Set learning targets if user has learning need
      const currentNeeds = userData?.needs || ["social", "learning"];
      if (currentNeeds.includes("learning")) {
        await axios.post(
          `${API_URL}/onboarding/learning-targets`,
          {
            learningTargets: [
              { type: "language", targetId: "en", priority: 1 },
              { type: "domain", targetId: "math", priority: 2 },
            ],
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }

      resetInviteTypes();
      clearRedirect();
      navigate(redirectTarget, { replace: true });
    } catch (e) {
      console.error("Skip onboarding error:", e);
      setError(
        tt("onboarding.error.skip", "Failed to skip onboarding. Please try again.")
      );
      setSkipping(false);
    }
  };

  // Render wrapper with LanguageSwitcher
  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const muted = `${accent}33`;
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  const renderWithWrapper = (content) => (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6 relative"
      style={{ backgroundColor: pageBg, color: textPrimary }}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-lg">
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: `0 0 35px ${glow}`,
          }}
        >
          <div className="flex justify-center mb-3">
            <img
              className="h-14 w-14"
              src={brand?.logo}
              alt={brand?.name || "Lit"}
            />
          </div>
          {content}
        </div>
      </div>
    </section>
  );

  if (loading) {
    return renderWithWrapper(
      <div className="flex flex-col items-center gap-4">
        <Circles height="50" width="50" color={accent} />
        <p className="text-sm opacity-70" style={{ color: textSecondary }}>
          {tt("onboarding.loading", "Loading...")}
        </p>
      </div>
    );
  }

  if (error) {
    return renderWithWrapper(
      <div className="text-center">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-xl font-bold mb-3" style={{ color: textPrimary }}>
          {tt("onboarding.error.title", "Something went wrong")}
        </h1>
        <p className="opacity-80 mb-6" style={{ color: textSecondary }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
          style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
        >
          {tt("onboarding.error.retry", "Try Again")}
        </button>
      </div>
    );
  }

  // After error/loading checks, determine which component to render
  const stageToRender = activeStage || stage || "NEEDS";
  const StageComponent = STAGE_COMPONENTS[stageToRender];

  if (!StageComponent) {
    // Unknown stage, redirect to home
    navigate("/", { replace: true });
    return null;
  }
  const steps = hasLearning
    ? STAGE_ORDER
    : STAGE_ORDER.filter((s) => s !== "LEARNING_INTENT");
  const currentStepIndex = steps.indexOf(stageToRender);
  const canGoBack = currentStepIndex > 0;

  const handleBack = () => {
    if (!canGoBack) return;
    const previousStage = steps[currentStepIndex - 1];
    if (previousStage) {
      setActiveStage(previousStage);
    }
  };

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6 relative"
      style={{ backgroundColor: pageBg, color: textPrimary }}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-2xl">
        <div
          className="rounded-xl p-6 sm:p-7"
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: `0 0 35px ${glow}`,
          }}
        >
          <div className="flex justify-center mb-3">
            <img
              className="h-14 w-14"
              src={brand?.logo}
              alt={brand?.name || "Lit"}
            />
          </div>

          <div className="flex items-center justify-between text-xs mb-4">
            <button
              onClick={handleBack}
              disabled={!canGoBack}
              className="underline disabled:opacity-40"
            >
              {tt("onboarding.back", "Back")}
            </button>
            <button
              onClick={handleSkip}
              disabled={skipping}
              className="underline disabled:opacity-50"
            >
              {skipping
                ? tt("onboarding.skip.loading", "Skipping...")
                : tt("onboarding.skip.label", "Skip for now")}
            </button>
          </div>

          <div className="pb-4">
            <ProgressIndicator
              currentStage={stageToRender}
              hasLearning={hasLearning}
              accent={accent}
              muted={muted}
              text={textPrimary}
              inverse={inverseText}
            />
            <p className="text-center text-sm opacity-70">
              {tt(STAGE_LABEL_KEYS[stageToRender], stageToRender)}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <StageComponent
              userData={userData}
              onComplete={handleStageComplete}
              currentTheme={currentTheme}
              currentLang={lang}
              brandName={brand?.name || "Lit"}
            />
          </div>

          <TutorialRail
            tutorials={tutorials}
            accent={accent}
            cardBorder={cardBorder}
            cardBg={theme?.surface?.containerSubtle ?? cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            isFinalStage={stageToRender === steps[steps.length - 1]}
            inviteTypes={inviteTypes}
          />
        </div>
      </div>
    </section>
  );
}
