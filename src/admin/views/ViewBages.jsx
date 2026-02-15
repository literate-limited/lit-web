import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { IoMdCloseCircle } from "react-icons/io";
import { AdminContext } from "../../context/AdminContextProvider";
import Spinner from "../../components/Spinner"; // A loading spinner component
import AddBadge from "../add/AddBadge"; // Import AddBadge component
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL;

const ViewBadges = () => {
  const { badges, setBadges } = useContext(AdminContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch badges from the backend
  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/badges`);
      setBadges(response?.data?.badges || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast.error("Failed to fetch badges.");
    } finally {
      setLoading(false);
    }
  };

  // Handle badge creation callback
  const handleBadgeCreated = () => {
    fetchBadges(); // Refresh the badge list
    setIsModalOpen(false); // Close the modal
  };

  return (
    <div className="container mx-auto mt-16 p-4">
      <div className="flex items-center mb-4">
        <h1 className="text-4xl font-bold">Badges</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-[#155e75] text-white mx-5 px-5 rounded-full hover:bg-[#135367]"
        >
          Add +
        </button>
      </div>

      {loading ? (
        <Spinner /> // Display loading spinner while fetching badges
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div key={badge?._id} className="relative bg-[#bdd8dd] rounded-lg shadow-md p-4">
              {/* Badge details */}
              <img src={badge?.imageURL} alt={badge?.name} className="w-full h-32 object-cover rounded-md mb-2" />
              <h2 className="text-xl font-semibold mb-2">{badge?.name}</h2>
              <p className="mb-2">{badge?.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Badge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#a1c1ca] rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute px-3 text-red-800 top-4 right-2 text-4xl font-bold"
            >
              <IoMdCloseCircle />
            </button>
            <AddBadge onBadgeCreated={handleBadgeCreated} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBadges;