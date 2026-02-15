// src/admin/GenerateLessonModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

export default function GenerateLessonModal({ open, onClose, onLessonCreated }) {
  const [step, setStep] = useState(1); // 1 = raw text, 2 = proposal preview
  const [rawText, setRawText] = useState("");
  const [proposal, setProposal] = useState(null); // { title, description, levels: [...] }
  const [loading, setLoading] = useState(false);

  // === MODEL SELECTION ===
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  // === SYSTEM INSTRUCTIONS ===
  const [systemInstructions, setSystemInstructions] = useState(`
You are an expert English teacher and curriculum designer.
Convert the raw exercise text into a structured JSON proposal.

Return ONLY valid JSON in this exact format:

{
  "title": "",
  "description": "",
  "levels": [
    {
      "type": "fill-in-the-blank" | "vocalizing" | "mcq" | "listening" | "writing" | "speaking",
      "question": "",
      "answer": "",
      "options": [] 
    }
  ]
}

Rules:
- Fix grammar and clarity if needed.
- Reorder questions.
- Change names / nouns where appropriate.
- Infer correct answers.
- Suggest appropriate level types.
- Output ONLY JSON, no commentary.
`);

  useEffect(() => {
    if (!open) return;
    fetchModels();
  }, [open]);

  if (!open) return null;

  // ========================
  // FETCH MODELS WHEN OPENED
  // ========================


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
    setRawText("");
    setProposal(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose && onClose();
  };

  // ==========================
  // GENERATE LESSON PROPOSAL
  // ==========================
  const handleGenerateProposal = async () => {
    if (!rawText.trim()) {
      toast.error("Please paste some text first.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const resp = await axios.post(
        `${API_URL}/lessons/generate-proposal`,
        {
          language: "en",
          rawText,
          model: selectedModel,
          systemInstructions,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      const data = resp.data?.proposal;
      if (!data || !Array.isArray(data.levels)) {
        toast.error("Proposal came back in an unexpected format.");
        console.log("Raw proposal response:", resp.data);
        return;
      }

      setProposal(data);
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

  // ==========================
  // BUILD LESSON IN DB
  // ==========================
  const handleBuildLesson = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...proposal,
        language: proposal.language || "en",
      };

      const resp = await axios.post(
        `${API_URL}/lessons/build-from-proposal`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Lesson created!");
      onLessonCreated();
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
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Generate Lesson From Text</h2>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setStep(1)}
              disabled={atStep1}
              className={`px-2 py-1 rounded border ${
                atStep1 ? "text-gray-400 border-gray-300" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              ◀
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
              ▶
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
              Paste an exercise (e.g. <em>said / told</em> questions).  
              The AI will convert it into a structured lesson proposal.
            </p>

            <textarea
              className="w-full h-64 border rounded p-3 text-sm"
              placeholder="Paste your raw questions here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={handleGenerateProposal}
                disabled={loading}
                className={`px-6 py-3 rounded text-white font-semibold ${
                  loading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Generating…" : "Generate Proposal"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — PROPOSAL PREVIEW */}
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
                rows={3}
                value={proposal.description || ""}
                onChange={(e) =>
                  setProposal((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
              />
            </div>

            {/* LEVELS */}
            <div className="border rounded p-3 max-h-80 overflow-auto space-y-3">
              {proposal.levels.map((lvl, i) => (
                <div key={i} className="border rounded p-3 bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Item {i + 1}</span>
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={lvl.type || "mcq"}
                      onChange={(e) => updateLevelField(i, "type", e.target.value)}
                    >
                      <option value="mcq">MCQ</option>
                      <option value="fill-in-the-blank">Fill-in-the-blank</option>
                      <option value="vocalizing">Vocalizing</option>
                      <option value="writing">Writing</option>
                      <option value="speaking">Speaking</option>
                      <option value="listening">Listening</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Question
                    </label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      value={lvl.question || ""}
                      onChange={(e) => updateLevelField(i, "question", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Correct Answer
                    </label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      value={lvl.answer || ""}
                      onChange={(e) => updateLevelField(i, "answer", e.target.value)}
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
                            i,
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

            <div className="flex justify-end gap-3">
              <button
                onClick={handleBuildLesson}
                disabled={loading}
                className={`px-6 py-3 rounded text-white font-semibold ${
                  loading ? "bg-green-400 cursor-wait" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Working…" : "Create Lesson"}
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
