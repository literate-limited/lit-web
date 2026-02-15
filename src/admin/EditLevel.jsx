import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { IoMdArrowBack } from "react-icons/io";
import { AdminContext } from "../context/AdminContextProvider";
import AdminMCQEditModal  from "./AdminMCQEditModal";

const API_URL = import.meta.env.VITE_API_URL;

const EditLevel = ({
  isOpen,
  onClose,
  editData,
  setEditData,
  onLevelUpdated,
}) => {
  if (!isOpen) return null;

  const adminContext = useContext(AdminContext);
  const audios = adminContext?.audios || [];
  const videos = adminContext?.videos || [];
  const mcqs = adminContext?.mcqs || [];
  const images = adminContext?.images || [];

  // Compute headers locally from token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [difficulty, setDifficulty] = useState(editData.difficulty || 1);
  const [levelNumber, setLevelNumber] = useState(editData.level || 0);
  const [matrixText, setMatrixText] = useState("");

  // MCQ modal
  const [editingMcq, setEditingMcq] = useState(null);

  // Sync difficulty + levelNumber
  useEffect(() => {
    setDifficulty(editData.difficulty || 1);
    setLevelNumber(editData.level || 0);
  }, [editData]);

  // Sync matrix if needed
  useEffect(() => {
    if (editData.type === "gaussianElimination") {
      setMatrixText(JSON.stringify(editData.matrix || [], null, 2));
    } else {
      setMatrixText("");
    }
  }, [editData]);

  // helpers
  const safeSounds = Array.isArray(editData.sounds) ? editData.sounds : [];
  const safeMcqs = Array.isArray(editData.mcqs) ? editData.mcqs : [];
  const safeTexts = Array.isArray(editData.texts) ? editData.texts : [];

  const toggleAudio = (audio) => {
    const exists = safeSounds.some((s) => s._id === audio._id);
    const updated = exists
      ? safeSounds.filter((s) => s._id !== audio._id)
      : [...safeSounds, audio];

    setEditData((prev) => ({ ...prev, sounds: updated }));
  };

  const selectedMcqId = safeMcqs?.[0]?._id || safeMcqs?.[0] || "";

  const pickedMcq = mcqs.find((m) => m._id === selectedMcqId) || null;

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    const base = `${API_URL}/levels`;

    // update difficulty first
    await axios.patch(
      `${base}/${editData._id}/difficulty`,
      { difficulty },
      { headers }
    );

    try {
      await axios.put(
        `${base}/${editData._id}/number`,
        { level: levelNumber },
        { headers }
      );

      switch (editData.type) {
        case "reading":
        case "speaking":
        case "writing":
        case "vocalizing":
        case "info":
          await axios.put(
            `${base}/update-text/${editData._id}`,
            { texts: safeTexts },
            { headers }
          );
          break;

        case "fill-in-the-blank":
          await axios.put(
            `${base}/update-text/${editData._id}`,
            {
              texts: safeTexts,
              correctAnswer: editData.correctAnswer,
            },
            { headers }
          );
          break;

        case "video":
          await axios.put(
            `${base}/update-video/${editData._id}`,
            {
              video: editData.video?._id,
              sounds: safeSounds.map((s) => s._id),
            },
            { headers }
          );
          break;

        case "sound":
          await axios.put(
            `${base}/update-sound/${editData._id}`,
            {
              sounds: safeSounds.map((s) => s._id),
              imageId: editData.image?._id || null,
            },
            { headers }
          );
          break;

        case "listening":
          await axios.put(
            `${base}/image-update/${editData._id}`,
            {
              imageId: editData.image?._id,
              sounds: safeSounds.map((s) => s._id),
            },
            { headers }
          );
          break;

        case "gaussianElimination":
          try {
            const parsed = JSON.parse(matrixText);
            await axios.put(
              `${API_URL}/gaussian/by-level/${editData._id}`,
              { matrix: parsed },
              { headers }
            );
          } catch {
            setMessage("Invalid matrix JSON.");
            setLoading(false);
            return;
          }
          break;

        case "mcq":
          await axios.put(
            `${base}/update-mcq/${editData._id}`,
            {
              mcqs: safeMcqs.map((m) =>
                typeof m === "object" ? m._id : m
              ),
            },
            { headers }
          );
          break;
      }

      setMessage("Saved.");
      setTimeout(() => setMessage(""), 1800);
      onLevelUpdated?.();
    } catch (err) {
      console.log(err);
      setMessage("Save failed.");
    }

    setLoading(false);
  };

  // UI now fills the entire EditLesson modal
  return (
    <div className="w-full">

      {/* ---- HEADER ---- */}
      <div className="flex items-center mb-4">
        <button
          className="flex items-center text-lg mr-4 hover:text-gray-800"
          onClick={onClose}
        >
          <IoMdArrowBack className="text-2xl mr-1" /> Back
        </button>

        <h2 className="text-xl font-bold">
          Editing Level {editData.level} ({editData.type})
        </h2>
      </div>

      {/* ---- BASIC SETTINGS ---- */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="font-semibold text-sm">Level Number</label>
          <input
            type="number"
            className="w-full mt-1 p-2 rounded border bg-[#e0f2f1]"
            value={levelNumber}
            onChange={(e) => setLevelNumber(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="font-semibold text-sm">Difficulty (1–10)</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full mt-1 p-2 rounded border bg-[#e0f2f1]"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          />
        </div>
      </div>

      {/* ---- TYPE-SPECIFIC UI ---- */}

      {editData.type === "reading" && (
        <textarea
          className="w-full p-3 rounded bg-[#e0f2f1]"
          rows={8}
          value={editData.texts?.[0] || ""}
          onChange={(e) =>
            setEditData((p) => ({ ...p, texts: [e.target.value] }))
          }
        />
      )}

      {editData.type === "vocalizing" && (
        <textarea
          className="w-full p-3 rounded bg-[#e0f2f1]"
          rows={4}
          value={editData.texts?.[0] || ""}
          onChange={(e) =>
            setEditData((p) => ({ ...p, texts: [e.target.value] }))
          }
        />
      )}

      {editData.type === "speaking" && (
        <textarea
          className="w-full p-3 rounded bg-[#e0f2f1]"
          rows={4}
          value={editData.texts?.[0] || ""}
          onChange={(e) =>
            setEditData((p) => ({ ...p, texts: [e.target.value] }))
          }
        />
      )}

      {editData.type === "info" && (
        <textarea
          className="w-full p-3 rounded bg-[#e0f2f1]"
          value={editData.texts?.[0] || ""}
          onChange={(e) =>
            setEditData((p) => ({ ...p, texts: [e.target.value] }))
          }
        />
      )}

      {editData.type === "writing" && (
        <textarea
          className="w-full p-3 rounded bg-[#e0f2f1]"
          rows={4}
          value={editData.texts?.[0] || ""}
          onChange={(e) =>
            setEditData((p) => ({ ...p, texts: [e.target.value] }))
          }
        />
      )}

      {editData.type === "fill-in-the-blank" && (
        <>
          <textarea
            className="w-full p-3 rounded bg-[#e0f2f1] mb-4"
            rows={4}
            value={editData.texts?.[0] || ""}
            onChange={(e) =>
              setEditData((p) => ({ ...p, texts: [e.target.value] }))
            }
          />
          <input
            type="text"
            className="w-full p-2 rounded bg-[#e0f2f1]"
            placeholder="Correct answer…"
            value={editData.correctAnswer || ""}
            onChange={(e) =>
              setEditData((p) => ({ ...p, correctAnswer: e.target.value }))
            }
          />
        </>
      )}

      {editData.type === "gaussianElimination" && (
        <textarea
          className="w-full p-3 rounded bg-[#e0f2f1] font-mono"
          rows={6}
          value={matrixText}
          onChange={(e) => setMatrixText(e.target.value)}
        />
      )}

      {editData.type === "video" && (
        <select
          className="w-full p-2 rounded bg-[#e0f2f1]"
          value={editData.video?._id || ""}
          onChange={(e) => {
            const v = videos.find((x) => x._id === e.target.value);
            setEditData((p) => ({ ...p, video: v }));
          }}
        >
          <option value="">Select video</option>
          {videos.map((v) => (
            <option key={v._id} value={v._id}>
              {v.title}
            </option>
          ))}
        </select>
      )}

      {/* ---- MCQ BLOCK ---- */}
      {editData.type === "mcq" && (
        <div className="mb-6 mt-4 space-y-4">
          <label className="font-semibold text-sm">Select MCQ</label>
          <select
            className="w-full p-2 rounded bg-[#e0f2f1]"
            value={selectedMcqId}
            onChange={(e) =>
              setEditData((p) => ({ ...p, mcqs: [e.target.value] }))
            }
          >
            <option value="">-- Choose MCQ --</option>
            {mcqs.map((m) => (
              <option key={m._id} value={m._id}>
                {m.question}
              </option>
            ))}
          </select>

          {/* Show preview */}
          {pickedMcq && (
            <div className="p-3 bg-white rounded border">
              <p className="font-semibold text-gray-900 mb-2">
                {pickedMcq.question}
              </p>

              <ul className="space-y-1">
                {pickedMcq.options?.map((opt, idx) => {
                  const label = opt.text || opt;
                  const correct = idx === pickedMcq.correctAnswer;
                  return (
                    <li
                      key={idx}
                      className={`text-sm ${
                        correct ? "font-semibold text-green-700" : ""
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {label}
                    </li>
                  );
                })}
              </ul>

              {pickedMcq.explanation && (
                <p className="text-xs mt-2 text-gray-700">
                  Explanation: {pickedMcq.explanation}
                </p>
              )}

              {/* EDIT MCQ BUTTON */}
              <button
                className="mt-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setEditingMcq(pickedMcq)}
              >
                Edit MCQ
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- SOUND AUDIO ---- */}
      {(editData.type === "sound" ||
        editData.type === "listening" ||
        editData.type === "video") && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2">Select Audios</h3>
          <div className="bg-[#e0f2f1] rounded border max-h-48 overflow-y-auto p-2 space-y-1">
            {audios.map((a) => (
              <label key={a._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={safeSounds.some((s) => s._id === a._id)}
                  onChange={() => toggleAudio(a)}
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ---- SAVE ---- */}
      {message && (
        <p className="text-center text-green-700 font-medium mb-3">
          {message}
        </p>
      )}

      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Back
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-[#155e75] text-white rounded hover:bg-[#0f4a5a]"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>

      {/* NESTED MCQ EDITOR */}
      <AdminMCQEditModal
        open={!!editingMcq}
        mcq={editingMcq}
        onClose={() => setEditingMcq(null)}
        onSaved={() => {
          // Re-fetch MCQs (AdminContext already handles this if needed)
          setEditingMcq(null);
        }}
      />
    </div>
  );
};

export default EditLevel;
