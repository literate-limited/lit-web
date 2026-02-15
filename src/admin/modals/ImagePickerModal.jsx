import { useContext, useEffect, useMemo, useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { AdminContext } from "../../context/AdminContextProvider";

export default function ImagePickerModal({
  open,
  onClose,
  onSelect,
  title = "Select Background",
  subtitle = "Choose one of your uploaded images",
  currentImageId = null,
  allowClear = true,
}) {
  const { images = [], fetchImages } = useContext(AdminContext);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      fetchImages?.();
      setQuery("");
    }
  }, [open, fetchImages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return images;
    return images.filter((img) =>
      [img.title, img.link].some((f) => (f || "").toLowerCase().includes(q))
    );
  }, [images, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="lit-surface-card w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-black/70">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-red-700 hover:text-red-900">
            <IoMdCloseCircle size={28} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or URL"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#ffc878]"
            />
            {allowClear && (
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="px-4 py-2 rounded-full bg-white text-red-700 border border-red-100 hover:border-red-300"
              >
                Clear background
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <div className="p-4 lit-panel">
              <p className="text-sm">
                No images yet. Upload a few on the Images tab, then pick one here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((img) => {
                const isActive = currentImageId && currentImageId === img._id;
                return (
                  <button
                    key={img._id}
                    type="button"
                    onClick={() => onSelect(img)}
                    className={`relative overflow-hidden rounded-xl border ${
                      isActive
                        ? "border-[#ffc878] ring-2 ring-[#ffc878]/60"
                        : "border-black/10 hover:border-[#ffc878]"
                    } shadow-sm bg-white/70`}
                  >
                    <img
                      src={img.link}
                      alt={img.title || "Background"}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 text-left">
                      <p className="text-sm font-semibold text-black/80 truncate">
                        {img.title || "Untitled"}
                      </p>
                      <p className="text-xs text-black/60 truncate">{img.link}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-black/10 bg-white/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white border border-black/10 hover:border-[#ffc878]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
