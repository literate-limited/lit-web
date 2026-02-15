// src/onboarding/steps/SelectLearningTargetsStep.jsx
// Collect and order user learning targets (languages, domains, skills, etc)
// Replaces binary LearningIntentStep with real goal structure

import { useContext, useState } from "react";
import axios from "axios";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../../translator/hooks/useTranslation";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import onboardingTranslations from "../translations";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Available targets (can be extended with more options)
const AVAILABLE_TARGETS = {
  languages: [
    { id: "en", name: "English", icon: "🇬🇧" },
    { id: "es", name: "Spanish", icon: "🇪🇸" },
    { id: "fr", name: "French", icon: "🇫🇷" },
    { id: "de", name: "German", icon: "🇩🇪" },
    { id: "it", name: "Italian", icon: "🇮🇹" },
    { id: "pt", name: "Portuguese", icon: "🇵🇹" },
    { id: "ru", name: "Russian", icon: "🇷🇺" },
    { id: "ja", name: "Japanese", icon: "🇯🇵" },
    { id: "zh", name: "Mandarin", icon: "🇨🇳" },
    { id: "ar", name: "Arabic", icon: "🇸🇦" },
    { id: "he", name: "Hebrew", icon: "🇮🇱" },
    { id: "ko", name: "Korean", icon: "🇰🇷" },
  ],
  domain: [
    { id: "math", name: "Mathematics", icon: "📐" },
    { id: "science", name: "Science", icon: "🧬" },
    { id: "history", name: "History", icon: "📚" },
    { id: "literature", name: "Literature", icon: "📖" },
    { id: "business", name: "Business", icon: "💼" },
    { id: "programming", name: "Programming", icon: "💻" },
    { id: "music", name: "Music", icon: "🎵" },
    { id: "art", name: "Art", icon: "🎨" },
  ],
};

function DragHandle({ onMouseDown }) {
  return (
    <button
      onMouseDown={onMouseDown}
      className="cursor-grab active:cursor-grabbing text-xl leading-none flex-shrink-0"
      title="Drag to reorder"
    >
      ⋮⋮
    </button>
  );
}

export default function SelectLearningTargetsStep({ userData, onComplete, currentTheme }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(onboardingTranslations);
  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  // Selected targets: [{ type, id, name, icon }, ...]
  const [selected, setSelected] = useState([]);
  // Currently showing what category
  const [categoryMode, setCategoryMode] = useState(null); // 'languages' or 'domain'
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authToken = localStorage.getItem("token");

  // Add a target
  const addTarget = (type, targetId, name, icon) => {
    // Prevent duplicates
    if (selected.some((t) => t.type === type && t.id === targetId)) {
      return;
    }
    setSelected((prev) => [...prev, { type, id: targetId, name, icon }]);
  };

  // Remove a target by index
  const removeTarget = (index) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag start
  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  // Drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;

    const items = [...selected];
    [items[draggingIndex], items[index]] = [items[index], items[draggingIndex]];
    setSelected(items);
    setDraggingIndex(index);
  };

  // Drag end
  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  // Submit
  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError("Please select at least one learning target");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create targets in priority order
      const targets = selected.map((t, idx) => ({
        type: t.type === "languages" ? "language" : "domain",
        targetId: t.id,
        priority: idx + 1,
      }));

      // Call onboarding endpoint to save targets
      const { data } = await axios.post(
        `${API_URL}/onboarding/learning-targets`,
        { learningTargets: targets },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data.success) {
        onComplete(data.nextStage);
      } else {
        setError(data.message || "Failed to save targets");
        setLoading(false);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      setLoading(false);
    }
  };

  // Theme
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const border = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const surfaceSelected = theme?.surface?.interactive ?? currentTheme?.innerContainerColor ?? "#f7edd1";
  const surface = theme?.surface?.containerSubtle ?? currentTheme?.placeholderBg ?? "#ffffff";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  // Show category selection or target selection
  if (!categoryMode) {
    return (
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>
            What do you want to learn?
          </h1>
          <p className="opacity-80" style={{ color: textSecondary }}>
            Pick from languages, domains, or both. You can change this anytime.
          </p>
        </div>

        {/* Category Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => setCategoryMode("languages")}
            className="w-full p-6 rounded-xl border-2 text-left transition-all hover:opacity-90"
            style={{ borderColor: border, backgroundColor: surface }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: textPrimary }}>
                  🌍 Languages
                </h3>
                <p className="text-sm opacity-70 mt-1" style={{ color: textSecondary }}>
                  Learn new languages with interactive lessons and native content
                </p>
              </div>
              <span style={{ color: accent }}>→</span>
            </div>
          </button>

          <button
            onClick={() => setCategoryMode("domain")}
            className="w-full p-6 rounded-xl border-2 text-left transition-all hover:opacity-90"
            style={{ borderColor: border, backgroundColor: surface }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: textPrimary }}>
                  🧠 Domain Knowledge
                </h3>
                <p className="text-sm opacity-70 mt-1" style={{ color: textSecondary }}>
                  Master subjects like math, science, history, and more
                </p>
              </div>
              <span style={{ color: accent }}>→</span>
            </div>
          </button>
        </div>

        {/* Current Selection Preview */}
        {selected.length > 0 && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: `${accent}10`, borderColor: border, border: `1px solid ${border}` }}>
            <p className="text-sm font-semibold mb-2" style={{ color: textSecondary }}>
              Selected targets ({selected.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((t, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  style={{ backgroundColor: surfaceSelected, color: textPrimary }}
                >
                  {t.icon} {t.name}
                  <button onClick={() => removeTarget(idx)} className="font-bold opacity-60 hover:opacity-100">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add More Button */}
        {selected.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>
            Select from languages and/or domains above
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setCategoryMode("languages")}
              className="flex-1 py-2 px-4 rounded-lg border transition-colors"
              style={{ borderColor: border, color: accent, backgroundColor: "transparent" }}
            >
              + Language
            </button>
            <button
              onClick={() => setCategoryMode("domain")}
              className="flex-1 py-2 px-4 rounded-lg border transition-colors"
              style={{ borderColor: border, color: accent, backgroundColor: "transparent" }}
            >
              + Domain
            </button>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || loading}
          className="w-full mt-6 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
          style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Circles height="20" width="20" color={inverseText} />
              Saving...
            </span>
          ) : (
            `Continue (${selected.length} selected)`
          )}
        </button>
      </div>
    );
  }

  // Category View - Select and reorder targets
  const categoryLabel = categoryMode === "languages" ? "Languages" : "Domains";
  const targets = AVAILABLE_TARGETS[categoryMode];

  return (
    <div className="max-w-lg w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => setCategoryMode(null)}
          className="text-sm flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity mb-4"
          style={{ color: textSecondary }}
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold" style={{ color: textPrimary }}>
          Select {categoryLabel}
        </h2>
        <p className="text-sm opacity-70 mt-2" style={{ color: textSecondary }}>
          Choose your priorities. You can reorder them by dragging.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Selected targets - Reorderable */}
      {selected.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: accent, backgroundColor: `${accent}05` }}>
          <p className="text-xs uppercase font-semibold mb-3 opacity-70" style={{ color: textSecondary }}>
            Your Priority Order:
          </p>
          <div className="space-y-2">
            {selected.map((target, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-3 p-3 rounded-lg border-2 bg-white cursor-move"
                style={{
                  borderColor: idx === draggingIndex ? accent : border,
                  opacity: idx === draggingIndex ? 0.5 : 1,
                }}
              >
                <DragHandle onMouseDown={() => handleDragStart(idx)} />
                <div className="flex-1">
                  <span className="font-semibold text-lg">{target.icon}</span>
                  <span className="ml-2 font-medium" style={{ color: textPrimary }}>
                    {target.name}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: accent, color: inverseText }}>
                  {idx + 1}
                </span>
                <button
                  onClick={() => removeTarget(idx)}
                  className="text-lg opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available targets */}
      <div className="mb-6">
        <p className="text-xs uppercase font-semibold mb-3 opacity-70" style={{ color: textSecondary }}>
          Add to list:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {targets.map((target) => {
            const isSelected = selected.some((t) => t.id === target.id);
            return (
              <button
                key={target.id}
                onClick={() =>
                  isSelected
                    ? removeTarget(selected.findIndex((t) => t.id === target.id))
                    : addTarget(categoryMode, target.id, target.name, target.icon)
                }
                className="p-3 rounded-lg border-2 transition-all text-left hover:opacity-90"
                style={{
                  borderColor: isSelected ? accent : border,
                  backgroundColor: isSelected ? surfaceSelected : surface,
                }}
              >
                <div className="text-2xl mb-1">{target.icon}</div>
                <div className="font-medium text-sm" style={{ color: textPrimary }}>
                  {target.name}
                </div>
                {isSelected && (
                  <div className="text-xs mt-1" style={{ color: accent }}>
                    ✓ Added
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setCategoryMode(null)}
          className="flex-1 py-3 rounded-full font-semibold transition-colors"
          style={{ backgroundColor: `${accent}10`, color: accent, border: `2px solid ${accent}` }}
        >
          Done
        </button>
        {selected.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
            style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}
