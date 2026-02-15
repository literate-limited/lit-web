// src/admin/generate/GenerateReadingLessonModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

export default function GenerateReadingLessonModal({ open, onClose, onLessonCreated }) {
  const [step, setStep] = useState(1); // 1 = reading text input, 2 = proposal preview
  const [readingText, setReadingText] = useState("");
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);

  // === MODEL SELECTION ===
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  // === SYSTEM INSTRUCTIONS ===
  const [systemInstructions, setSystemInstructions] = useState(`
You are an expert reading comprehension teacher.
Given a reading text, generate comprehension questions to test understanding.

Return ONLY valid JSON in this exact format:

{
  "title": "Title based on the reading passage",
  "description": "Brief description of the reading lesson",
  "readingText": "The full reading text provided",
  "questions": [
    {
      "question": "Comprehension question about the text",
      "answer": "Option A",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}

CRITICAL RULES:
- Generate 3-5 comprehension questions.
- Questions should test understanding, not just word recall.
- Include questions about main idea, details, inferences, and vocabulary in context.
- Each question MUST have exactly 4 options.
- The "answer" field MUST be EXACTLY one of the strings in the "options" array - copy it exactly, character for character.
- Do NOT paraphrase or reword the answer - it must match an option exactly.
- Output ONLY JSON, no commentary.
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
      toast.error("Failed to load AI models.");
    }
  }

  const resetState = () => {
    setStep(1);
    setReadingText("");
    setProposal(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose && onClose();
  };

  // ==========================
  // GENERATE COMPREHENSION QUESTIONS
  // ==========================
  const handleGenerateProposal = async () => {
    if (!readingText.trim()) {
      toast.error("Please paste a reading text first.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const userPrompt = `Please generate comprehension questions for this text:\n\n${readingText}`;

      const resp = await axios.post(
        `${API_URL}/lessons/generate-proposal`,
        {
          language: "en",
          rawText: userPrompt,
          model: selectedModel,
          systemInstructions,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      const data = resp.data?.proposal;
      console.log("Raw proposal response:", resp.data);
      console.log("Parsed data:", data);

      if (!data) {
        toast.error("Proposal came back in an unexpected format.");
        return;
      }

      // Handle both formats: AI might return "questions" array or "levels" array
      let questions = [];

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        // Format 1: AI returned questions array as requested
        questions = data.questions;
      } else if (Array.isArray(data.levels) && data.levels.length > 0) {
        // Format 2: AI returned levels array (backend default format)
        // Filter out any "reading" type levels and treat the rest as questions
        questions = data.levels
          .filter((lvl) => lvl.type !== "reading")
          .map((lvl) => ({
            question: lvl.question || "",
            answer: lvl.answer || "",
            options: lvl.options || [],
          }));
      }

      console.log("Parsed questions:", questions);

      if (questions.length === 0) {
        toast.warning("No comprehension questions were generated. Check console for debug info.");
      }

      // Transform the response into our lesson structure
      const transformedProposal = {
        title: data.title || "Reading Comprehension",
        description: data.description || "Read the passage and answer questions",
        levels: [
          // First level is the reading text
          {
            type: "reading",
            texts: [data.readingText || readingText],
          },
          // Following levels are MCQ comprehension questions
          ...questions.map((q) => ({
            type: "mcq",
            question: q.question,
            answer: q.answer,
            options: q.options || [],
          })),
        ],
      };

      setProposal(transformedProposal);
      setStep(2);
    } catch (err) {
      console.error("Proposal generation failed:", err);
      toast.error("Proposal generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // UPDATE LEVEL FIELDS
  // ==========================
  const updateLevelField = (index, field, value) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const levelsCopy = [...prev.levels];
      levelsCopy[index] = { ...levelsCopy[index], [field]: value };
      return { ...prev, levels: levelsCopy };
    });
  };

  const updateReadingText = (value) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const levelsCopy = [...prev.levels];
      if (levelsCopy[0]?.type === "reading") {
        levelsCopy[0] = { ...levelsCopy[0], texts: [value] };
      }
      return { ...prev, levels: levelsCopy };
    });
  };

  const deleteLevel = (index) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const levelsCopy = [...prev.levels];
      levelsCopy.splice(index, 1);
      return { ...prev, levels: levelsCopy };
    });
  };

  // ==========================
  // BUILD LESSON IN DB
  // ==========================
  const handleBuildLesson = async () => {
    console.log("handleBuildLesson called", proposal);

    if (!proposal) {
      toast.error("No proposal to build");
      return;
    }

    // Validate MCQ answers match options before sending
    try {
      const mcqLevels = proposal.levels.filter((lvl) => lvl.type === "mcq");
      console.log("MCQ levels to validate:", mcqLevels);

      // Helper to normalize text for comparison (remove punctuation, extra spaces)
      const normalizeForComparison = (str) => {
        return (str || "")
          .trim()
          .toLowerCase()
          .replace(/[.,!?;:'"]+$/g, "") // Remove trailing punctuation
          .replace(/^['"]+/g, "")        // Remove leading quotes
          .trim();
      };

      for (let i = 0; i < mcqLevels.length; i++) {
        const lvl = mcqLevels[i];
        const answerNorm = normalizeForComparison(lvl.answer);

        // Handle options that might be strings or objects
        const optionsNorm = (lvl.options || []).map((o) => {
          const optStr = typeof o === "string" ? o : (o?.text || String(o));
          return normalizeForComparison(optStr);
        });

        console.log(`Question ${i + 1}: answer="${answerNorm}", options=`, optionsNorm);

        if (optionsNorm.length === 0) {
          toast.error(`Question ${i + 1}: No options provided. Please add options.`);
          return;
        }

        if (!optionsNorm.includes(answerNorm)) {
          console.error(`Question ${i + 1} FAILED: answer not in options`);
          toast.error(
            `Question ${i + 1}: The answer "${lvl.answer}" must match one of the options.`
          );
          return;
        }
      }
    } catch (validationErr) {
      console.error("Validation error:", validationErr);
      toast.error("Validation failed: " + validationErr.message);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...proposal,
        language: proposal.language || "en",
      };

      await axios.post(
        `${API_URL}/lessons/build-from-proposal`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Reading lesson created!");
      onLessonCreated && onLessonCreated();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Lesson build failed");
    } finally {
      setLoading(false);
    }
  };

  const canGoToStep2 = !!proposal;
  const atStep1 = step === 1;
  const atStep2 = step === 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-6 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl space-y-4 max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Generate Reading Lesson</h2>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setStep(1)}
              disabled={atStep1}
              className={`px-2 py-1 rounded border ${
                atStep1 ? "text-gray-400 border-gray-300" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              &lt;
            </button>
            <span className="text-gray-600">Step {step} / 2</span>
            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2}
              className={`px-2 py-1 rounded border ${
                !canGoToStep2
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              &gt;
            </button>
          </div>
        </div>

        {/* STEP 1 SETTINGS */}
        {atStep1 && (
          <>
            {/* MODEL SELECTOR */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                AI Model
              </label>
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

            {/* SYSTEM INSTRUCTIONS */}
            <div className="space-y-2 mt-4">
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
          </>
        )}

        {/* STEP 1 MAIN */}
        {atStep1 && (
          <div className="space-y-4 mt-4">
            <p className="text-gray-700 text-sm">
              Paste a reading passage below. The AI will generate comprehension
              questions to test understanding of the text.
            </p>

            <textarea
              className="w-full h-64 border rounded p-3 text-sm"
              placeholder="Paste your reading text here..."
              value={readingText}
              onChange={(e) => setReadingText(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={handleGenerateProposal}
                disabled={loading}
                className={`px-6 py-3 rounded text-white font-semibold ${
                  loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Generating..." : "Generate Questions"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 - PROPOSAL PREVIEW */}
        {atStep2 && proposal && (
          <div className="space-y-4">

            {/* TITLE + DESCRIPTION */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Lesson Title</label>
              <input
                className="w-full border rounded p-2"
                value={proposal.title || ""}
                onChange={(e) =>
                  setProposal((prev) =>
                    prev ? { ...prev, title: e.target.value } : prev
                  )
                }
              />

              <label className="block text-sm font-semibold text-gray-700 mt-2">
                Description
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={2}
                value={proposal.description || ""}
                onChange={(e) =>
                  setProposal((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
              />
            </div>

            {/* READING TEXT */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Reading Text
              </label>
              <textarea
                className="w-full border rounded p-3 text-sm"
                rows={6}
                value={proposal.levels[0]?.texts?.[0] || ""}
                onChange={(e) => updateReadingText(e.target.value)}
              />
            </div>

            {/* COMPREHENSION QUESTIONS */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Comprehension Questions ({proposal.levels.length - 1} generated)
              </label>
              <div className="border rounded p-3 max-h-60 overflow-auto space-y-3">
                {proposal.levels.length <= 1 && (
                  <p className="text-gray-500 italic text-sm">
                    No questions were generated. Try regenerating or check the console for debug info.
                  </p>
                )}
                {proposal.levels.slice(1).map((lvl, i) => (
                  <div key={i} className="border rounded p-3 bg-gray-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Question {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={lvl.type || "mcq"}
                          onChange={(e) => updateLevelField(i + 1, "type", e.target.value)}
                        >
                          <option value="mcq">MCQ</option>
                          <option value="fill-in-the-blank">Fill-in-the-blank</option>
                          <option value="vocalizing">Vocalizing</option>
                          <option value="writing">Writing</option>
                          <option value="speaking">Speaking</option>
                          <option value="listening">Listening</option>
                        </select>
                        <button
                          onClick={() => deleteLevel(i + 1)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Question
                      </label>
                      <input
                        className="w-full border rounded p-2 text-sm"
                        value={lvl.question || ""}
                        onChange={(e) => updateLevelField(i + 1, "question", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700">
                        Correct Answer
                      </label>
                      <input
                        className="w-full border rounded p-2 text-sm"
                        value={lvl.answer || ""}
                        onChange={(e) => updateLevelField(i + 1, "answer", e.target.value)}
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
                              i + 1,
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

            <div className="flex justify-end gap-3">
              <button
                onClick={handleBuildLesson}
                disabled={loading}
                className={`px-6 py-3 rounded text-white font-semibold ${
                  loading ? "bg-green-400 cursor-wait" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Working..." : "Create Reading Lesson"}
              </button>
            </div>
          </div>
        )}

        {/* CLOSE BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
