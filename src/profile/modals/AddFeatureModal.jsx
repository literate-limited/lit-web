import { Dialog } from "@headlessui/react";

const AVAILABLE_MODULES = [
  {
    type: "stats",
    name: "Stats",
    description: "Display your Lit Points, streaks, lessons, levels, and badges.",
    icon: "📊",
  },
  {
    type: "booking",
    name: "Booking System",
    description: "Let people book lessons from your profile.",
    icon: "📅",
  },
  {
    type: "friends",
    name: "Connections",
    description: "Show your friends, followers, and who you follow.",
    icon: "👥",
  },
  {
    type: "wall",
    name: "Wall Posts",
    description: "Share updates and let others see your activity.",
    icon: "📝",
  },
  {
    type: "achievements",
    name: "Achievements",
    description: "Showcase your badges, streaks, and milestones.",
    icon: "🏆",
  },
  {
    type: "gallery",
    name: "Photo Gallery",
    description: "Upload and display your photos.",
    icon: "🖼️",
  },
];

export default function AddFeatureModal({
  isOpen,
  onClose,
  onAdd,
  disabledTypes = [],
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/40" />

      <div className="relative z-50 w-full max-w-4xl mx-4 bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <Dialog.Title className="text-center text-xl font-bold mb-6">
          Add feature to your profile
        </Dialog.Title>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_MODULES.map((mod) => {
            const isDisabled = disabledTypes.includes(mod.type);

            return (
              <button
                key={mod.type}
                type="button"
                disabled={isDisabled}
                onClick={() => onAdd(mod.type)}
                className={`
                  text-left border rounded-xl p-4 transition
                  ${isDisabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:shadow-md hover:border-cyan-400"}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{mod.icon}</span>
                  <span className="text-lg font-semibold">{mod.name}</span>
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  {mod.description}
                </div>
                <div
                  className={`
                    inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold
                    ${isDisabled ? "bg-slate-200 text-slate-600" : "bg-cyan-600 text-white"}
                  `}
                >
                  {isDisabled ? "Already added" : "Add"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
