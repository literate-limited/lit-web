// src/components/GenerateAlphabetModal.jsx

import { useState } from "react";
import { IoMdCloseCircle } from "react‐icons/io";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Props:
 *   open         x    – whether the modal is visible
 *   onClose          – function to close the modal
 *   selectedLanguage – two‐letter code (e.g. "it", "fr", etc.)
 *   onDone           – callback when generation completes
 */
export default function GenerateAlphabetModal({
  open,
  onClose,
  selectedLanguage,
  onDone,
}) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);

    try {
      console.log("[Modal] generating alphabet for:", selectedLanguage);

      // We pass the language code as a query parameter to the backend
      const res = await fetch(
        `${API_URL}/admin/generate-alphabets?language=${selectedLanguage}`,
        { method: "POST" }
      );

      if (!res.ok) {
        throw new Error("Request failed: " + res.status);
      }

      const data = await res.json();
      console.log("[Modal] generation response:", data);

      onDone?.();
      onClose();
    } catch (err) {
      console.error("[Modal] generation failed", err);
      alert(err.message || "Generation failed. See console.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-3xl text-red-600"
        >
          <IoMdCloseCircle />
        </button>

        <h2 className="text-xl font-bold mb-4">
          Generate Alphabet for “{selectedLanguage.toUpperCase()}”
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          This will ask the server (via OpenAI) to generate a JSON file for the{" "}
          {selectedLanguage.toUpperCase()} alphabet. Once complete, it will be
          saved under <code>src/alphabets/{selectedLanguage}.json</code>.
        </p>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-2 rounded bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-gray-400"
        >
          {busy ? "Generating…" : "Confirm & Generate"}
        </button>
      </div>
    </div>
  );
}
