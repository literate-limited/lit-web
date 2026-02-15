export default function AppSwitcherModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0B0E] p-5 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">App switcher</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <p className="mt-3 text-sm text-white/70">
          This modal is not implemented in this MVP build.
        </p>
      </div>
    </div>
  );
}

