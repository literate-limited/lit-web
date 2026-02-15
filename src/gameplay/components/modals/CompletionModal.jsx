import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineTrophy } from "react-icons/ai";
import "../../../utils/animations.utils.css";
import { ThemeContext } from "../../../utils/themes/ThemeContext";
import EditLessonModal from "../../../admin/EditLessonModal";
import { useLessonModals } from "../../../hooks/useLessonUI";
import { useLessonGame, useLessonResults } from "../../../hooks/useLesson";
import { useUser } from "../../../context/UserContext";

const CompletionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const { closeCompletionModal } = useLessonModals();
  const { currentLesson } = useLessonGame();
  const { lessonResults, litThisLesson, lessonBonusLit, lessonAccuracy } = useLessonResults();
  const { userLoggedIn, userRole, userRoles } = useUser();
  const [isEditLessonOpen, setEditLessonOpen] = useState(false);

  const isAdmin = userLoggedIn && ((userRoles || []).includes("admin") || userRole === "admin");

  const handleClose = () => {
    if (onClose) onClose();
    navigate("/");
  };

  const title = useMemo(() => {
    if (lessonAccuracy < 0.5) return "A decent effort";
    if (lessonAccuracy <= 0.8) return "Pretty good!";
    return "Amazing!";
  }, [lessonAccuracy]);

  const sortedResults = useMemo(() => {
    return [...(lessonResults || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [lessonResults]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        style={{
          backgroundColor: currentTheme?.containerColor || "#ffffff",
          color: currentTheme?.mainTextColor || "#111827",
          borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.1)",
        }}
        className={`rounded-2xl p-6 sm:p-8 shadow-xl w-11/12 max-w-2xl max-h-[85vh] overflow-hidden border transform transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <AiOutlineTrophy className="text-yellow-500 text-4xl icon-bounce" />
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>

        <div
          className="rounded-xl px-4 py-3"
          style={{
            backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
            color: currentTheme?.textColor || "#111827",
          }}
        >
          <p className="text-base font-semibold">
            You earned {litThisLesson} Lit🔥
          </p>
          {lessonBonusLit > 0 && lessonAccuracy <= 0.8 && (
            <p className="mt-1 text-sm opacity-80">
              Plus a bonus of {lessonBonusLit} for good consistency
            </p>
          )}
          {lessonBonusLit > 0 && lessonAccuracy > 0.8 && (
            <p className="mt-1 text-sm opacity-80">
              Plus a bonus of {lessonBonusLit} for excellent consistency
            </p>
          )}
        </div>

        <div className="mt-5">
          <h3 className="text-base font-semibold mb-2">Questions completed</h3>
          <div
            className="rounded-xl border overflow-hidden max-h-[40vh] overflow-y-auto"
            style={{
              backgroundColor: currentTheme?.innerContainerColor || "#f8fafc",
              borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.1)",
              color: currentTheme?.textColor || "#111827",
            }}
          >
            <table className="w-full text-sm">
              <thead
                style={{
                  backgroundColor: currentTheme?.containerColor || "rgba(0,0,0,0.04)",
                  color: currentTheme?.mainTextColor || "#111827",
                }}
              >
                <tr>
                  <th className="text-left px-4 py-2">Question</th>
                  <th className="text-left px-4 py-2">Result</th>
                  <th className="text-left px-4 py-2">Lit</th>
                  <th className="text-left px-4 py-2">Correct Answer</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((row, index) => (
                  <tr
                    key={`${row.levelId}-${index}`}
                    className="border-t"
                    style={{
                      borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.08)",
                    }}
                  >
                    <td className="px-4 py-2">{row.prompt}</td>
                    <td className="px-4 py-2">
                      {row.correct ? "✅ Correct" : "❌ Wrong"}
                    </td>
                    <td className="px-4 py-2">{row.litAwarded ?? 0}</td>
                    <td className="px-4 py-2">
                      {row.correctAnswer ? row.correctAnswer : "—"}
                    </td>
                  </tr>
                ))}
                {sortedResults.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-3"
                      style={{ color: currentTheme?.grayText || "#6b7280" }}
                      colSpan={4}
                    >
                      No questions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-6">
          {isAdmin && (
            <button
              onClick={() => setEditLessonOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold shadow-sm transition border"
              style={{
                backgroundColor: currentTheme?.containerColor || "#ffffff",
                color: currentTheme?.mainTextColor || "#111827",
                borderColor: currentTheme?.floatMenuBorder || "rgba(0,0,0,0.1)",
              }}
            >
              Edit
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold shadow-sm transition"
            style={{
              backgroundColor: currentTheme?.buttonColor || "#f59e0b",
              color: currentTheme?.buttonText || "#ffffff",
            }}
          >
            Close
          </button>
        </div>
      </div>
      {isAdmin && (
        <EditLessonModal
          open={isEditLessonOpen}
          onClose={() => setEditLessonOpen(false)}
          lesson={currentLesson}
          onLessonUpdated={() => setEditLessonOpen(false)}
        />
      )}
    </div>
  );
};

export default CompletionModal;
