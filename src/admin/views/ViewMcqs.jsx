import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { IoMdCloseCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { AdminContext } from "../../context/AdminContextProvider";
import Spinner from "../../components/Spinner"; // A loading spinner component
import AddMcq from "../add/AddMcq"; // Import AddMcq component
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL;

const ViewMcqs = () => {
  const { mcqs, setMcqs } = useContext(AdminContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedMcq, setSelectedMcq] = useState(null);

  // Fetch MCQs from the backend
  useEffect(() => {
    fetchMcqs();
  }, []);

  const fetchMcqs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/mcqs`
      );
      setMcqs(response?.data?.mcqs || []);
    } catch (error) {
      console.error("Error fetching MCQs:", error);
      toast.error("Failed to fetch MCQs.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete modal handlers
  const openConfirmModal = (mcq) => {
    setSelectedMcq(mcq);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setSelectedMcq(null);
    setIsConfirmModalOpen(false);
  };

  // Handle delete MCQ
  const handleDeleteMcq = async () => {
    if (!selectedMcq) return;

    try {
      await axios.delete(
        `${API_URL}/mcq/${selectedMcq._id}`
      );
      setMcqs((prev) => prev.filter((mcq) => mcq._id !== selectedMcq._id));
      toast.success("MCQ deleted successfully.");
      closeConfirmModal();
    } catch (error) {
      console.error("Error deleting MCQ:", error);
      toast.error("Failed to delete MCQ.");
    }
  };

  // Handle MCQ creation callback
  const handleMcqCreated = () => {
    fetchMcqs(); // Refresh the MCQ list
    setIsModalOpen(false); // Close the modal
  };

  return (
    <div className="container mx-auto mt-16 p-4">
      <div className="flex items-center mb-4">
        <h1 className="text-4xl font-bold">MCQs</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-[#155e75] text-white mx-5 px-5 rounded-full hover:bg-[#135367]"
        >
          Add +
        </button>
      </div>

      {loading ? (
        <Spinner /> // Display loading spinner while fetching MCQs
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mcqs.map((mcq) => (
            <div key={mcq._id} className="relative bg-[#bdd8dd] rounded-lg shadow-md p-4">
              {/* Delete button */}
              <button
                onClick={() => openConfirmModal(mcq)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <MdDelete size={24} />
              </button>

              {/* MCQ details */}
              <h2 className="text-xl font-semibold mb-2">{mcq.question}</h2>
              <ul className="mb-2">
                {mcq.options.map((option, index) => (
                  <li key={option._id} className="mb-1">
                    {index + 1}. {option.text}
                  </li>
                ))}
              </ul>
              <p className="font-semibold text-green-600">
                Correct Answer: {mcq.options[mcq.correctAnswer]?.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#bdd8dd] rounded-lg shadow-lg max-w-sm w-full p-6 relative">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete this MCQ:{" "}
              <span className="font-semibold">{selectedMcq?.question}</span>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-white rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMcq}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add MCQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#a1c1ca] rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute px-3 text-red-800 top-4 right-2 text-4xl font-bold"
            >
              <IoMdCloseCircle />
            </button>
            <AddMcq onMcqCreated={handleMcqCreated} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewMcqs;