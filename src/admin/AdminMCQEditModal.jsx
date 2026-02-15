// src/admin/AdminMCQEditModal.jsx
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { IoMdCloseCircle } from "react-icons/io";
import { AdminContext } from "../context/AdminContextProvider";

const API_URL = import.meta.env.VITE_API_URL;

const AdminMCQEditModal = ({ open, onClose, mcq, onSaved }) => {
  const { mcqs, setMcqs } = useContext(AdminContext);

  // Compute headers locally from token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const isEditing = !!mcq;

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ text: "" }]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load MCQ into local state when editing
  useEffect(() => {
    if (mcq) {
      setQuestion(mcq.question || "");
      setOptions(mcq.options?.length ? mcq.options : [{ text: "" }]);
      setCorrectAnswer(mcq.correctAnswer ?? 0);
      setExplanation(mcq.explanation || "");
    } else {
      // Create new MCQ
      setQuestion("");
      setOptions([{ text: "" }, { text: "" }]);
      setCorrectAnswer(0);
      setExplanation("");
    }
  }, [mcq]);

  if (!open) return null;

  const addOption = () => {
    setOptions((prev) => [...prev, { text: "" }]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return; // Minimum 2 options
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);

    // Fix correctAnswer index if needed
    if (correctAnswer >= updated.length) {
      setCorrectAnswer(0);
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index].text = value;
    setOptions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const payload = {
      question,
      options,
      correctAnswer,
      explanation,
    };

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/mcqs/${mcq._id}`, payload, headers);
      } else {
        await axios.post(`${API_URL}/mcqs`, payload, headers);
      }

      setMessage("Saved successfully");
      onSaved?.(); // Parent will refresh MCQs
      setTimeout(() => setMessage(""), 1500);
      onClose();
    } catch (err) {
      console.error("Error saving MCQ:", err);
      setMessage("Error saving MCQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    const confirmed = window.confirm(
      "Are you sure? This MCQ may be used by levels."
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/mcqs/${mcq._id}`, headers);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Error deleting MCQ:", err);
      setMessage("Could not delete MCQ.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg w-[90%] max-w-3xl max-h-[90vh] p-6 overflow-y-auto relative shadow-xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-3xl text-gray-800 hover:text-red-600"
        >
          <IoMdCloseCircle />
        </button>

        <h2 className="text-2xl font-semibold mb-4">
          {isEditing ? "Edit MCQ" : "Create New MCQ"}
        </h2>

        {/* Question */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-2 border rounded bg-gray-100"
            rows={3}
          />
        </div>

        {/* Options */}
        <h3 className="font-semibold mb-1">Options</h3>
        <div className="space-y-3 mb-4">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <input
                type="radio"
                name="correct"
                checked={correctAnswer === idx}
                onChange={() => setCorrectAnswer(idx)}
                className="mt-2"
              />

              <textarea
                value={opt.text}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                rows={2}
                className="flex-1 p-2 border rounded bg-gray-100"
              />

              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="text-red-600 font-bold text-xl"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addOption}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + Add Option
        </button>

        {/* Explanation */}
        <div className="mt-6 mb-6">
          <label className="block font-semibold mb-1">Explanation (optional)</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full p-2 border rounded bg-gray-100"
            rows={2}
          />
        </div>

        {/* Message */}
        {message && (
          <p className="text-center text-green-700 text-sm mb-3">{message}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          {isEditing && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMCQEditModal;
