// src/admin/modals/EditFlameModal.jsx
// Modal for selecting 7 images to use in the flickering flame animation

import { useState, useEffect, useContext } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { AdminContext } from "../../context/AdminContextProvider";
import { toast } from "react-toastify";

const FLAME_SLOTS = 7;
const STORAGE_KEY = "lit_flame_images";
const API_URL = import.meta.env.VITE_API_URL;

const EditFlameModal = ({ open, onClose }) => {
  const { images } = useContext(AdminContext);
  const [selectedImages, setSelectedImages] = useState(Array(FLAME_SLOTS).fill(null));
  const [activeSlot, setActiveSlot] = useState(null);

  // Load saved flame images on mount
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === FLAME_SLOTS) {
            setSelectedImages(parsed);
          }
        }
      } catch (err) {
        console.error("Error loading flame images:", err);
      }
    }
  }, [open]);

  const handleSlotClick = (index) => {
    setActiveSlot(index);
  };

  const handleImageSelect = (imageUrl) => {
    if (activeSlot === null) return;

    setSelectedImages((prev) => {
      const updated = [...prev];
      updated[activeSlot] = imageUrl;
      return updated;
    });
    setActiveSlot(null);
  };

  const handleClearSlot = (index) => {
    setSelectedImages((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedImages));
    } catch (err) {
      console.error("Error saving flame images:", err);
      toast.error("Failed to save flame images.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!API_URL || !token) {
      toast.success("Flame images saved locally.");
      onClose();
      return;
    }

    fetch(`${API_URL}/ui/flame`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ frames: selectedImages }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to save flame images.");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data?.frames)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.frames));
        }
        toast.success("Flame images saved!");
        onClose();
      })
      .catch((err) => {
        console.error("Error saving flame images:", err);
        toast.error("Failed to save flame images.");
      });
  };

  const handleClearAll = () => {
    setSelectedImages(Array(FLAME_SLOTS).fill(null));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Edit Flame Animation</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700"
          >
            <IoMdCloseCircle size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Flame Slots */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Flame Frames (7 images cycle to create animation)
            </h3>
            <div className="flex gap-2 flex-wrap">
              {selectedImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`relative w-20 h-20 border-2 rounded-lg cursor-pointer transition-all ${
                    activeSlot === idx
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : imgUrl
                      ? "border-green-500"
                      : "border-dashed border-gray-300"
                  }`}
                  onClick={() => handleSlotClick(idx)}
                >
                  {imgUrl ? (
                    <>
                      <img
                        src={imgUrl}
                        alt={`Frame ${idx + 1}`}
                        className="w-full h-full object-contain rounded"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSlot(idx);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        x
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center">
                      Frame {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {activeSlot !== null && (
              <p className="text-sm text-blue-600 mt-2">
                Select an image below for Frame {activeSlot + 1}
              </p>
            )}
          </div>

          {/* Image Gallery */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Available Images (click to select for active slot)
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
                    onClick={() => handleImageSelect(img.link)}
                    className={`w-16 h-16 border rounded cursor-pointer hover:border-blue-500 transition-all ${
                      activeSlot !== null
                        ? "hover:ring-2 hover:ring-blue-300"
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
              Save Flame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFlameModal;
