import { Minus, Plus } from "lucide-react";

export default function DocTitleRow({
  title,
  onChangeTitle,
  onBlurSave,
  fontSummary,
  onDecAll,
  onIncAll,
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <input
        type="text"
        className="flex-1 text-2xl font-semibold border-b border-gray-200 bg-transparent focus:outline-none focus:border-teal-500"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        onBlur={onBlurSave}
      />

      <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 shadow-sm px-2 py-1">
        <span className="text-sm text-gray-600">Font</span>
        <button className="p-1 rounded hover:bg-gray-50" onClick={onDecAll}>
          <Minus className="h-4 w-4" />
        </button>
        <div className="text-xs text-gray-500 tabular-nums">{fontSummary}px</div>
        <button className="p-1 rounded hover:bg-gray-50" onClick={onIncAll}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
