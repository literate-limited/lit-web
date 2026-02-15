import { useState, useContext } from 'react';
import axios from 'axios';
import { IoMdCloseCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import UploadVideoLink from '../../components/Uploadvideos'; // Import the UploadVideoLink component
import { AdminContext } from '../../context/AdminContextProvider';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL;

const ViewVideos = () => {
  const { videos, setVideos, fetchVideos } = useContext(AdminContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Confirm delete modal handlers
  const openConfirmModal = (video) => {
    setSelectedVideo(video);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setSelectedVideo(null);
    setIsConfirmModalOpen(false);
  };

  // Handle delete video
  const handleDeleteVideo = async () => {
    if (!selectedVideo) return;

    try {
      console.log(`Deleting video with ID: ${selectedVideo._id}`);
      await axios.delete(`${API_URL}/delete-video/${selectedVideo._id}`);
      setVideos((prev) => prev.filter((video) => video._id !== selectedVideo._id));
      toast.success("Video deleted successfully.");
      closeConfirmModal();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video.");
    }
  };

  return (
    <div className="container mx-auto mt-16 p-4">
      <div className="flex items-center mb-4">
        <h1 className="text-4xl font-bold">Videos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-[#155e75] text-white mx-5 px-5 rounded-full hover:bg-[#135367]"
        >
         Add +
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <div key={video._id} className="relative bg-[#bdd8dd] rounded-lg shadow-md p-4">
            {/* Delete button */}
            <button
              onClick={() => openConfirmModal(video)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <MdDelete size={24} />
            </button>

            {/* Video details */}
            <h2 className="text-xl font-semibold mb-2">{video.title}</h2>
            <video controls src={video.link} className="flex justify-center w-full items-center h-52 mt-2"></video>
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#bdd8dd] rounded-lg shadow-lg max-w-sm w-full p-6 relative">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete this video:{" "}
              <span className="font-semibold">{selectedVideo?.title}</span>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-white rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVideo}
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
            <UploadVideoLink />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewVideos;