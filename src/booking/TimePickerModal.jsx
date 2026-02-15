import { Dialog } from "@headlessui/react";
import { format, addHours } from "date-fns";

export default function TimePickerModal({ isOpen, onClose, slots, onPick }) {
  const groupByDay = (blocks) =>
    blocks.reduce((acc, b) => {
      const day = b.start.split("T")[0];
      (acc[day] = acc[day] || []).push(b);
      return acc;
    }, {});

  const hourlySegments = (startISO, endISO) => {
    const out = [];
    let t = new Date(startISO);
    while (t < new Date(endISO)) {
      out.push(new Date(t));
      t = addHours(t, 1);
    }
    return out;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative z-50 bg-white rounded-lg p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto">
        <Dialog.Title className="text-lg font-bold mb-4">Select a Time</Dialog.Title>
        {Object.entries(groupByDay(slots)).map(([day, blocks]) => (
          <div key={day} className="mb-6">
            <h3 className="font-semibold mb-2">
              {format(new Date(day), "eeee d MMM")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {blocks
                .flatMap((b) => hourlySegments(b.start, b.end))
                .map((seg) => (
                  <button
                    key={seg.toISOString()}
                    onClick={() => {
                      onPick(seg.toISOString());
                      onClose();
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {format(seg, "h:mmaaa")}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
