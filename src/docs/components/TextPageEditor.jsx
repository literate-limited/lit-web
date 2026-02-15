import { Minus, Plus } from "lucide-react";

export default function TextPageEditor({ title, value, onChange, fontSize, onDec, onInc }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="font-semibold text-gray-800">{title || "Page"}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{fontSize}px</span>
          <button className="p-1 rounded hover:bg-gray-50" onClick={onDec}>
            <Minus className="h-4 w-4" />
          </button>
          <button className="p-1 rounded hover:bg-gray-50" onClick={onInc}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <textarea
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
        className="w-full h-[68vh] resize-none p-4 outline-none bg-white placeholder:text-gray-400"
        placeholder="Start typing…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
