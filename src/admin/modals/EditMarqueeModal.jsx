// src/admin/modals/EditMarqueeModal.jsx
// Modal for selecting orb (square logo) and banner (landscape) images for the marquee

import { useState, useEffect, useContext } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { AdminContext } from "../../context/AdminContextProvider";
import { toast } from "react-toastify";

const STORAGE_KEY = "lit_marquee_images";

const EditMarqueeModal = ({ open, onClose }) => {
  const { images } = useContext(AdminContext);
  const [orbImage, setOrbImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [activeSelection, setActiveSelection] = useState(null); // "orb" | "banner" | null

  // Load saved marquee images on mount
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setOrbImage(parsed.orb || null);
          setBannerImage(parsed.banner || null);
        }
      } catch (err) {
        console.error("Error loading marquee images:", err);
      }
    }
  }, [open]);

  const handleImageSelect = (imageUrl) => {
    if (activeSelection === "orb") {
      setOrbImage(imageUrl);
    } else if (activeSelection === "banner") {
      setBannerImage(imageUrl);
    }
    setActiveSelection(null);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orb: orbImage, banner: bannerImage })
      );
      toast.success("Marquee images saved!");
      onClose();
    } catch (err) {
      console.error("Error saving marquee images:", err);
      toast.error("Failed to save marquee images.");
    }
  };

  const handleClearAll = () => {
    setOrbImage(null);
    setBannerImage(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Edit Marquee</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700"
          >
            <IoMdCloseCircle size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Marquee Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Marquee Preview (alternates between Orb and Banner)
            </h3>
            <div className="flex gap-4 items-center">
              {/* Orb Slot */}
              <div
                onClick={() => setActiveSelection("orb")}
                className={`w-20 h-20 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                  activeSelection === "orb"
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : orbImage
                    ? "border-green-500"
                    : "border-dashed border-gray-300"
                }`}
              >
                {orbImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={orbImage}
                      alt="Orb"
                      className="w-full h-full object-contain rounded p-1"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrbImage(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 text-center px-1">
                    Orb Logo
                  </span>
                )}
              </div>

              <span className="text-gray-400 text-2xl">↔</span>

              {/* Banner Slot */}
              <div
                onClick={() => setActiveSelection("banner")}
                className={`w-48 h-16 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                  activeSelection === "banner"
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : bannerImage
                    ? "border-green-500"
                    : "border-dashed border-gray-300"
                }`}
              >
                {bannerImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={bannerImage}
                      alt="Banner"
                      className="w-full h-full object-contain rounded p-1"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBannerImage(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 text-center px-1">
                    Banner (Landscape)
                  </span>
                )}
              </div>
            </div>

            {activeSelection && (
              <p className="text-sm text-blue-600 mt-2">
                Select an image below for the{" "}
                {activeSelection === "orb" ? "Orb Logo" : "Banner"}
              </p>
            )}
          </div>

          {/* Image Gallery */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Available Images
            </h3>
            {images.length === 0 ? (
              <p className="text-sm text-gray-500">
                No images available. Upload images using the "Add +" button first.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {images.map((img) => (
                  <div
                    key={img._id}
                    onClick={() => activeSelection && handleImageSelect(img.link)}
                    className={`w-16 h-16 border rounded transition-all ${
                      activeSelection
                        ? "cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-300"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <img
                      src={img.link}
                      alt={img.title || "Image"}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Marquee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMarqueeModal;
