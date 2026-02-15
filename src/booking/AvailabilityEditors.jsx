import { useMemo } from "react";

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function normalizeWeekly(input) {
  const base = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  const weekly = input && typeof input === "object" ? input : {};
  return Object.keys(base).reduce((acc, key) => {
    const ranges = Array.isArray(weekly[key]) ? weekly[key] : [];
    acc[key] = ranges.map((r) => ({
      start: r.start || "09:00",
      end: r.end || "17:00",
    }));
    return acc;
  }, base);
}

export function WeeklyAvailabilityEditor({ value, onChange }) {
  const weekly = useMemo(() => normalizeWeekly(value), [value]);

  const updateDay = (dayKey, idx, field, nextValue) => {
    const next = { ...weekly };
    const ranges = Array.isArray(next[dayKey]) ? [...next[dayKey]] : [];
    const current = ranges[idx] || { start: "09:00", end: "17:00" };
    ranges[idx] = { ...current, [field]: nextValue };
    next[dayKey] = ranges;
    onChange?.(next);
  };

  const addRange = (dayKey) => {
    const next = { ...weekly };
    const ranges = Array.isArray(next[dayKey]) ? [...next[dayKey]] : [];
    ranges.push({ start: "09:00", end: "17:00" });
    next[dayKey] = ranges;
    onChange?.(next);
  };

  const removeRange = (dayKey, idx) => {
    const next = { ...weekly };
    const ranges = Array.isArray(next[dayKey]) ? [...next[dayKey]] : [];
    ranges.splice(idx, 1);
    next[dayKey] = ranges;
    onChange?.(next);
  };

  return (
    <div className="space-y-4">
      {Object.keys(DAY_LABELS).map((dayKey) => {
        const ranges = weekly[dayKey] || [];
        return (
          <div key={dayKey} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{DAY_LABELS[dayKey]}</div>
              <button
                type="button"
                onClick={() => addRange(dayKey)}
                className="text-xs font-semibold text-cyan-700 hover:underline"
              >
                Add range
              </button>
            </div>
            {ranges.length === 0 && (
              <div className="mt-2 text-xs text-slate-500">No availability</div>
            )}
            <div className="mt-2 space-y-2">
              {ranges.map((range, idx) => (
                <div key={`${dayKey}-${idx}`} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.start}
                    onChange={(e) => updateDay(dayKey, idx, "start", e.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-slate-400">to</span>
                  <input
                    type="time"
                    value={range.end}
                    onChange={(e) => updateDay(dayKey, idx, "end", e.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRange(dayKey, idx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DateAvailabilityEditor({ value, onChange, emptyLabel }) {
  const entries = Array.isArray(value) ? value : [];

  const updateEntry = (idx, patch) => {
    const next = entries.map((entry, entryIdx) =>
      entryIdx === idx ? { ...entry, ...patch } : entry
    );
    onChange?.(next);
  };

  const addEntry = () => {
    const next = entries.concat({
      date: "",
      ranges: [{ start: "09:00", end: "17:00" }],
    });
    onChange?.(next);
  };

  const removeEntry = (idx) => {
    const next = entries.filter((_, entryIdx) => entryIdx !== idx);
    onChange?.(next);
  };

  const addRange = (idx) => {
    const entry = entries[idx];
    const ranges = Array.isArray(entry?.ranges) ? [...entry.ranges] : [];
    ranges.push({ start: "09:00", end: "17:00" });
    updateEntry(idx, { ranges });
  };

  const updateRange = (entryIdx, rangeIdx, field, value) => {
    const entry = entries[entryIdx];
    const ranges = Array.isArray(entry?.ranges) ? [...entry.ranges] : [];
    const current = ranges[rangeIdx] || { start: "09:00", end: "17:00" };
    ranges[rangeIdx] = { ...current, [field]: value };
    updateEntry(entryIdx, { ranges });
  };

  const removeRange = (entryIdx, rangeIdx) => {
    const entry = entries[entryIdx];
    const ranges = Array.isArray(entry?.ranges) ? [...entry.ranges] : [];
    ranges.splice(rangeIdx, 1);
    updateEntry(entryIdx, { ranges });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addEntry}
          className="text-xs font-semibold text-cyan-700 hover:underline"
        >
          Add date
        </button>
      </div>

      {entries.length === 0 && (
        <div className="text-sm text-slate-500">{emptyLabel || "No entries yet."}</div>
      )}

      <div className="space-y-3">
        {entries.map((entry, idx) => (
          <div key={`entry-${idx}`} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <input
                type="date"
                value={entry.date || ""}
                onChange={(e) => updateEntry(idx, { date: e.target.value })}
                className="rounded-md border border-slate-200 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove date
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {(entry.ranges || []).map((range, rangeIdx) => (
                <div key={`range-${idx}-${rangeIdx}`} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.start}
                    onChange={(e) => updateRange(idx, rangeIdx, "start", e.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-slate-400">to</span>
                  <input
                    type="time"
                    value={range.end}
                    onChange={(e) => updateRange(idx, rangeIdx, "end", e.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRange(idx, rangeIdx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => addRange(idx)}
                className="text-xs font-semibold text-cyan-700 hover:underline"
              >
                Add range
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
