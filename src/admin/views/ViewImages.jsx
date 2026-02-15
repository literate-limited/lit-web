import { useState, useContext } from 'react';
import axios from 'axios';
import UploadImageLink from '../../components/UploadImages';
import { IoMdCloseCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { AdminContext } from '../../context/AdminContextProvider';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditFlameModal from '../modals/EditFlameModal';
import EditMarqueeModal from '../modals/EditMarqueeModal';

const API_URL = import.meta.env.VITE_API_URL;

const ViewImages = () => {
  const { images, setImages } = useContext(AdminContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isFlameModalOpen, setIsFlameModalOpen] = useState(false);
  const [isMarqueeModalOpen, setIsMarqueeModalOpen] = useState(false);

  // Confirm delete modal handlers
  const openConfirmModal = (image) => {
    setSelectedImage(image);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setSelectedImage(null);
    setIsConfirmModalOpen(false);
  };

  // Handle delete image
  const handleDeleteImage = async () => {
    if (!selectedImage) return;

    try {
      console.log(`Deleting image with ID: ${selectedImage._id}`);
      await axios.delete(`${API_URL}/delete-image/${selectedImage._id}`);
      setImages((prev) => prev.filter((image) => image._id !== selectedImage._id));
      toast.success("Image deleted successfully.");
      closeConfirmModal();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image.");
    }
  };

  return (
    <div className="container mx-auto mt-16 p-4">
      <div className="flex items-center flex-wrap gap-3 mb-4">
        <h1 className="text-4xl font-bold">Images</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-[#155e75] text-white px-5 rounded-full hover:bg-[#135367]"
        >
          Add +
        </button>
        <button
          onClick={() => setIsFlameModalOpen(true)}
          className="p-2 bg-orange-500 text-white px-5 rounded-full hover:bg-orange-600"
        >
          Edit Flame
        </button>
        <button
          onClick={() => setIsMarqueeModalOpen(true)}
          className="p-2 bg-purple-500 text-white px-5 rounded-full hover:bg-purple-600"
        >
          Edit Marquee
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map(image => (
          <div key={image._id} className="relative bg-[#bdd8dd] rounded-lg shadow-md p-4">
            {/* Delete button */}
            <button
              onClick={() => openConfirmModal(image)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <MdDelete size={24} />
            </button>

            {/* Image details */}
            <h2 className="text-xl font-semibold mb-2">{image.title}</h2>
            <img src={image.link} alt={image.title} className="flex justify-center w-full items-center h-52 mt-2" />
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#bdd8dd] rounded-lg shadow-lg max-w-sm w-full p-6 relative">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete this image:{" "}
              <span className="font-semibold">{selectedImage?.title}</span>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-white rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#a1c1ca] rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute px-3 text-red-800 top-4 right-2 text-4xl font-bold"
            >
              <IoMdCloseCircle />
            </button>
            <UploadImageLink />
          </div>
        </div>
      )}

      {/* Edit Flame Modal */}
      <EditFlameModal
        open={isFlameModalOpen}
        onClose={() => setIsFlameModalOpen(false)}
      />

      {/* Edit Marquee Modal */}
      <EditMarqueeModal
        open={isMarqueeModalOpen}
        onClose={() => setIsMarqueeModalOpen(false)}
      />
    </div>
  );
};

export default ViewImages;