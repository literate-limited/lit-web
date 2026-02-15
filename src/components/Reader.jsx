import { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../utils/themes/ThemeContext";
import usePagination from "../hooks/usePagination";
import { useLessonGame } from "../hooks/useLesson";

const Reader = ({ text: externalText, onDone, doneLabel }) => {
  const { currentLevelType, readingText, updateUserLevel, levelIndex } =
    useLessonGame();
  const { currentTheme } = useContext(ThemeContext);

  const isExternal = typeof externalText === "string" && externalText.length > 0;
  const shouldRender = isExternal || currentLevelType === "reading";

  const text = useMemo(
    () =>
      isExternal
        ? externalText
        : Array.isArray(readingText)
        ? readingText.join("\n\n")
        : readingText || "",
    [externalText, isExternal, readingText]
  );

  const [pageIndex, setPageIndex] = useState(0);
  const { containerRef, contentRef, pageCount, pageWidth } = usePagination({ text });

  useEffect(() => {
    setPageIndex(0);
  }, [text]);

  const handleNext = async () => {
    if (pageIndex < pageCount - 1) {
      setPageIndex((i) => i + 1);
    } else if (isExternal) {
      onDone?.();
    } else {
      await updateUserLevel(levelIndex + 1);
    }
  };

  const handlePrev = () => {
    if (pageIndex > 0) setPageIndex((i) => i - 1);
  };

  const finalButtonLabel =
    pageIndex < pageCount - 1
      ? "Next →"
      : isExternal
      ? doneLabel || "Close Reader"
      : "Answer Questions →";

  if (!shouldRender) return null;

  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{ color: currentTheme.textColor }}
    >
      {/* Viewport — no padding here! */}
      <div
        ref={containerRef}
        className="max-w-3xl w-full h-[70vh] overflow-hidden rounded-lg shadow-md"
        style={{
          backgroundColor: currentTheme.questionBox,
          position: "relative",
        }}
      >
        {/* Content — padding goes here */}
        <div
          ref={contentRef}
          className="h-full max-w-none px-6 py-6"
          style={{
            whiteSpace: "pre-line",
            display: "block",
            transform: `translateX(-${pageIndex * pageWidth}px)`,
            transition: "transform 260ms ease",
            willChange: "transform",
          }}
        >
          {text}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={pageIndex === 0}
          className="px-3 py-2 rounded-md font-semibold disabled:opacity-50"
          style={{
            backgroundColor: currentTheme.unSelectedOptionButton,
            color: currentTheme.textColor,
          }}
        >
          ← Prev
        </button>

        <span className="text-sm opacity-80">
          Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
        </span>

        <button
          onClick={handleNext}
          className="px-3 py-2 rounded-md font-semibold"
          style={{
            backgroundColor: currentTheme.buttonColor,
            color: "#fff",
          }}
        >
          {finalButtonLabel}
        </button>
      </div>
    </div>
  );
};

export default Reader;
