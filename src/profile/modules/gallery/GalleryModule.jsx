import { useEffect, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function LightboxModal({ isOpen, onClose, photo, onPrev, onNext, hasPrev, hasNext }) {
  if (!photo) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/90" onClick={onClose} />

      <div className="relative z-50 max-w-5xl max-h-[90vh] flex items-center">
        {/* Previous button */}
        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl flex items-center justify-center backdrop-blur-sm transition"
          >
            ‹
          </button>
        )}

        {/* Image */}
        <img
          src={photo.url}
          alt={photo.caption || "Photo"}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Next button */}
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white text-2xl flex items-center justify-center backdrop-blur-sm transition"
          >
            ›
          </button>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-xl flex items-center justify-center backdrop-blur-sm transition"
        >
          ×
        </button>

        {/* Caption */}
        {photo.caption && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-lg text-white text-sm backdrop-blur-sm max-w-md text-center">
            {photo.caption}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default function GalleryModule({
  module,
  viewMode,
  profileUser,
  viewer,
  onProfileUpdate,
}) {
  const isSelf = viewMode === "self";
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!profileUser?._id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.get(
          `${API_URL}/users/${profileUser._id}/photos`
        );
        setPhotos(data.photos || []);
      } catch (err) {
        // Gallery might not exist yet, that's ok
        console.log("Gallery load:", err.response?.status === 404 ? "No photos yet" : err.message);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [profileUser?._id]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (e.target) e.target.value = "";

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      files.forEach((file) => formData.append("photos", file));

      const { data } = await axios.post(
        `${API_URL}/users/me/photos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.photos) {
        setPhotos((prev) => [...data.photos, ...prev]);
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm("Delete this photo?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/users/me/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete photo");
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goToPrev = () => {
    setLightboxIndex((i) => Math.max(0, i - 1));
  };

  const goToNext = () => {
    setLightboxIndex((i) => Math.min(photos.length - 1, i + 1));
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">Photo Gallery</div>
        <div className="text-sm text-slate-500">{photos.length} photos</div>
      </div>

      {/* Upload button (self only) */}
      {isSelf && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Photos"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-sm text-slate-500 py-8 text-center">
          {isSelf ? "No photos yet. Upload some to show off!" : "No photos in this gallery."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo._id || index}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <img
                src={photo.url || photo.thumbnailUrl}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover transition group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition text-2xl">
                  🔍
                </span>
              </div>

              {/* Delete button (self only) */}
              {isSelf && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo._id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photo={photos[lightboxIndex]}
        onPrev={goToPrev}
        onNext={goToNext}
        hasPrev={lightboxIndex > 0}
        hasNext={lightboxIndex < photos.length - 1}
      />
    </div>
  );
}
