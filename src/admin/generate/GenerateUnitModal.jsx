// src/admin/generate/GenerateUnitModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_LESSONS = 5;

export default function GenerateUnitModal({ open, onClose, onUnitCreated }) {
  // Page 1 = AI input, Page 2 = Unit overview, Pages 3-7 = Individual lessons
  const [page, setPage] = useState(1);
  const [rawText, setRawText] = useState("");
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);

  // Model selection
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  // System instructions
  const [systemInstructions, setSystemInstructions] = useState(`
You are an expert curriculum designer and teacher.
Convert the raw input into a structured Unit containing multiple lessons.

Return ONLY valid JSON in this exact format:

{
  "title": "Unit title",
  "description": "Unit description",
  "lessons": [
    {
      "title": "Lesson 1 title",
      "description": "Lesson 1 description",
      "levels": [
        {
          "type": "fill-in-the-blank" | "vocalizing" | "mcq" | "listening" | "writing" | "speaking",
          "question": "Question text",
          "answer": "Correct answer",
          "options": ["Option A", "Option B", "Option C"]
        }
      ]
    }
  ]
}

Rules:
- Create between 2-5 lessons that logically progress through the topic
- Each lesson should have 3-8 levels (questions/exercises)
- Fix grammar and clarity if needed
- Infer correct answers
- Suggest appropriate level types
- Output ONLY JSON, no commentary
`);

  useEffect(() => {
    if (!open) return;
    fetchModels();
  }, [open]);

  if (!open) return null;

  async function fetchModels() {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.get(`${API_URL}/lessons/models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModels(resp.data.models || []);
    } catch (err) {
      console.error("Model fetch failed:", err);
    }
  }

  const resetState = () => {
    setPage(1);
    setRawText("");
    setProposal(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose && onClose();
  };

  // Total pages: 1 (input) + 1 (overview) + number of lessons
  const totalPages = proposal ? 2 + (proposal.lessons?.length || 0) : 2;

  const canGoNext = () => {
    if (page === 1) return !!proposal;
    return page < totalPages;
  };

  const canGoPrev = () => page > 1;

  // ========================
  // GENERATE UNIT PROPOSAL
  // ========================
  const handleGenerateProposal = async () => {
    if (!rawText.trim()) {
      toast.error("Please paste some text first.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const resp = await axios.post(
        `${API_URL}/units/generate-proposal`,
        {
          language: "en",
          rawText,
          model: selectedModel,
          systemInstructions,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      const data = resp.data?.proposal;
      if (!data || !Array.isArray(data.lessons)) {
        toast.error("Proposal came back in an unexpected format.");
        console.log("Raw proposal response:", resp.data);
        return;
      }

      // Cap lessons at MAX_LESSONS
      if (data.lessons.length > MAX_LESSONS) {
        data.lessons = data.lessons.slice(0, MAX_LESSONS);
      }

      setProposal(data);
      setPage(2); // Go to overview
    } catch (err) {
      console.error("Proposal generation failed:", err);
      toast.error("Proposal generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // UPDATE PROPOSAL FIELDS
  // ========================
  const updateUnitField = (field, value) => {
    setProposal((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateLessonField = (lessonIndex, field, value) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const lessonsCopy = [...prev.lessons];
      lessonsCopy[lessonIndex] = { ...lessonsCopy[lessonIndex], [field]: value };
      return { ...prev, lessons: lessonsCopy };
    });
  };

  const updateLevelField = (lessonIndex, levelIndex, field, value) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const lessonsCopy = [...prev.lessons];
      const levelsCopy = [...(lessonsCopy[lessonIndex].levels || [])];
      levelsCopy[levelIndex] = { ...levelsCopy[levelIndex], [field]: value };
      lessonsCopy[lessonIndex] = { ...lessonsCopy[lessonIndex], levels: levelsCopy };
      return { ...prev, lessons: lessonsCopy };
    });
  };

  const addLevelToLesson = (lessonIndex) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const lessonsCopy = [...prev.lessons];
      const levels = lessonsCopy[lessonIndex].levels || [];
      levels.push({ type: "fill-in-the-blank", question: "", answer: "", options: [] });
      lessonsCopy[lessonIndex] = { ...lessonsCopy[lessonIndex], levels };
      return { ...prev, lessons: lessonsCopy };
    });
  };

  const removeLevelFromLesson = (lessonIndex, levelIndex) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const lessonsCopy = [...prev.lessons];
      const levels = [...(lessonsCopy[lessonIndex].levels || [])];
      levels.splice(levelIndex, 1);
      lessonsCopy[lessonIndex] = { ...lessonsCopy[lessonIndex], levels };
      return { ...prev, lessons: lessonsCopy };
    });
  };

  // ========================
  // BUILD UNIT IN DB
  // ========================
  const handleBuildUnit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...proposal,
        language: proposal.language || "en",
      };

      await axios.post(`${API_URL}/units/build-from-proposal`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Unit created successfully!");
      onUnitCreated && onUnitCreated();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Unit build failed");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // RENDER PAGE CONTENT
  // ========================
  const renderPageContent = () => {
    // Page 1: AI Input
    if (page === 1) {
      return (
        <div className="space-y-4">
          {/* Model Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">AI Model</label>
            <select
              className="border p-2 rounded w-full text-sm"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.length === 0 && <option>Loading models...</option>}
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* System Instructions */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              System Instructions
            </label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={6}
              value={systemInstructions}
              onChange={(e) => setSystemInstructions(e.target.value)}
            />
          </div>

          {/* Raw Text Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Raw Content / Topic
            </label>
            <p className="text-gray-600 text-xs">
              Paste content or describe a topic. The AI will create a unit with up to 5 lessons.
            </p>
            <textarea
              className="w-full h-48 border rounded p-3 text-sm"
              placeholder="Paste your content here or describe the topic..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateProposal}
              disabled={loading}
              className={`px-6 py-3 rounded text-white font-semibold ${
                loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Generating..." : "Generate Unit Proposal"}
            </button>
          </div>
        </div>
      );
    }

    // Page 2: Unit Overview
    if (page === 2 && proposal) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Unit Title</label>
            <input
              className="w-full border rounded p-2"
              value={proposal.title || ""}
              onChange={(e) => updateUnitField("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Unit Description</label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={3}
              value={proposal.description || ""}
              onChange={(e) => updateUnitField("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Lessons ({proposal.lessons?.length || 0})
            </label>
            <div className="border rounded p-3 space-y-2 max-h-64 overflow-auto">
              {(proposal.lessons || []).map((lesson, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => setPage(3 + idx)}
                >
                  <div>
                    <span className="font-semibold">Lesson {idx + 1}:</span> {lesson.title || "Untitled"}
                    <span className="text-xs text-gray-500 ml-2">
                      ({lesson.levels?.length || 0} levels)
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Pages 3+: Individual Lesson Editing
    if (page >= 3 && proposal) {
      const lessonIndex = page - 3;
      const lesson = proposal.lessons?.[lessonIndex];

      if (!lesson) return <div>Lesson not found</div>;

      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <span className="text-blue-800 font-semibold">
              Lesson {lessonIndex + 1} of {proposal.lessons.length}
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Lesson Title</label>
            <input
              className="w-full border rounded p-2"
              value={lesson.title || ""}
              onChange={(e) => updateLessonField(lessonIndex, "title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Lesson Description</label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={2}
              value={lesson.description || ""}
              onChange={(e) => updateLessonField(lessonIndex, "description", e.target.value)}
            />
          </div>

          {/* Levels */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">
                Levels ({lesson.levels?.length || 0})
              </label>
              <button
                onClick={() => addLevelToLesson(lessonIndex)}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                + Add Level
              </button>
            </div>

            <div className="border rounded p-3 max-h-72 overflow-auto space-y-3">
              {(lesson.levels || []).map((lvl, lvlIdx) => (
                <div key={lvlIdx} className="border rounded p-3 bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Level {lvlIdx + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={lvl.type || "fill-in-the-blank"}
                        onChange={(e) =>
                          updateLevelField(lessonIndex, lvlIdx, "type", e.target.value)
                        }
                      >
                        <option value="mcq">MCQ</option>
                        <option value="fill-in-the-blank">Fill-in-the-blank</option>
                        <option value="vocalizing">Vocalizing</option>
                        <option value="writing">Writing</option>
                        <option value="speaking">Speaking</option>
                        <option value="listening">Listening</option>
                      </select>
                      <button
                        onClick={() => removeLevelFromLesson(lessonIndex, lvlIdx)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Question</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      value={lvl.question || ""}
                      onChange={(e) =>
                        updateLevelField(lessonIndex, lvlIdx, "question", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Correct Answer
                    </label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      value={lvl.answer || ""}
                      onChange={(e) =>
                        updateLevelField(lessonIndex, lvlIdx, "answer", e.target.value)
                      }
                    />
                  </div>

                  {lvl.type === "mcq" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Options (comma separated)
                      </label>
                      <input
                        className="w-full border rounded p-2 text-sm"
                        value={(lvl.options || []).join(", ")}
                        onChange={(e) =>
                          updateLevelField(
                            lessonIndex,
                            lvlIdx,
                            "options",
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Get page title
  const getPageTitle = () => {
    if (page === 1) return "Generate Unit - AI Input";
    if (page === 2) return "Unit Overview";
    if (page >= 3 && proposal) {
      const lessonIndex = page - 3;
      return `Edit Lesson ${lessonIndex + 1}`;
    }
    return "Generate Unit";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-6 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{getPageTitle()}</h2>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canGoPrev()}
              className={`px-3 py-1 rounded border ${
                !canGoPrev() ? "text-gray-300 border-gray-200" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              ◀ Prev
            </button>
            <span className="text-gray-600 min-w-[80px] text-center">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canGoNext()}
              className={`px-3 py-1 rounded border ${
                !canGoNext() ? "text-gray-300 border-gray-200" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{renderPageContent()}</div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Close
          </button>

          {page === totalPages && proposal && (
            <button
              onClick={handleBuildUnit}
              disabled={loading}
              className={`px-6 py-3 rounded text-white font-semibold ${
                loading ? "bg-green-400 cursor-wait" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Creating..." : "Create Unit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
