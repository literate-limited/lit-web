// src/gameplay/components/LevelContainer.jsx
// Unified container for all level types except reading
// Shows lesson title, progress indicator, and progress bar

import { useContext, useMemo } from "react";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import { useLessonGame } from "../../hooks/useLesson";

const LevelContainer = ({ children }) => {
  const {
    currentLesson,
    levelIndex,
    levels,
    currentLevel,
    levelSecondsLeft,
    levelFeedback,
  } = useLessonGame();
  const { currentTheme } = useContext(ThemeContext);

  const nonReadingLevels = useMemo(
    () => (Array.isArray(levels) ? levels.filter((lvl) => lvl?.type !== "reading") : []),
    [levels]
  );

  const totalLevels = nonReadingLevels.length;
  const currentLevelId = currentLevel?._id;
  const rawIndex = nonReadingLevels.findIndex(
    (lvl) => String(lvl?._id) === String(currentLevelId)
  );
  const currentIndex = rawIndex >= 0 ? rawIndex : Math.max(0, Math.min(levelIndex, totalLevels - 1));
  const currentLevelNum = totalLevels > 0 ? currentIndex + 1 : 0;
  const progressPercent = totalLevels > 0 ? (currentLevelNum / totalLevels) * 100 : 0;


  return (
    <div className="flex flex-col h-full">
      {/* Header with lesson info and progress */}
      <div
        className="px-4 py-3 border-b"
        style={{
          backgroundColor: currentTheme?.containerColor || "#fff",
          borderColor: currentTheme?.floatMenuBorder || "#e5e7eb",
        }}
      >
        {/* Lesson Title */}
        <h1
          className="text-lg font-bold mb-2 truncate"
          style={{ color: currentTheme?.mainTextColor || "#111" }}
        >
          {currentLesson?.title || "Lesson"}
        </h1>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: currentTheme?.floatMenuBorder || "#e5e7eb" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: currentTheme?.buttonColor || "#10b981",
              }}
            />
          </div>

          {/* Progress Text */}
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: currentTheme?.grayText || "#6b7280" }}
          >
            {currentLevelNum} / {totalLevels}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Timer:</span>
            <span>{typeof levelSecondsLeft === "number" ? levelSecondsLeft : "—"}</span>
          </div>
          {levelFeedback && (
            <div className="flex items-center gap-2 font-semibold">
              <span>{levelFeedback.text}</span>
              {levelFeedback.type === "correct" && (
                <span className="text-emerald-600">
                  +{levelFeedback.litAwarded} Lit🔥!
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Level Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default LevelContainer;
