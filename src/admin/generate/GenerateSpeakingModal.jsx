import React, { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { generateLevels }   from "../scripts/generateLevels";   // <-- helper you created

export default function GenerateSpeakingModal({ open, onClose, onDone, language }) {
  const [count,    setCount]    = useState(20);
  const [maxWords, setMaxWords] = useState(8);
  const [busy,     setBusy]     = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const sentenceLength = maxWords <= 8 ? "short" : "long";
      console.log("[Modal] begin generation", { language, count, sentenceLength });

      await generateLevels({ language, count, sentenceLength });

      console.log("[Modal] generation complete");
      onDone?.();     // let parent refresh
      onClose();
    } catch (err) {
      console.error("[Modal] generation failed", err);
      alert(err.message || "Generation failed. Check console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-80 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-3xl text-red-600"
        >
          <IoMdCloseCircle />
        </button>

        <h2 className="text-xl font-bold mb-4">Generate Vocalizing Levels</h2>

        {/* Language locked to current page setting */}
        <p className="mb-4 text-sm">
          <strong>Language:</strong> {language.toUpperCase()}
        </p>

        <label className="block text-sm font-semibold">How many levels?</label>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(+e.target.value)}
          className="w-full border p-2 rounded mb-4 bg-gray-100"
        />

        <label className="block text-sm font-semibold">
          Max words per sentence
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={maxWords}
          onChange={(e) => setMaxWords(+e.target.value)}
          className="w-full border p-2 rounded mb-6 bg-gray-100"
        />

        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-2 rounded bg-teal-700 text-white hover:bg-teal-800 disabled:bg-gray-400"
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}
