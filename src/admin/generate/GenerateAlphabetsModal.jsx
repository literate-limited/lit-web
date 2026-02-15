import { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
const API_URL = import.meta.env.VITE_API_URL;

export default function GenerateAlphabetsModal({ open, onClose, onDone }) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    try {
      console.log("[Modal] triggering alphabet generation…");
      const res = await fetch(`${API_URL}/admin/generate-alphabets`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Request failed: " + res.status);
      console.log("[Modal] alphabet generation complete");
      onDone?.();
      onClose();
    } catch (err) {
      console.error("[Modal] generation failed", err);
      alert(err.message || "Generation failed. Check console.");
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

        <h2 className="text-xl font-bold mb-4">Generate Alphabets</h2>
        <p className="mb-4 text-sm text-gray-700">
          This will generate and save alphabets for all supported languages.
        </p>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-2 rounded bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-gray-400"
        >
          {busy ? "Generating…" : "Generate Alphabets"}
        </button>
      </div>
    </div>
  );
}
