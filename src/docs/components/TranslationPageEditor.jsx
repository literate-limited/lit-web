import { Minus, Plus } from "lucide-react";

export default function TranslationPageEditor({
  fromLanguage,
  toLanguage,
  nativeValue,
  targetValue,
  onChangeNative,
  onChangeTarget,
  fontNative,
  fontTarget,
  onDecNative,
  onIncNative,
  onDecTarget,
  onIncTarget,
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* Native */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="font-semibold text-gray-800">{fromLanguage || "Native"}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{fontNative}px</span>
            <button className="p-1 rounded hover:bg-gray-50" onClick={onDecNative}>
              <Minus className="h-4 w-4" />
            </button>
            <button className="p-1 rounded hover:bg-gray-50" onClick={onIncNative}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <textarea
          style={{ fontSize: `${fontNative}px`, lineHeight: 1.6 }}
          className="w-full h-[68vh] resize-none p-4 outline-none bg-white placeholder:text-gray-400"
          placeholder="Start typing in your native language…"
          value={nativeValue}
          onChange={(e) => onChangeNative(e.target.value)}
        />
      </div>

      {/* Target */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="font-semibold text-gray-800">{toLanguage || "Target"}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{fontTarget}px</span>
            <button className="p-1 rounded hover:bg-gray-50" onClick={onDecTarget}>
              <Minus className="h-4 w-4" />
            </button>
            <button className="p-1 rounded hover:bg-gray-50" onClick={onIncTarget}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <textarea
          style={{ fontSize: `${fontTarget}px`, lineHeight: 1.6 }}
          className="w-full h-[68vh] resize-none p-4 outline-none bg-white placeholder:text-gray-400"
          placeholder="Your translation will appear here…"
          value={targetValue}
          onChange={(e) => onChangeTarget(e.target.value)}
        />
      </div>
    </div>
  );
}
