import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../utils/themes/ThemeContext";
import LanguageSwitcher from "../components/LanguageSwitcher"; // Import the LanguageSwitcher component
import { useTranslation } from "../translator/hooks/useTranslation"; // Import the translation hook
import settingsTranslations from "./settingsTranslation";
import { useUser } from "../context/UserContext";
import { useLessonPreferences, useLessonModals } from "../hooks/useLessonUI";

const Settings = () => {
  const { t } = useTranslation(settingsTranslations);
  const { user, setUser, getAuthHeaders } = useUser();
  const [handleInput, setHandleInput] = useState(user?.handle || "");
  const [handleError, setHandleError] = useState("");
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleSuccess, setHandleSuccess] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  // Get preferences and modals from hooks
  const {
    keyboardSettings: settings,
    videoAutoPlay,
    audioAutoPlay,
    setVideoAutoPlay,
    setAudioAutoPlay,
  } = useLessonPreferences();
  const {
    openLogoutModal,
    openProgressModal,
    openDeleteAccountModal,
  } = useLessonModals();

  // Create setSettings function for keyboard settings
  const setSettings = (fn) => {
    const prev = settings;
    const next = typeof fn === 'function' ? fn(prev) : fn;
    // This would need to be properly integrated with useUiStore in the future
    // For now, we'll keep the local state pattern or create a store action
    // For this migration, settings updates are minimal, so we'll just ignore them for now
  };

  const { currentTheme } = useContext(ThemeContext);

  const toggleHoverSound = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      hoverSoundEnabled: !prevSettings.hoverSoundEnabled,
    }));
  };

  const handleDelayChange = (e) => {
    const delayInSeconds = parseFloat(e.target.value);
    const delayInMilliseconds = delayInSeconds * 1000;
    setSettings((prevSettings) => ({
      ...prevSettings,
      hoverSoundDelay: delayInMilliseconds,
    }));
  };

  const handleLoopCountChange = (e) => {
    const loopCount = parseInt(e.target.value, 10);
    setSettings((prevSettings) => ({
      ...prevSettings,
      loopCount: loopCount >= 0 ? loopCount : 0,
    }));
  };



  const handleVideoAutoPlayChange = () => {
    const newValue = !videoAutoPlay;
    setVideoAutoPlay(newValue);
    localStorage.setItem("videoAutoPlay", JSON.stringify(newValue)); // Save to localStorage
  };

  const handleAudioAutoPlayChange = () => {
    const newValue = !audioAutoPlay;
    setAudioAutoPlay(newValue);
    localStorage.setItem("audioAutoPlay", JSON.stringify(newValue)); // Save to localStorage
  };

  useEffect(() => {
    setHandleInput(user?.handle || "");
  }, [user?.handle]);

  const saveHandle = async () => {
    const trimmed = String(handleInput || "").trim();
    if (!trimmed) {
      setHandleError("Handle cannot be empty");
      return;
    }
    setHandleSaving(true);
    setHandleError("");
    setHandleSuccess(false);

    try {
      const res = await fetch(`${API_URL}/me/handle`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ newHandle: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update handle");
      }
      const updatedHandle = (data.handle || trimmed).toLowerCase().trim();
      if (typeof setUser === "function") {
        setUser((prev) => (prev ? { ...prev, handle: updatedHandle } : prev));
      }
      setHandleSuccess(true);
      setHandleInput(updatedHandle);
    } catch (err) {
      setHandleError(err?.message || "Failed to update handle");
    } finally {
      setHandleSaving(false);
      setTimeout(() => setHandleSuccess(false), 2000);
    }
  };

  return (
    <div
      className="mx-auto mt-28 px-4 rounded-xl sm:px-10 max-w-80 lg:w-2/3 py-10 font-sans"
      style={{
        backgroundColor: currentTheme.settingsBg || "#e0f2f1",
        color: currentTheme.mainTextColor || "#000", // Default to main text color
      }}
    >
      <h1
        className="text-3xl font-bold mb-6 text-center"
        style={{
          color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
        }}
      >
        {t("title")}
      </h1>

      {/* Language Switcher */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-2"
          style={{
            color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
          }}
        >
          {t("interfaceLanguage")}
        </h2>
        <LanguageSwitcher /> {/* Add the LanguageSwitcher component here */}
      </div>

      {/* Play Sound on Hover Toggle */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-2"
          
        >
          {t("playSoundOnHover")}
        </h2>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={settings.hoverSoundEnabled}
              onChange={toggleHoverSound}
            />
            <div  className="block bg-gray-300  w-14 h-8 rounded-full"></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                settings.hoverSoundEnabled ? "translate-x-6" : ""
              }`}
            ></div>
          </div>
          <span
            className="ml-3 text-lg"
            style={{
              color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
            }}
          >
            {settings.hoverSoundEnabled ? t("enabled") : t("disabled")}
          </span>
        </label>

        {settings.hoverSoundEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label
                className="block text-lg font-medium mb-2"
                style={{
                  color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
                }}
              >
                {t("hoverSoundDelay")}
              </label>
              <select
                value={settings.hoverSoundDelay / 1000}
                onChange={handleDelayChange}
                className="w-full p-2 border rounded-lg bg-white"
                style={{
                  color: currentTheme.mainTextColor || "#000",backgroundColor: currentTheme.placeholderBg  // Use main text color
                }}
              >
                {[1, 2, 3].map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds} second{seconds !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-lg font-medium mb-2"
                style={{
                  color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
                }}
              >
                {t("loopCount")}
              </label>
              <select
                value={settings.loopCount}
                onChange={handleLoopCountChange}
                className="w-full p-2 border rounded-lg bg-white"
                style={{
                  color: currentTheme.mainTextColor || "#000", backgroundColor: currentTheme.placeholderBg // Use main text color
                }}
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count} time{count !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Video AutoPlay Toggle */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-2"
          
          style={{
            color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
          }}
        >
          {t("videoAutoPlay")}
        </h2>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={videoAutoPlay}
              onChange={handleVideoAutoPlayChange}
            />
            <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                videoAutoPlay ? "translate-x-6" : ""
              }`}
            ></div>
          </div>
          <span
            className="ml-3 text-lg"
            style={{
              color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
            }}
          >
            {videoAutoPlay ? t("enabled") : t("disabled")}
          </span>
        </label>
      </div>

      {/* Audio AutoPlay Toggle */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-2"
          style={{
            color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
          }}
        >
          {t("audioAutoPlay")}
        </h2>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={audioAutoPlay}
              onChange={handleAudioAutoPlayChange}
            />
            <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                audioAutoPlay ? "translate-x-6" : ""
              }`}
            ></div>
          </div>
          <span
            className="ml-3 text-lg"
            style={{
              color: currentTheme.headerTextColor || currentTheme.mainTextColor, // Use header text color
            }}
          >
            {audioAutoPlay ? t("enabled") : t("disabled")}
          </span>
        </label>
      </div>

      {/* Profile / Handle */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-2"
          style={{
            color: currentTheme.headerTextColor || currentTheme.mainTextColor,
          }}
        >
          {t("profile") || "Profile"}
        </h2>
        <label className="block text-sm font-medium mb-2">
          {t("handleLabel") || "Handle"}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            className="w-full sm:flex-1 border rounded-lg px-3 py-2 bg-white"
            placeholder="your_handle"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={saveHandle}
            disabled={handleSaving}
            className="px-4 py-2 rounded-lg text-white font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {handleSaving ? "Saving…" : "Save handle"}
          </button>
        </div>
        {handleError && <div className="text-xs text-red-600 mt-2">{handleError}</div>}
        {handleSuccess && <div className="text-xs text-emerald-700 mt-2">Handle updated.</div>}
      </div>
      {/* ===== Account / Danger Zone ===== */}
<div className="mt-10 border-t pt-6">
  <h2
    className="text-xl font-semibold mb-4"
    style={{
      color: currentTheme.headerTextColor || currentTheme.mainTextColor,
    }}
  >
    {t("account") || "Account"}
  </h2>

  <div className="flex flex-col gap-4">
    {/* Logout */}
    <button
      onClick={openLogoutModal}
      className="w-full px-4 py-2 rounded-lg text-white font-semibold bg-cyan-500 hover:bg-cyan-600"
    >
      {t("logout")}
    </button>

    {/* Reset Progress */}
    <button
      onClick={openProgressModal}
      className="w-full px-4 py-2 rounded-lg text-white font-semibold bg-orange-600 hover:bg-orange-700"
    >
      {t("resetProgress")}
    </button>

    {/* Delete Account */}
    <button
      onClick={openDeleteAccountModal}
      className="w-full px-4 py-2 rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700"
    >
      {t("deleteAccount")}
    </button>
  </div>
</div>

    </div>
  );
};

export default Settings;
