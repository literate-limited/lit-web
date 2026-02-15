import Modal from "./Modal";

export default function AddPageModal({ open, onClose, onAddPage, onAddTranslationPage }) {
  return (
    <Modal open={open} onClose={onClose} title="Add a page">
      <div className="space-y-3">
        <button
          onClick={onAddPage}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-gray-50"
        >
          <div className="font-semibold text-gray-800">Add new page</div>
          <div className="text-sm text-gray-500">A normal page with a single editor.</div>
        </button>

        <button
          onClick={onAddTranslationPage}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-gray-50"
        >
          <div className="font-semibold text-gray-800">Add new translation page</div>
          <div className="text-sm text-gray-500">A page with native + target editors.</div>
        </button>
      </div>
    </Modal>
  );
}
