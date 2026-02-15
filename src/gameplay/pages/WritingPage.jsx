import { useEffect, useState } from "react";
import axios from "axios";
import DisplayText from "../components/DisplayText";
import { useLessonGame } from "../../hooks/useLesson";

const API_URL = import.meta.env.VITE_API_URL;

export default function WritingPage() {
  const { currentLevel, currentQuestion, handleCheckAnswer } =
    useLessonGame();
  const [responseText, setResponseText] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentLevel?.type === "writing") {
      setResponseText("");
      setScore(null);
      setFeedback("");
      setStatusMsg("");
    }
  }, [currentLevel]);

  const submitForGrading = async () => {
    if (!responseText.trim()) {
      setStatusMsg("Please write a response before submitting.");
      return;
    }
    if (!currentLevel?._id) {
      setStatusMsg("⚠️ Cannot find level ID.");
      return;
    }

    try {
      setLoading(true);
      setStatusMsg("⏳ Grading...");
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_URL}/levels/${currentLevel._id}/grade-writing`,
        { responseText: responseText.trim() },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setScore(typeof data.score === "number" ? data.score : null);
      setFeedback(data.feedback || "");
      setStatusMsg("✅ Graded. Review your score.");
    } catch (err) {
      console.error("gradeWriting error", err);
      setStatusMsg("⚠️ Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    handleCheckAnswer(responseText.trim() || currentQuestion || "");
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-screen-md mx-auto">
      <DisplayText />
      <p className="text-sm text-slate-600 text-center max-w-xl">
        Write a short paragraph on the topic above. You will receive a score out
        of 20.
      </p>
      {statusMsg && (
        <p className="text-sm text-slate-600 text-center">{statusMsg}</p>
      )}
      <textarea
        className="w-full min-h-[180px] border border-slate-200 rounded-lg p-3 text-sm"
        placeholder="Write your response here..."
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
      />
      <div className="flex gap-3 justify-end w-full">
        <button
          onClick={submitForGrading}
          className="bg-blue-600 px-4 py-2 rounded text-white"
          disabled={loading}
        >
          {loading ? "Grading..." : "Submit for grading"}
        </button>
      </div>

      {score !== null && (
        <div className="p-3 border rounded bg-white w-full space-y-2">
          <p className="text-sm font-semibold">Score: {score} / 20</p>
          {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              className="bg-emerald-600 px-4 py-2 rounded text-white"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
